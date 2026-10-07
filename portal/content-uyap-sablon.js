(() => {
/**
 * LexUDF — Portal Şablon İndirici (Content Script)
 *
 * NOT: UDF çekirdeği (offset hesabı, bloklar, ZIP, dosya adı) js/core disipliniyle
 * BİREBİR aynıdır; ancak content-script MV3'te ES modülü import edemediği için
 * çekirdek bu dosyaya gömülüdür (sıfır bağımlılık). Çekirdekte değişiklik
 * yaparsanız iki tarafı senkron tutun — `npm test` (bölüm 11) sapmayı yakalar.
 * Kaynak geçmişi: sablon-paketi v2.7 (MIT, Av. Mustafa Yıldıran).
 * 
 * Bu script, UYAP Avukat Portal sayfasını dinamik olarak izler (MutationObserver).
 * "Pencere Görünümü" modalı açıldığında "Taraf Bilgileri" sekmesinin içine,
 * yazının hemen yanına LexUDF logo butonu ekler; hover'da "LexUDF ile indir" gösterir.
 * 
 * Sürüm 2.7 Yenilikleri:
 * - Tekil buton garantisi: başlık re-render olunca (sekme tıklamasında) yeni buton
 *   üretilmiyor, sekmedeki mevcut buton sahipleniliyor; klon fazlalıklar temizleniyor.
 * Sürüm 2.6 Yenilikleri:
 * - Buton sekme şeridine kardeş değil, sekmenin İÇİNE konuyor (şerit düzeni bozulmuyor).
 * Sürüm 2.5 Yenilikleri:
 * - Buton konumu: başlık yanından "Taraf Bilgileri" sekmesinin hemen yanına alındı
 *   (sekmeye zaten tıklanıyor, erişim kolay). Sekme geç render olursa belirince taşınır.
 * Sürüm 2.4 Yenilikleri:
 * - Buton konumu: kapat butonu yanından başlık metninin hemen yanına alındı
 *   (taraf bilgilerinin üstüne gelmiyor).
 * - Buton sadece logo (L rozeti); metin hover tooltip'ine taşındı.
 * Sürüm 2.3 Yenilikleri:
 * - Buton LexUDF markalı: lacivert zemin + altın L rozeti + "LexUDF ile indir" metni.
 * - AÇIKLAMALAR sonrası boş gövde satırı: iki yana yaslı + ilk satır 0,9 cm girintili.
 * - Dosya adı LexUDF sistemi: Dilekce_Mahkeme_DosyaNo_Taraf.udf (CBS_Dilekce_...).
 * Sürüm 2.2 (sıfır bağımlılık):
 * - ZIP de LexUDF ile birebir: native CompressionStream (C++) + minimal ZIP yazıcı.
 *   PizZip (~178KB) ve FileSaver kaldırıldı; content-script daha hızlı yüklenir,
 *   sıkıştırma daha hızlı, paket küçüldü.
 * Sürüm 2.1 (LexUDF paritesi):
 * - UDF çekirdeği LexUDF (js/core/xml.js + blocks.js) ile birebir: her paragrafta
 *   LineSpacing 0.5, string Alignment (1/2/3), gövdede FirstLineIndent 0,9 cm,
 *   footer + e-imzalıdır, doğru margin/renk, kod-noktası offset, CDATA kaçışları.
 * - KONU çift-nokta hatası düzeltildi, dosya adı LexUDF disiplini (ASCII + 40 sınır).
 * - Portal mantığı aynı: taraf eşleştirme, CBS/dava ayrımı, çok-taraflı gruplama.
 */

// --- 1. YAPILANDIRMA (KOLAY DÜZENLENEBİLİR ALAN) ---
const CONFIG = {
  // Detay Modalı (Popup) Başlık Seçicisi
  POPUP_TITLE_CONTAINER: 'div.dx-popup-title',
  
  // Modaldaki Kapat Butonu Seçicisi
  POPUP_CLOSE_BUTTON: 'div.dx-popup-title div[aria-label="Kapat"], div.dx-popup-title div[title="Kapat"]',
  
  // Modal başlığındaki bilgileri barındıran alan (Standart, Sık Kullanılanlar ve Duruşma Sorgulama için çoklu seçici)
  POPUP_HEADER_TEXT_DIV: 'div.dx-popup-title div.d-flex.align-items-center[title], div.dx-popup-title h4.m-0, div.dx-popup-title .dx-toolbar-label .dx-item-content > div',
  
  // Giriş yapan avukatın adını barındıran profil seçicisi
  LOGGED_IN_USER_SELECTOR: 'div.dropdown-toggle.nav-link.text-white, .dropdown-toggle',
  
  // Taraf tablosundaki satırlar
  PARTY_ROW_SELECTOR: 'tr.dx-data-row',

  // Font: sabit Times New Roman, 12 punto
  FONT_SIZE: 12,
  FONT_DEFAULT: 'Times New Roman'
};

// --- 2. POPUP-İZOLE CACHE VE OBSERVER SİSTEMİ ---
const popupCache = new WeakMap();
const activeObservers = new WeakMap();

// Global Tooltip referansı
let globalTooltipElement = null;

// --- 3. YARDIMCI FONKSİYONLAR ---

/**
 * Türkçe karakterleri normalize eder (eşleştirme kolaylığı için)
 * @param {string} text 
 * @returns {string}
 */
function normalizeText(text) {
  if (!text) return '';
  return text
    .replace(/[\[\]]/g, '')
    .trim()
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/**
 * İsim eşleştirme için adı token'lara ayırır (Av. öneki temizlenir).
 * @param {string} name
 * @returns {string[]}
 */
function normalizeNameTokens(name) {
  return normalizeText(name)
    .replace(/^av\.?\s+/, '')
    .replace(/\s+av\.?$/, '')
    .split(/[\s\-.]+/)
    .map(t => t.replace(/[^a-z]/g, ''))
    .filter(t => t.length > 1);
}

/**
 * Vekil hücresi ile giriş yapan avukatı karşılaştırır.
 * "Av." öneki, büyük/küçük harf ve ad-soyad sırası farklarına dayanıklıdır.
 * Soyad + en az bir ad tokeni tutmalı.
 * @param {string} attorneyName
 * @param {string} vekilText
 * @returns {boolean}
 */
function isAttorneyMatch(attorneyName, vekilText) {
  const aToks = normalizeNameTokens(attorneyName);
  const vToks = normalizeNameTokens(vekilText);
  if (aToks.length === 0 || vToks.length === 0) return false;
  const aSurname = aToks[aToks.length - 1];
  if (!vToks.includes(aSurname)) return false;
  const common = aToks.filter(t => vToks.includes(t));
  return common.length >= 2 || aToks.length === 1;
}

/**
 * Müdafi rollerini tanır (normalize edilmiş metinde arar).
 * SANIK / ŞÜPHELİ / SUÇA SÜRÜKLENEN ÇOCUK -> müdafi.
 */
function isMudafiRole(normRol) {
  if (normRol.includes('sanik') || normRol.includes('supheli') || normRol.includes('suruklenen')) return true;
  if (normRol.includes('suc') && normRol.includes('cocuk')) return true;
  return false;
}

/**
 * İmza unvanını rol sütununa göre belirler.
 * SANIK / ŞÜPHELİ / SUÇA SÜRÜKLENEN ÇOCUK varsa -> "MÜDAFİ",
 * gerisindeki tüm roller -> "... VEKİLİ".
 * Önce eşleşen müvekkilin rolüne bakılır; eşleşme yoksa dosyadaki
 * tüm tarafların rollerine bakılır (tek sanıklı dosya gibi).
 */
function decideUnvan(muvekkiller, taraflar, bosVarsayilan) {
  const mRoller = Array.from(new Set(
    (muvekkiller || []).map(m => turkishUpper(m.rol)).filter(Boolean)
  ));
  if (mRoller.length > 0) {
    if (mRoller.some(r => isMudafiRole(normalizeText(r)))) {
      return 'MÜDAFİ';
    }
    return mRoller.join(', ') + ' VEKİLİ';
  }
  const tRoller = Array.from(new Set(
    (taraflar || []).map(t => turkishUpper(typeof t === 'string' ? t : t.rol)).filter(Boolean)
  ));
  if (tRoller.length > 0) {
    if (tRoller.some(r => isMudafiRole(normalizeText(r)))) {
      return 'MÜDAFİ';
    }
    return tRoller.join(', ') + ' VEKİLİ';
  }
  return bosVarsayilan || 'MÜDAFİ';
}

/**
 * Giriş yapan avukatın adını profil alanından çeker
 * @returns {string}
 */
function getLoggedInAttorney() {
  const userEl = document.querySelector(CONFIG.LOGGED_IN_USER_SELECTOR);
  if (userEl) {
    return userEl.innerText.trim();
  }
  return '';
}

/**
 * Türkçe büyük harf dönüşümü (ı→I, i→İ, ö→Ö, ü→Ü, ş→Ş, ç→Ç, ğ→Ğ)
 * JavaScript'in standart toLocaleUpperCase('tr-TR') ile Türkçe kurallarına uygun dönüşüm.
 * @param {string} str
 * @returns {string}
 */
function turkishUpper(str) {
  if (!str) return '';
  return str.toLocaleUpperCase('tr-TR');
}

/**
 * Dilekçe fontu: sabit Times New Roman, her zaman 12 punto.
 * @returns {Promise<string>}
 */
async function getSelectedFontFamily() {
  return 'Times New Roman';
}

/**
 * Etiket uzunluğuna göre tab sayısını belirler.
 * Hedef: tüm iki noktaların aynı yatay tab pozisyonunda hizalanması.
 * - 8 karakterden kısa etiketler → 2 tab (8→16 tab stop)
 * - 8+ karakter etiketler → 1 tab (→16 tab stop)
 * @param {number} labelLength Etiket karakter uzunluğu
 * @returns {string} Tab karakterleri
 */
function getTabPadding(labelLength) {
  return labelLength <= 9 ? '\t\t' : '\t';
}

// --- 4. GLOBAL TOOLTIP YÖNETİMİ ---

function initGlobalTooltip() {
  if (document.getElementById('uyap-eklenti-tooltip')) {
    globalTooltipElement = document.getElementById('uyap-eklenti-tooltip');
    return;
  }
  
  const tooltip = document.createElement('div');
  tooltip.id = 'uyap-eklenti-tooltip';
  tooltip.className = 'uyap-tooltip-hidden';
  
  const content = document.createElement('div');
  content.className = 'uyap-tooltip-content';
  tooltip.appendChild(content);
  
  const arrow = document.createElement('div');
  arrow.className = 'uyap-tooltip-arrow';
  tooltip.appendChild(arrow);
  
  document.body.appendChild(tooltip);
  globalTooltipElement = tooltip;
}

function showTooltip(targetButton, text) {
  if (!globalTooltipElement) initGlobalTooltip();
  
  const content = globalTooltipElement.querySelector('.uyap-tooltip-content');
  if (content) {
    content.innerText = text;
  }
  
  const rect = targetButton.getBoundingClientRect();
  globalTooltipElement.className = 'uyap-tooltip-visible';
  
  const tooltipWidth = globalTooltipElement.offsetWidth;
  const tooltipHeight = globalTooltipElement.offsetHeight;
  
  let top = rect.top - tooltipHeight - 8;
  let left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
  
  const padding = 10;
  const viewportWidth = window.innerWidth;
  
  if (left < padding) {
    left = padding;
  } else if (left + tooltipWidth > viewportWidth - padding) {
    left = viewportWidth - tooltipWidth - padding;
  }
  
  if (top < padding) {
    top = rect.bottom + 8;
    globalTooltipElement.querySelector('.uyap-tooltip-arrow').style.display = 'none';
  } else {
    globalTooltipElement.querySelector('.uyap-tooltip-arrow').style.display = 'block';
  }
  
  globalTooltipElement.style.top = `${top}px`;
  globalTooltipElement.style.left = `${left}px`;
}

function hideTooltip() {
  if (globalTooltipElement) {
    globalTooltipElement.className = 'uyap-tooltip-hidden';
  }
}

// --- 5. ARAYÜZ ELEMANI OLUŞTURMA ---

function createDownloadButton() {
  const button = document.createElement('button');
  button.className = 'uyap-sablon-indir-btn not-ready';
  button.setAttribute('aria-label', 'LexUDF ile indir - Taraf bilgisi bekleniyor');
  button.type = 'button';

  // Sadece LexUDF logosu (CSS rozeti, harici resim gerektirmez).
  // Metin yok; hover'da tooltip "LexUDF ile indir" gösterir.
  const badge = document.createElement('span');
  badge.className = 'lexudf-badge';
  badge.textContent = 'L';
  button.appendChild(badge);

  button.addEventListener('mouseenter', () => {
    let tooltipText = 'Taraf Bilgileri Sekmesini Açın';
    if (button.classList.contains('loading')) {
      tooltipText = 'Dilekçe Dolduruluyor...';
    } else if (button.classList.contains('ready')) {
      tooltipText = 'LexUDF ile indir';
    }
    showTooltip(button, tooltipText);
  });

  button.addEventListener('mouseleave', () => {
    hideTooltip();
  });

  return button;
}

function setButtonReady(button) {
  button.classList.remove('not-ready');
  button.classList.add('ready');
  button.setAttribute('aria-label', 'LexUDF ile indir - Hazır');
}

function setButtonLoading(button) {
  button.classList.add('loading');
}

function clearButtonLoading(button) {
  button.classList.remove('loading');
}

// --- 6. VERİ ÇEKME VE MÜVEKKİL TESPİT MANTIĞI ---

function extractPartiesAndRoles(attorneyName, searchScope) {
  const result = {
    muvekkiller: [], // Array of {rol, adi}
    karsi_taraflar: [], // Array of {rol, adi}
    taraflar: []
  };

  const normalizedAttorney = normalizeText(attorneyName);
  const rows = searchScope.querySelectorAll(CONFIG.PARTY_ROW_SELECTOR);

  rows.forEach(row => {
    const cells = row.querySelectorAll('td');
    if (cells.length === 4) {
      const rol = cells[0].innerText.trim();
      const tipi = cells[1].innerText.trim();
      const adi = cells[2].innerText.trim();
      const vekil = cells[3].innerText.trim();
      
      if (rol && adi) {
        const taraf = { rol, tipi, adi, vekil };
        result.taraflar.push(taraf);

        if (normalizedAttorney && isAttorneyMatch(attorneyName, vekil)) {
          result.muvekkiller.push({ rol, adi });
        } else {
          result.karsi_taraflar.push({ rol, adi });
        }
      }
    }
  });

  return result;
}

function parseCaseHeader(titleContainer) {
  const textDiv = titleContainer.querySelector(CONFIG.POPUP_HEADER_TEXT_DIV);
  let mahkeme = 'Tespit Edilemedi';
  let dosyaNo = 'Tespit Edilemedi';
  let dosyaTuru = 'Dava Dosyası';
  
  if (textDiv) {
    let titleText = textDiv.getAttribute('title') || textDiv.innerText.trim();
    titleText = titleText.replace(/\s+/g, ' '); // Fazla boşlukları temizle
    
    const match1 = titleText.match(/^([\d]+\/[\d]+)\s+(.+?)(?:\s*-\s*(.+))?$/);
    const match2 = titleText.match(/^(.+?)\s+([\d]+\/[\d]+)$/);
    
    if (match1) {
      dosyaNo = match1[1].trim();
      mahkeme = match1[2].trim();
      if (match1[3]) dosyaTuru = match1[3].trim();
    } else if (match2) {
      mahkeme = match2[1].trim();
      dosyaNo = match2[2].trim();
    } else {
      mahkeme = titleText;
    }
  }

  const attorneyName = getLoggedInAttorney();
  const bugun = new Date();
  const gun = String(bugun.getDate()).padStart(2, '0');
  const ay = String(bugun.getMonth() + 1).padStart(2, '0');
  const yil = bugun.getFullYear();
  const formatliBugun = `${gun}.${ay}.${yil}`;
  
  return {
    mahkeme,
    dosya_no: dosyaNo,
    dosya_turu: dosyaTuru,
    tarih: formatliBugun,
    avukat_adi: attorneyName
  };
}

function isPartyTableRendered(popupScope) {
  const rows = popupScope.querySelectorAll(CONFIG.PARTY_ROW_SELECTOR);
  return Array.from(rows).some(row => row.querySelectorAll('td').length === 4);
}

function findPopupContainer(titleContainer) {
  let current = titleContainer;
  while (current && current !== document.body) {
    if (current.classList && (
      current.classList.contains('dx-popup-wrapper') ||
      current.classList.contains('dx-overlay-wrapper')
    )) {
      return current;
    }
    current = current.parentElement;
  }
  return titleContainer.parentElement || titleContainer;
}

/**
 * Popup içindeki "Taraf Bilgileri" sekmesini bulur (DevExtreme tab yapıları).
 * Sekme metni normalize edilip "taraf" aranır; "bilg" içeren önceliklidir.
 * @returns {Element|null}
 */
function findTarafTab(popupScope) {
  const selectors = ['.dx-tab', '[role="tab"]', '.dx-tabs .dx-item', '.dx-tabpanel-tabs .dx-item'];
  const seen = new Set();
  let fallback = null;
  for (const sel of selectors) {
    let els = [];
    try {
      els = popupScope.querySelectorAll(sel);
    } catch (e) {
      continue;
    }
    for (const el of els) {
      if (seen.has(el)) continue;
      seen.add(el);
      const t = normalizeText(el.innerText || el.textContent || '');
      if (!t.includes('taraf')) continue;
      if (t.includes('bilg')) return el;
      if (!fallback) fallback = el;
    }
  }
  return fallback;
}

/**
 * Butonu "Taraf Bilgileri" sekmesinin İÇİNE, yazının hemen yanına koyar
 * (sekme şeridine kardeş eleman girmek şerit düzenini bozuyordu).
 * Sekme geç render olmuşsa belirince taşınır.
 * Sekme yoksa ve buton DOM'dan kopmuşsa başlık metninin yanına geri koyar.
 */
function ensureButtonPlacement(titleContainer, popupScope) {
  const entry = popupCache.get(titleContainer);
  if (!entry || !entry.button) return;
  const btn = entry.button;
  const tab = findTarafTab(popupScope);
  if (tab) {
    if (btn.parentElement !== tab) {
      tab.appendChild(btn);
    }
  } else if (!btn.isConnected) {
    const textDiv = titleContainer.querySelector(CONFIG.POPUP_HEADER_TEXT_DIV);
    if (textDiv) textDiv.insertAdjacentElement('afterend', btn);
  }
}

/**
 * Aynı popup kapsamında buton zaten varsa yeniden üretmeden sahiplenir.
 * Başlık re-render olunca (sekme tıklamasında oluyor) yeni başlık düğümü
 * guard'sız gelir; eski buton sekmenin içinde yaşıyor olur — yenisini üretmek
 * yan yana logo birikmesine yol açar.
 * Klonlanmış fazlalıklar temizlenir, parti verisi kurtarılır.
 * @returns {boolean} sahiplenildiyse true (yeni buton üretme)
 */
function adoptExistingButton(titleContainer, popupScope, textDiv) {
  const scopeButtons = Array.from(popupScope.querySelectorAll('.uyap-sablon-indir-btn'));
  if (scopeButtons.length === 0) return false;

  const prevEntry = popupCache.get(titleContainer);
  const keep = (prevEntry && prevEntry.button && scopeButtons.includes(prevEntry.button))
    ? prevEntry.button
    : scopeButtons[0];
  scopeButtons.forEach(b => { if (b !== keep) b.remove(); });

  const titleText = textDiv.getAttribute('title') || textDiv.innerText.trim();
  const lower = titleText.toLowerCase();
  const isCBS = lower.includes('cbs') && (lower.includes('soruşturma') || lower.includes('sorusturma'));

  let entry = prevEntry;
  if (!entry) {
    entry = { partyData: null, button: keep };
    popupCache.set(titleContainer, entry);
    if (isCBS) {
      entry.partyData = { muvekkiller: [], karsi_taraflar: [], isCBS: true };
      setButtonReady(keep);
    } else if (isPartyTableRendered(popupScope)) {
      entry.partyData = extractPartiesAndRoles(getLoggedInAttorney(), popupScope);
      setButtonReady(keep);
    }
  } else {
    entry.button = keep;
  }
  if (!entry.partyData) {
    startPassivePartyObserver(titleContainer, popupScope);
  }
  ensureButtonPlacement(titleContainer, popupScope);
  titleContainer.setAttribute('data-uyap-sablon-button-added', 'true');
  return true;
}

// --- 7. PASİF TARAF BİLGİSİ İZLEYİCİ ---

function startPassivePartyObserver(titleContainer, popupScope) {
  if (activeObservers.has(titleContainer)) {
    return;
  }

  if (isPartyTableRendered(popupScope)) {
    handlePartyDataFound(titleContainer, popupScope);
    return;
  }

  const observer = new MutationObserver(() => {
    if (isPartyTableRendered(popupScope)) {
      observer.disconnect();
      activeObservers.delete(titleContainer);
      handlePartyDataFound(titleContainer, popupScope);
    }
  });

  observer.observe(popupScope, {
    childList: true,
    subtree: true
  });

  activeObservers.set(titleContainer, observer);
}

function handlePartyDataFound(titleContainer, popupScope) {
  const attorneyName = getLoggedInAttorney();
  const partyData = extractPartiesAndRoles(attorneyName, popupScope);
  
  const cacheEntry = popupCache.get(titleContainer);
  if (cacheEntry) {
    cacheEntry.partyData = partyData;
    if (cacheEntry.button) {
      setButtonReady(cacheEntry.button);
      if (cacheEntry.button.matches(':hover')) {
        showTooltip(cacheEntry.button, 'LexUDF ile indir');
      }
    }
    console.log("LexUDF Portal: Taraf verileri okundu ve buton aktifleştirildi.", {
      avukat: attorneyName,
      muvekkiller: partyData.muvekkiller,
      karsi: partyData.karsi_taraflar
    });
  }
}

// --- 8. UDF CORE (LexUDF ile birebir — UYAP-onaylı kusursuzluk kaynağı) ---
// Kaynak: lexudf/js/core/xml.js + js/core/blocks.js
// Neden birebir: satır aralığı, girinti, footer, offset hesabı ve renkler
// UYAP'ta doğrulandı; burada sapma olursa test/görünüm bozulur.

function sanitizeXmlText(value) {
  return String(value ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
}

// UDF startOffset/length KOD NOKTASI sayar (JS .length UTF-16 sayar, emoji'de 2 sayar).
// LexUDF golden testi ile sabitlendi.
function udfTextLength(s) {
  let n = 0;
  for (const _ of s) n++;
  return n;
}

function escapeCdata(text) {
  return sanitizeXmlText(text).replace(/]]>/g, ']]]]><![CDATA[>');
}

function escapeXmlAttr(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function udfAttrsToStr(a) {
  let s = '';
  for (const k in a) {
    s += ' ' + k + '="' + escapeXmlAttr(a[k]) + '"';
  }
  return s;
}

function createUdfDocument(font) {
  let offset = 0;
  let fullText = '';
  let bodyParas = '';
  const safeFont = escapeXmlAttr(font || CONFIG.FONT_DEFAULT);

  function addPara(pAttrs, runs) {
    let inner = '';
    for (const r of runs) {
      const rawText = escapeCdata(r.text);
      const len = udfTextLength(rawText);
      inner += '<content' + udfAttrsToStr(r.attrs || {}) + ' startOffset="' + offset + '" length="' + len + '" />';
      fullText += rawText;
      offset += len;
    }
    bodyParas += '<paragraph' + udfAttrsToStr(pAttrs) + '>' + inner + '</paragraph>';
  }

  function addEmptyLine(alignment) {
    addPara({ Alignment: alignment || '3', LineSpacing: '0.5' }, [{ text: '\n', attrs: {} }]);
  }

  // SAF: belge durumunu değiştirmez, kaç kez çağrılırsa aynı XML'i döndürür.
  function toXml() {
    let off = offset;
    let text = fullText;
    let footerInner = '';
    const t1 = '5070 Sayılı Kanuna Göre Güvenli Elektronik İmza ile İmzalanmıştır.';
    footerInner += '<content size="8" foreground="-196608" startOffset="' + off + '" length="' + udfTextLength(t1) + '" />';
    text += t1; off += udfTextLength(t1);
    const t2 = '\n';
    footerInner += '<content family="' + safeFont + '" size="12" description="Gövde" startOffset="' + off + '" length="' + udfTextLength(t2) + '" />';
    text += t2; off += udfTextLength(t2);
    text += '\n';

    return '<?xml version="1.0" encoding="UTF-8" ?> \n\n' +
      '<template format_id="1.8" >\n' +
      '<content><![CDATA[' + text + ']]></content>' +
      '<properties><pageFormat mediaSizeName="1" leftMargin="42.525000000000006" rightMargin="42.525000000000006" topMargin="42.525000000000006" bottomMargin="42.525000000000006" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>\n' +
      '<elements resolver="hvl-default" >\n' + bodyParas +
      '<footer><paragraph Alignment="1">' + footerInner + '</paragraph></footer>\n</elements>\n' +
      '<styles><style name="default" description="Geçerli" family="' + safeFont + '" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=' + safeFont + ',name=' + safeFont + ',style=plain,size=12]" /><style name="hvl-default" family="' + safeFont + '" size="12" description="Gövde" /></styles>\n</template>\n';
  }

  return { addPara, addEmptyLine, toXml };
}

// --- LexUDF paragraf kalıpları (birebir) ---

// Ortalı, kalın başlık (T.C., mahkeme adı)
function udfCentered(doc, text) {
  doc.addPara({ Alignment: '1', LineSpacing: '0.5' }, [{ text, attrs: { bold: 'true' } }]);
}

// "ETİKET\t: değer" satırı (etiket kalın, iki run; boşluk etikette)
function udfRow(doc, label, value, valueAttrs) {
  doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
    { text: label, attrs: { bold: 'true' } },
    { text: (value || '') + '\n', attrs: valueAttrs || {} }
  ]);
}

function udfAciklamalarBaslik(doc) {
  doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
    { text: 'AÇIKLAMALAR\t:\n', attrs: { bold: 'true' } }
  ]);
}

// İlk satır girintili gövde metni (25.51181 pt = 0,9 cm)
function udfBodyText(doc, text) {
  doc.addPara({ Alignment: '3', FirstLineIndent: '25.51181', LineSpacing: '0.5' }, [
    { text, attrs: { resolver: 'hvl-default' } }
  ]);
}

// AÇIKLAMALAR sonrası boş gövde satırı: iki yana yaslı + ilk satır 0,9 cm girintili.
// Kullanıcı Enter'a basıp yazmaya başlayınca imleç bu stilde açılır (LexUDF gövde disiplini).
function udfEmptyBodyLine(doc) {
  doc.addPara({ Alignment: '3', FirstLineIndent: '25.51181', LineSpacing: '0.5' }, [
    { text: '\n', attrs: { resolver: 'hvl-default' } }
  ]);
}

// Sağa yaslı imza: 1 boş satır + Av. + e-imzalıdır
function udfSignature(doc, avukat) {
  doc.addEmptyLine('2');
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: 'Av. ' + avukat + '\n', attrs: {} }]);
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: 'e-imzalıdır\n', attrs: {} }]);
}

// İmza unvanlı varyant (portal şablonu ana mantığı korunur: MÜDAFİ/VEKİLİ sağda kalın,
// altında Av. + e-imzalıdır). Boşluk ve hizalama LexUDF imzasıyla aynıdır.
function udfSignatureWithUnvan(doc, unvan, avukat) {
  doc.addEmptyLine('2');
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: unvan + '\n', attrs: { bold: 'true' } }]);
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: 'Av. ' + avukat + '\n', attrs: {} }]);
  doc.addPara({ Alignment: '2', LineSpacing: '0.5' }, [{ text: 'e-imzalıdır\n', attrs: {} }]);
}

// Dosya adı: LexUDF ile aynı (Türkçe->ASCII, parça başı 40 karakter)
const TR_MAP_FILENAME = { 'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'İ': 'I', 'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U' };
function cleanPartForFilename(str) {
  if (!str) return '';
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, m => TR_MAP_FILENAME[m])
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
const MAX_FILENAME_PART = 40;
function shortPartForFilename(str) {
  const cleaned = cleanPartForFilename(str);
  return cleaned.length > MAX_FILENAME_PART ? cleaned.slice(0, MAX_FILENAME_PART).replace(/_+$/, '') : cleaned;
}

// --- LexUDF minimal ZIP (birebir, sıfır bağımlılık) ---
// UDF = içinde content.xml olan ZIP. Native CompressionStream (C++, tarayıcı gömülü)
// PizZip'in JS-deflate'inden hızlı, ~178KB kütüphane yüklemez, content-script'i hafifletir.
// Kaynak: lexudf/js/core/zip.js
function makeUdfCrc32Table() {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) { c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)); }
    table[n] = c;
  }
  return table;
}
const UDF_CRC32_TABLE = makeUdfCrc32Table();

function udfCrc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ UDF_CRC32_TABLE[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

async function createUdfZipBlob(filename, uncompressedData) {
  const encoder = new TextEncoder();
  const fileBytes = encoder.encode(uncompressedData);
  const fileCrc = udfCrc32(fileBytes);
  const uncompressedSize = fileBytes.length;

  // Native sıkıştırma yoksa/bozulursa sıkıştırmasız (stored) yazılır;
  // indirme hiçbir ortamda yarıda kesilmez.
  let payloadBytes = fileBytes;
  let zipMethod = 0;
  if (typeof CompressionStream !== 'undefined') {
    try {
      const stream = new Blob([fileBytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      const compressedBuffer = await new Response(stream).arrayBuffer();
      payloadBytes = new Uint8Array(compressedBuffer);
      zipMethod = 8;
    } catch (err) {
      console.warn('LexUDF Portal: native sıkıştırma kullanılamadı, sıkıştırmasız yazılıyor.', err);
    }
  } else {
    console.warn('LexUDF Portal: CompressionStream yok, sıkıştırmasız yazılıyor.');
  }
  const payloadSize = payloadBytes.length;

  const fileNameBytes = encoder.encode(filename);
  const fileNameLen = fileNameBytes.length;

  const localHeaderLen = 30 + fileNameLen;
  const cdHeaderLen = 46 + fileNameLen;
  const eocdLen = 22;

  const totalLen = localHeaderLen + payloadSize + cdHeaderLen + eocdLen;
  const zipBuffer = new Uint8Array(totalLen);
  const view = new DataView(zipBuffer.buffer);

  // Local file header
  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, zipMethod, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, fileCrc, true);
  view.setUint32(18, payloadSize, true);
  view.setUint32(22, uncompressedSize, true);
  view.setUint16(26, fileNameLen, true);
  view.setUint16(28, 0, true);
  zipBuffer.set(fileNameBytes, 30);

  zipBuffer.set(payloadBytes, localHeaderLen);

  // Central directory
  const cdOffset = localHeaderLen + payloadSize;
  view.setUint32(cdOffset, 0x02014b50, true);
  view.setUint16(cdOffset + 4, 20, true);
  view.setUint16(cdOffset + 6, 20, true);
  view.setUint16(cdOffset + 8, 0, true);
  view.setUint16(cdOffset + 10, zipMethod, true);
  view.setUint16(cdOffset + 12, 0, true);
  view.setUint16(cdOffset + 14, 0, true);
  view.setUint32(cdOffset + 16, fileCrc, true);
  view.setUint32(cdOffset + 20, payloadSize, true);
  view.setUint32(cdOffset + 24, uncompressedSize, true);
  view.setUint16(cdOffset + 28, fileNameLen, true);
  view.setUint16(cdOffset + 30, 0, true);
  view.setUint16(cdOffset + 32, 0, true);
  view.setUint16(cdOffset + 34, 0, true);
  view.setUint16(cdOffset + 36, 0, true);
  view.setUint32(cdOffset + 38, 0, true);
  // Tek dosyalı arşivde local header her zaman 0'dadır.
  view.setUint32(cdOffset + 42, 0, true);
  zipBuffer.set(fileNameBytes, cdOffset + 46);

  // End of central directory
  const eocdOffset = cdOffset + cdHeaderLen;
  view.setUint32(eocdOffset, 0x06054b50, true);
  view.setUint16(eocdOffset + 4, 0, true);
  view.setUint16(eocdOffset + 6, 0, true);
  view.setUint16(eocdOffset + 8, 1, true);
  view.setUint16(eocdOffset + 10, 1, true);
  view.setUint32(eocdOffset + 12, cdHeaderLen, true);
  view.setUint32(eocdOffset + 16, cdOffset, true);
  view.setUint16(eocdOffset + 20, 0, true);

  return zipBuffer;
}

function downloadUdfFile(zipBytes, fileName) {
  const blob = new Blob([zipBytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// LexUDF dosya adı sistemi: {Tip}_{Mahkeme}_{DosyaNo}_{Taraf}.udf
// Örn: Yalova İcra Dairesi + 2026/12313 -> Dilekce_YALOVA_ICRA_DAIRESI_2026_12313_Ali_Veli.udf
// Her parça ASCII + 40 karakter sınırlı (shortPartForFilename), toplam <200 (Windows güvenli).
function buildDavaFileName(mahkeme, dosyaNo, muvekkiller, avukatAdi) {
  const ilkTaraf = (muvekkiller && muvekkiller.length > 0 && muvekkiller[0].adi) || '';
  const parts = [
    shortPartForFilename(mahkeme),
    shortPartForFilename(dosyaNo),
    shortPartForFilename(ilkTaraf || avukatAdi)
  ].filter(Boolean);
  const name = 'Dilekce' + (parts.length ? '_' + parts.join('_') : '') + '.udf';
  return name || 'dilekce.udf';
}

function buildCbsFileName(mahkeme, dosyaNo, avukatAdi) {
  const parts = [
    shortPartForFilename(mahkeme),
    shortPartForFilename(dosyaNo),
    shortPartForFilename(avukatAdi)
  ].filter(Boolean);
  const name = 'CBS_Dilekce' + (parts.length ? '_' + parts.join('_') : '') + '.udf';
  return name || 'dilekce.udf';
}

// --- 9. UDF DOSYA OLUŞTURMA VE İNDİRME ---

/**
 * Uzun etiketleri (label) sekme hizasını bozmaması için kelime bazlı satırlara böler.
 */
function wrapLabel(label, maxLength = 17) {
  if (!label) return [''];
  const words = label.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length === 0) {
      currentLine = word;
    } else if (currentLine.length + 1 + word.length <= maxLength) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * CBS / soruşturma UDF'i (LexUDF cmk/inceleme disipliniyle).
 * Ana mantık aynı (minimal: başlık + DOSYA NO + imza); fark:
 * LineSpacing 0.5, string Alignment, footer + e-imzalıdır, doğru margin/renk,
 * kod-noktası offset ve CDATA kaçışları.
 *
 * @param {Object} data Dava verileri
 */
async function generateCbsUdfDocument(data) {
  try {
    const mahkeme = turkishUpper(data.mahkeme);
    const dosyaNo = data.dosya_no || '';
    const avukatAdi = turkishUpper(data.avukat_adi);

    const fontFamily = await getSelectedFontFamily();
    const doc = createUdfDocument(fontFamily);

    // CBS imza unvanı: rol sütununa göre otomatik (SANIK/ŞÜPHELİ/SSÇ -> MÜDAFİ).
    const imzaUnvani = decideUnvan(data.muvekkiller, data.taraflar, 'MÜDAFİ');
    console.log('UYAP CBS imza:', imzaUnvani, '| muvekkiller:', data.muvekkiller, '| taraflar:', data.taraflar);

    // Başlık: LexUDF dava disiplini — T.C. + mahkeme + boş satır (aynı paragrafta \n\n).
    udfCentered(doc, 'T.C.\n');
    udfCentered(doc, mahkeme + '\n\n');

    // DOSYA NO: etiket kalın, boşluk etikette (LexUDF row disiplini).
    udfRow(doc, 'DOSYA NO' + getTabPadding('DOSYA NO'.length) + ': ', dosyaNo);

    // Gövde bilerek boş (portal şablonu ana mantığı); imza LexUDF imzasıyla aynı
    // hizada: unvan kalın sağda, altında Av. + e-imzalıdır, öncesinde tek boş satır.
    udfSignatureWithUnvan(doc, imzaUnvani, avukatAdi);

    const xml = doc.toXml();
    const zipBytes = await createUdfZipBlob('content.xml', xml);

    const dosyaAdi = buildCbsFileName(mahkeme, dosyaNo, avukatAdi);

    downloadUdfFile(zipBytes, dosyaAdi);
    console.log(`CBS Dilekçesi başarıyla oluşturuldu: ${dosyaAdi}`);

  } catch (error) {
    console.error("CBS UDF dilekçe oluşturulurken hata:", error);
    alert("CBS Dilekçesi oluşturulurken hata oluştu.\nHata: " + error.message);
  }
}

async function generateUdfDocument(data) {
  try {
    // 1. Türkçe büyük harf dönüşümleri
    const mahkeme = turkishUpper(data.mahkeme);
    const dosyaNo = data.dosya_no || '';
    const avukatAdi = turkishUpper(data.avukat_adi);

    // İmza / vekil unvanı: rol sütununa göre, her dosya tipinde aynı kural.
    // SANIK / ŞÜPHELİ / SSÇ -> MÜDAFİ, gerisi -> VEKİLİ.
    const imzaUnvani = decideUnvan(data.muvekkiller, data.taraflar, 'MÜVEKKİL VEKİLİ');
    console.log('UYAP dava imza:', imzaUnvani, '| muvekkiller:', data.muvekkiller, '| taraflar:', data.taraflar);

    // 2. UDF belgesini LexUDF disipliniyle oluştur
    const fontFamily = await getSelectedFontFamily();
    const doc = createUdfDocument(fontFamily);

    // ═══════════════════════════════════════════
    // YARDIMCI FONKSİYONLAR (portal çok-taraflı yapı korunur)
    // ═══════════════════════════════════════════
    function addFieldBlock(labelStr, valueStr) {
      const labelLines = wrapLabel(labelStr, 17);
      for (let i = 0; i < labelLines.length - 1; i++) {
        doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
          { text: labelLines[i] + '\n', attrs: { bold: 'true' } }
        ]);
      }
      const lastLabel = labelLines[labelLines.length - 1];
      const tabsForLabel = getTabPadding(lastLabel.length);
      // LexUDF row: boşluk etiketin sonunda, değerde başta boşluk yok.
      udfRow(doc, lastLabel + tabsForLabel + ': ', valueStr || '');
    }

    function addPartyBlock(partiesArray) {
      if (!partiesArray || partiesArray.length === 0) {
        return;
      }

      // 1. Rollerine göre grupla
      const roleMap = new Map();
      for (const p of partiesArray) {
        const r = turkishUpper(p.rol);
        if (!roleMap.has(r)) {
          roleMap.set(r, []);
        }
        roleMap.get(r).push(turkishUpper(p.adi));
      }

      // 2. Her rolü kendi içinde yazdır
      const rolesArray = Array.from(roleMap.entries());
      for (let rIndex = 0; rIndex < rolesArray.length; rIndex++) {
        const [role, names] = rolesArray[rIndex];
        const labelLines = wrapLabel(role, 17);
        const lastLabel = labelLines[labelLines.length - 1];
        const tabsForLabel = getTabPadding(lastLabel.length);

        // Önceki kırpılmış etiket parçalarını (varsa) yazdır
        for (let j = 0; j < labelLines.length - 1; j++) {
          doc.addPara({ Alignment: '3', LineSpacing: '0.5' }, [
            { text: labelLines[j] + '\n', attrs: { bold: 'true' } }
          ]);
        }

        if (names.length === 1) {
          // Tek kişi varsa numarasız
          udfRow(doc, lastLabel + tabsForLabel + ': ', names[0]);
        } else {
          // Birden fazla kişi varsa numaralandırarak alt alta
          for (let i = 0; i < names.length; i++) {
            if (i === 0) {
              udfRow(doc, lastLabel + tabsForLabel + ': ', `${i + 1}- ` + names[i]);
            } else {
              udfRow(doc, getTabPadding(0) + ': ', `${i + 1}- ` + names[i]);
            }
          }
        }

        // Eğer bu rol son rol değilse, araya boşluk koyma (kullanıcı isteği: bitişik)
      }
    }

    // ═══════════════════════════════════════════
    // BAŞLIK BLOĞU (Ortalı, Kalın) — LexUDF: T.C. + MAHKEME + boş satır
    // ═══════════════════════════════════════════
    udfCentered(doc, 'T.C.\n');
    udfCentered(doc, mahkeme + '\n\n');

    // ═══════════════════════════════════════════
    // BİLGİ SATIRLARI (Sola Yaslı, LineSpacing 0.5)
    // ═══════════════════════════════════════════
    addFieldBlock('DOSYA NO', dosyaNo);
    addPartyBlock(data.muvekkiller);
    addFieldBlock(imzaUnvani === 'MÜDAFİ' ? 'MÜDAFİ' : 'VEKİLİ', 'Av. ' + avukatAdi);
    addPartyBlock(data.karsi_taraflar);
    addFieldBlock('KONU', '');
    udfAciklamalarBaslik(doc);
    // Boş gövde satırı: iki yana yaslı, ilk satır 0,9 cm girintili (kullanıcı buraya yazar).
    udfEmptyBodyLine(doc);

    // İmza: LexUDF hizasında (tek boş satır + unvan kalın sağda + Av. + e-imzalıdır).
    // Eski sondaki 2 boş satır kaldırıldı — golden'da footer doğrudan e-imzalıdır'dan sonra gelir.
    udfSignatureWithUnvan(doc, imzaUnvani, avukatAdi);

    // 3. content.xml üret (EKLER bölümü kullanıcı isteğiyle kaldırıldı)
    const xml = doc.toXml();

    // 4. Native minimal ZIP (sıfır bağımlılık) + indir
    const zipBytes = await createUdfZipBlob('content.xml', xml);

    // 5. İndir (LexUDF dosya adı disiplini: Tip_Mahkeme_DosyaNo_Taraf)
    const dosyaAdi = buildDavaFileName(mahkeme, dosyaNo, data.muvekkiller, avukatAdi);

    downloadUdfFile(zipBytes, dosyaAdi);
    console.log(`Dilekçe başarıyla UDF olarak oluşturuldu: ${dosyaAdi}`);

  } catch (error) {
    console.error("UDF dilekçe oluşturulurken bir hata oluştu:", error);
    alert("Dilekçe oluşturulurken bir hata oluştu. Detaylar tarayıcı konsolunda (F12) yazmaktadır.\nHata: " + error.message);
  }
}

// --- 10. DOM ENJEKSİYONU ---

// Not: indir butonu sadece logolu (L rozeti) LexUDF butonudur; metin yok,
// hover'da tooltip gösterir. Konumu: "Taraf Bilgileri" sekmesinin İÇİNDE,
// yazının hemen yanı (sekme yoksa başlık metninin yanı; sekme belirince taşınır).

function checkAndInjectPopup() {
  const popupTitles = document.querySelectorAll(CONFIG.POPUP_TITLE_CONTAINER);
  
  popupTitles.forEach(titleContainer => {
    const textDiv = titleContainer.querySelector(CONFIG.POPUP_HEADER_TEXT_DIV);
    if (!textDiv) return;
    
    const closeBtn = titleContainer.querySelector(CONFIG.POPUP_CLOSE_BUTTON);
    if (!closeBtn) return;

    const popupScope = findPopupContainer(titleContainer);

    // Aynı popup'ta buton zaten varsa yeniden üretme (başlık sekme tıklayınca
    // re-render oluyor, guard yeni düğümde tutmuyor; eski buton sekmede yaşar).
    if (adoptExistingButton(titleContainer, popupScope, textDiv)) return;

    if (titleContainer.getAttribute('data-uyap-sablon-button-added') === 'true') {
      // Sekme geç render olmuş olabilir; butonu yanına taşı.
      ensureButtonPlacement(titleContainer, popupScope);
      return;
    }

    const downloadBtn = createDownloadButton();
    
    const titleText = textDiv.getAttribute('title') || textDiv.innerText.trim();
    const isCBS = titleText.toLowerCase().includes('cbs') && (titleText.toLowerCase().includes('soruşturma') || titleText.toLowerCase().includes('sorusturma'));
    
    popupCache.set(titleContainer, {
      partyData: isCBS ? { muvekkiller: [], karsi_taraflar: [], isCBS: true } : null,
      button: downloadBtn
    });

    if (isCBS) {
      setButtonReady(downloadBtn);
    }
    
    // Tıklama olayı dinleyicisi
    downloadBtn.addEventListener('click', async (event) => {
      event.stopPropagation();
      
      if (!downloadBtn.classList.contains('ready')) {
        if (isPartyTableRendered(popupScope)) {
          handlePartyDataFound(titleContainer, popupScope);
        } else {
          console.warn('LexUDF Portal: taraf tablosu bulunamadı, indirme başlatılmadı.');
          showTooltip(downloadBtn, 'Taraf Bilgileri Bulunamadı');
          setTimeout(hideTooltip, 2500);
          return;
        }
      }
      
      const updatedCache = popupCache.get(titleContainer);
      if (!updatedCache || !updatedCache.partyData) {
        return;
      }
      
      setButtonLoading(downloadBtn);
      if (downloadBtn.matches(':hover')) {
        showTooltip(downloadBtn, 'Dilekçe Dolduruluyor...');
      }
      
      try {
        const headerData = parseCaseHeader(titleContainer);
        const fullData = { ...headerData, ...updatedCache.partyData };
        if (fullData.isCBS) {
          await generateCbsUdfDocument(fullData);
        } else {
          await generateUdfDocument(fullData);
        }
      } catch (err) {
        console.error("İşlem sırasında hata:", err);
      } finally {
        clearButtonLoading(downloadBtn);
        if (downloadBtn.matches(':hover')) {
          showTooltip(downloadBtn, 'LexUDF ile indir');
        }
      }
    });
    
    // Buton konumu: "Taraf Bilgileri" sekmesinin İÇİNDE, yazının hemen yanı
    // (kolay erişim — sekmeye tıklamaya zaten gidiliyor; şerit dışına kardeş
    // eleman koymak düzeni bozuyordu).
    // Sekme henüz render olmadıysa başlık metninin yanına; sekme belirince
    // ensureButtonPlacement ile içine taşınır.
    const tarafTab = findTarafTab(popupScope);
    if (tarafTab) tarafTab.appendChild(downloadBtn);
    else textDiv.insertAdjacentElement('afterend', downloadBtn);
    
    titleContainer.setAttribute('data-uyap-sablon-button-added', 'true');
    console.log("LexUDF Portal: Buton başarıyla enjekte edildi.");
    
    startPassivePartyObserver(titleContainer, popupScope);
  });
}

// --- 11. MUTATION OBSERVER VE OLAY DİNLEYİCİLERİ ---

const observer = new MutationObserver(() => {
  window.requestAnimationFrame(() => {
    checkAndInjectPopup();
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

document.addEventListener('mousemove', (e) => {
  if (!globalTooltipElement || globalTooltipElement.className === 'uyap-tooltip-hidden') {
    return;
  }
  const hoveredBtn = document.querySelector('.uyap-sablon-indir-btn:hover');
  if (!hoveredBtn) {
    hideTooltip();
  }
});

window.addEventListener('scroll', () => {
  hideTooltip();
}, true);

initGlobalTooltip();
checkAndInjectPopup();
console.log("LexUDF Portal v2.7: başlatıldı.");

// --- 12. İCRA OTOMATİK DOLDURMA (deneme/icra-otofill) ---
// Dava buton akışına dokunmaz: sadece icra dosya sayfasındaki başlık +
// taraf satırlarını okuyup `lexudf.otofill` anahtarına yazar. Panel
// (js/main.js) bunu forma öneri olarak yazar; direkt indirme yok,
// elle düzeltme her zaman mümkün.
try {
  const ICRA_OTOFILL_KEY = 'lexudf.otofill';
  const icraNormTr = (s) => String(s || '').replace(/[\[\]]/g, '').trim().toLowerCase()
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  const icraFold = (s) => String(s).toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  const icraParseBaslik = (metin) => {
    if (!metin) return null;
    const s = String(metin).replace(/\s+/g, ' ').trim();
    const fl = icraFold(s);
    const m = fl.match(/^(\d+\/\d+)\s+(.+?)\s*-\s*icra dosyasi\s*$/);
    if (!m) return null;
    const idx = fl.lastIndexOf(' - icra dosyasi');
    if (idx < 0) return null;
    return { esas: s.slice(0, m[1].length).trim(), ham: s.slice(m[1].length, idx).trim() };
  };
  const icraNormMud = (ham) => {
    if (!ham) return '';
    const t = String(ham).trim();
    const fl = icraFold(t);
    const m = fl.match(/^(.*)\s+icra\s+(dairesi|mudurlugu)\s*\.?\s*$/);
    if (!m) return t;
    return t.slice(0, m[1].length).trim() || t;
  };
  const icraAdTokens = (ad) => icraNormTr(ad).replace(/^av\.?\s+/, '').replace(/\s+av\.?$/, '')
    .split(/[\s\-.]+/).map(t => t.replace(/[^a-z]/g, '')).filter(t => t.length > 1);
  const icraAvukatEslesme = (avukat, vekil) => {
    const a = icraAdTokens(avukat), v = icraAdTokens(vekil);
    if (!a.length || !v.length) return false;
    if (!v.includes(a[a.length - 1])) return false;
    return a.filter(t => v.includes(t)).length >= 2 || a.length === 1;
  };
  const checkIcraOtofill = async () => {
    try {
      if (!window.location.href.includes('uyap.gov.tr')) return false;
      const bodyMetni = document.body ? (document.body.innerText || '') : '';
      if (!bodyMetni.includes('cra Dosyas')) return false;
      let baslik = '';
      for (const el of document.querySelectorAll('span')) {
        const t = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (t.length > 10 && t.length < 200 && t.includes('cra Dosyas') && icraParseBaslik(t)) { baslik = t; break; }
      }
      if (!baslik) return false;
      const parsed = icraParseBaslik(baslik);
      const satirlar = [];
      for (const row of document.querySelectorAll('tr.dx-data-row')) {
        const c = row.querySelectorAll('td');
        if (c.length !== 4) continue;
        satirlar.push({ rol: c[0].innerText.trim(), adi: c[2].innerText.trim(), vekil: c[3].innerText.trim() });
      }
      const borclular = satirlar.filter(s => icraNormTr(s.rol).includes('borclu') && s.adi);
      if (!borclular.length) return false;
      const avukat = (typeof getLoggedInAttorney === 'function') ? getLoggedInAttorney() : '';
      const eslesen = borclular.filter(s => icraAvukatEslesme(avukat, s.vekil));
      const secilen = eslesen.length ? eslesen : borclular;
      const alanlar = {
        icraMudurlugu: icraNormMud(parsed.ham),
        icraEsasNo: parsed.esas,
        borcluAdi: secilen.map(s => s.adi).join(', ')
      };
      if (!alanlar.borcluAdi && !alanlar.icraEsasNo) return false;
      if (chrome && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ [ICRA_OTOFILL_KEY]: { sablon: 'icra_itiraz', alanlar, kaynak: 'icra-sayfa', zaman: Date.now() } });
        return true;
      }
      return false;
    } catch (e) { return false; }
  };
  // İstek-yanıt: paneldeki düğme `lexudf.otofill-istek` yazar, biz BİR KEZ okuyup
  // yanıtı yazarız. Sürekli izleme yok; portal indir düğmesiyle bağ yok.
  // Dava/soruşturma şablonları dava penceresinden, icra şablonu icra sayfasından okur.
  const otofillFold = (s) => String(s || '').toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c');
  const otofillSupheliMi = (roller) => {
    const list = (Array.isArray(roller) ? roller : [roller]).map(otofillFold);
    const ok = list.some(r => r.includes('sanik') || r.includes('supheli') || r.includes('suruklenen') || (r.includes('suc') && r.includes('cocuk')));
    return ok ? 'supheli' : 'musteki';
  };
  const otofillDavaciMi = (roller) => {
    const list = (Array.isArray(roller) ? roller : [roller]).map(otofillFold);
    if (list.some(r => r.includes('davaci'))) return 'davaci';
    if (list.some(r => r.includes('davali'))) return 'davali';
    return '';
  };
  const checkDavaOtofill = async (sablon) => {
    try {
      if (!window.location.href.includes('uyap.gov.tr')) return false;
      const basliklar = document.querySelectorAll(CONFIG.POPUP_TITLE_CONTAINER);
      for (const titleContainer of basliklar) {
        let popupScope = null;
        try { popupScope = findPopupContainer(titleContainer); } catch (e) { continue; }
        if (!popupScope || !isPartyTableRendered(popupScope)) continue;
        const header = parseCaseHeader(titleContainer);
        if (!header || header.dosya_no === 'Tespit Edilemedi') continue;
        const avukat = (typeof getLoggedInAttorney === 'function') ? getLoggedInAttorney() : '';
        const parties = extractPartiesAndRoles(avukat, popupScope);
        const mvk = (parties.muvekkiller && parties.muvekkiller.length) ? parties.muvekkiller : [];
        const ilk = mvk[0] || null;
        const roller = mvk.map(t => t.rol);
        const sehir = String(header.mahkeme || '').replace(/\s+/g, ' ').trim().split(' ')[0] || '';
        let alanlar = null;
        if (sablon === 'inceleme') {
          alanlar = { bassavcilik: sehir, sorusturma: header.dosya_no, rol: roller.length ? otofillSupheliMi(roller) : '', isim: ilk ? ilk.adi : '' };
        } else if (sablon === 'cmk_kayit') {
          alanlar = { cmkBassavcilik: sehir, cmkSorusturmaNo: header.dosya_no, cmkRol: roller.length ? otofillSupheliMi(roller) : '', cmkTarafIsim: ilk ? ilk.adi : '' };
        } else if (sablon === 'gerekceli_karar') {
          alanlar = { gkMahkemeAdi: header.mahkeme, gkEsasNo: header.dosya_no, gkTarafAdi: ilk ? ilk.adi : '' };
          const r = roller.length ? otofillDavaciMi(roller) : '';
          if (r) alanlar.gkTarafRolu = r;
        } else if (sablon === 'kesinlesme_talebi') {
          alanlar = { kesMahkemeAdi: header.mahkeme, kesEsasNo: header.dosya_no, kesTarafAdi: ilk ? ilk.adi : '' };
          const r = roller.length ? otofillDavaciMi(roller) : '';
          if (r) alanlar.kesTarafRolu = r;
        } else { continue; }
        const dolu = Object.values(alanlar).some(v => v);
        if (!dolu) continue;
        if (chrome && chrome.storage && chrome.storage.local) {
          await chrome.storage.local.set({ [ICRA_OTOFILL_KEY]: { sablon, alanlar, kaynak: 'dava-pencere', zaman: Date.now() } });
          return true;
        }
      }
      return false;
    } catch (e) { return false; }
  };
  try {
    if (chrome && chrome.storage && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((degisen, alan) => {
        const istek = alan === 'local' && degisen['lexudf.otofill-istek']?.newValue;
        if (!istek) return;
        if (istek.sablon === 'icra_itiraz') checkIcraOtofill();
        else checkDavaOtofill(istek.sablon);
      });
    }
  } catch (e) { /* dinleyici kurulamazsa düğme zaman aşımına düşer */ }
} catch (e) { /* deneme bloğu ana akışı etkilemez */ }

})();
