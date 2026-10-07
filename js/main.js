// Giriş noktası: arayüzü şablon kayıt defterine bağlar.
// Şablona özel HİÇBİR mantık burada yok — hepsi js/templates/ altında.
import { templates, getTemplate } from './templates/index.js';
import { collectFields, findMissing } from './core/form.js';
import { buildXml, resolveAciklama } from './core/builder.js';
import { findUnresolved, listPlaceholders } from './core/placeholders.js';
import { createZipBlob } from './core/zip.js';
import { shortPartForFilename } from './core/utils.js';
import { initProfiles } from './core/profiles.js';
import { OTOFILL_KEY, OTOFILL_ISTEK_KEY } from './core/icraOtofill.js';

const $ = id => document.getElementById(id);
const dilekceTuruSel = $('dilekceTuru');
const ozelToggle = $('ozelAciklamaToggle');
const ozelContainer = $('ozelAciklamaContainer');
const ozelMetni = $('ozelAciklamaMetni');
const goBtn = $('go');

const activeTemplate = () => getTemplate(dilekceTuruSel.value);

function showMsg(text, kind) {
  const el = $('msg');
  el.textContent = text;
  el.className = 'msg show ' + kind;
}

function toggleFormGroups() {
  const active = activeTemplate();
  for (const t of templates) {
    const g = $(t.groupId);
    if (g) g.style.display = (t === active) ? 'block' : 'none';
  }
}

// Özelleştirme kutusuna dolan metin ile belgeye yazılan varsayılan metin aynı fonksiyondan gelir.
function getDefaultExplanationText() {
  const t = activeTemplate();
  return t.aciklama(collectFields(t));
}

// Özelleştirme kutusunun altındaki, o şablonda kullanılabilen [alanları] gösteren ipucu
function updatePlaceholderHint() {
  const hint = $('ozelPlaceholderHint');
  const list = listPlaceholders(activeTemplate());
  if (list.length === 0) { hint.style.display = 'none'; return; }
  hint.textContent = list.join(', ') + ' gibi [köşeli parantez] içindeki alanlar formdan otomatik doldurulur — olduğu gibi bırakın. Yanlışlıkla sildiyseniz aynen yazarak geri ekleyebilirsiniz.';
  hint.style.display = 'block';
}

function refreshOzelMetinIfActive() {
  if (ozelToggle.checked) ozelMetni.value = getDefaultExplanationText();
}

// --- Olay bağlama ---
dilekceTuruSel.addEventListener('change', () => {
  toggleFormGroups();
  updatePlaceholderHint();
  refreshOzelMetinIfActive();
});

ozelToggle.addEventListener('change', () => {
  if (ozelToggle.checked) {
    ozelContainer.style.display = 'block';
    ozelMetni.value = getDefaultExplanationText();
    updatePlaceholderHint();
  } else {
    ozelContainer.style.display = 'none';
  }
});

// Açıklama metnini etkileyen alanlar değişince (kutu açıksa) metni güncelle.
for (const t of templates) {
  for (const key of (t.aciklamaDeps || [])) {
    const field = t.fields.find(f => f.key === key);
    const el = field && $(field.id || field.key);
    if (!el) continue;
    const handler = () => { if (t === activeTemplate()) refreshOzelMetinIfActive(); };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  }
  if (typeof t.init === 'function') t.init();
}

goBtn.addEventListener('click', async () => {
  const template = activeTemplate();
  const payload = {
    dilekceTuru: template.id,
    yaziTipi: $('yaziTipi').value,
    ozelToggle: ozelToggle.checked,
    ozelMetin: ozelMetni.value.trim(),
    ...collectFields(template)
  };

  if (findMissing(template, payload).length > 0) {
    showMsg(template.requiredMessage || 'Lütfen zorunlu alanları doldurun.', 'err');
    return;
  }

  // Özelleştirilmiş metinde tanınmayan/yanlış yazılmış bir [alan] kaldıysa belgede aynen görünür — kullanıcıyı uyar.
  const kalan = findUnresolved(resolveAciklama(template, payload));
  if (kalan.length > 0 && !confirm(
    'Açıklama metninde köşeli parantez içinde şu ifade(ler) var:\n\n' + [...new Set(kalan)].join('\n') +
    '\n\nBunlar otomatik doldurulmayacak ve belgede aynen görünecek. Yine de indirilsin mi?')) {
    return;
  }

  // shortPartForFilename: her parçayı sınırlar, uzun girdilerde ad şişip
  // Windows yol sınırını aşmasın.
  let fileName = template.fileName(payload, shortPartForFilename);
  if (!fileName || !fileName.endsWith('.udf')) fileName = 'dilekce.udf';

  goBtn.disabled = true;
  goBtn.textContent = 'Hazırlanıyor...';

  try {
    const xml = buildXml(template, payload);
    const zipBuffer = await createZipBlob('content.xml', xml);

    // Arayüz kilitlenmesini önlemek için indirme bir sonraki tick'te yapılır.
    setTimeout(() => {
      const blob = new Blob([zipBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showMsg('UDF dosyası başarıyla indirildi.', 'ok');
      goBtn.disabled = false;
      goBtn.textContent = 'UDF Dosyasını İndir';
    }, 50);
  } catch (err) {
    console.error(err);
    showMsg('Belge oluşturulurken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.', 'err');
    goBtn.disabled = false;
    goBtn.textContent = 'UDF Dosyasını İndir';
  }
});

toggleFormGroups();
initProfiles().catch(err => console.error('Profiller yüklenemedi:', err));

// UYAP otomatik doldurma (deneme/icra-otofill): istek-yanıt modeliyle çalışır.
// Paneldeki "UYAP’tan doldur" düğmesine basılınca içerik betiğine istek yazılır;
// içerik betiği sayfayı BİR KEZ okuyup yanıtı yazar. Portal indir düğmesiyle
// hiçbir bağı yoktur (o kendi UDF'ini indirir, buraya yazmaz).
// Elle doldurma her zaman mümkündür; doldurma tek seferlik öneridir.
{
  const btn = $('icraOtofillBtn');
  let bekliyor = false;
  const applyOtofill = (paket) => {
    if (!paket || paket.sablon !== 'icra_itiraz' || !paket.alanlar) return false;
    const alanlar = paket.alanlar;
    const keys = Object.keys(alanlar).filter(k => alanlar[k]);
    if (keys.length === 0) return false;
    if (dilekceTuruSel.value !== 'icra_itiraz') {
      dilekceTuruSel.value = 'icra_itiraz';
      toggleFormGroups();
    }
    for (const [k, v] of Object.entries(alanlar)) {
      const el = $(k);
      if (el && v) {
        el.value = v;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    refreshOzelMetinIfActive();
    return true;
  };
  const bitir = (okMsg) => {
    bekliyor = false;
    if (btn) { btn.disabled = false; btn.textContent = 'UYAP’tan doldur'; }
    if (okMsg) showMsg(okMsg, 'ok');
  };
  const zamanAsimi = () => {
    if (!bekliyor) return;
    bitir();
    showMsg('UYAP’tan veri alınamadı — icra dosya sayfası açık mı? Açıksa sayfayı yenileyip tekrar deneyin.', 'err');
  };
  if (btn) {
    btn.addEventListener('click', async () => {
      if (bekliyor) return;
      if (typeof chrome === 'undefined' || !chrome.storage?.local) {
        showMsg('Otomatik doldurma bu ortamda çalışmaz — alanları elle doldurun.', 'err');
        return;
      }
      bekliyor = true;
      btn.disabled = true;
      btn.textContent = 'Okunuyor...';
      try { await chrome.storage.local.remove(OTOFILL_KEY); } catch {}
      // Önce taze bir yanıt var mı (panel kapalıyken yazılmış olabilir).
      try {
        const mevcut = await chrome.storage.local.get(OTOFILL_KEY);
        const paket = mevcut?.[OTOFILL_KEY];
        if (paket && paket.sablon === 'icra_itiraz' && paket.zaman && (Date.now() - paket.zaman) < 2 * 60 * 1000) {
          if (applyOtofill(paket)) {
            await chrome.storage.local.remove(OTOFILL_KEY).catch(() => {});
            bitir('UYAP’tan dolduruldu — göndermeden önce kontrol edin.');
            return;
          }
        }
      } catch (err) { console.error('Otofill okunamadı:', err); }
      try {
        await chrome.storage.local.set({ [OTOFILL_ISTEK_KEY]: { sablon: 'icra_itiraz', zaman: Date.now() } });
      } catch (err) {
        console.error('Otofill isteği yazılamadı:', err);
        bitir();
        showMsg('İstek yazılamadı — alanları elle doldurun.', 'err');
        return;
      }
      setTimeout(zamanAsimi, 8000);
      const baslangic = Date.now();
      const yokla = setInterval(async () => {
        if (!bekliyor) { clearInterval(yokla); return; }
        if (Date.now() - baslangic > 8000) { clearInterval(yokla); return; }
        try {
          const res = await chrome.storage.local.get(OTOFILL_KEY);
          const paket = res?.[OTOFILL_KEY];
          if (paket && paket.sablon === 'icra_itiraz') {
            clearInterval(yokla);
            if (applyOtofill(paket)) {
              await chrome.storage.local.remove(OTOFILL_KEY).catch(() => {});
              bitir('UYAP’tan dolduruldu — göndermeden önce kontrol edin.');
            } else {
              bitir();
              showMsg('Sayfada borçlu bilgisi bulunamadı — alanları elle doldurun.', 'err');
            }
          }
        } catch {}
      }, 500);
    });
  }
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
      chrome.storage.onChanged.addListener((degisen, alan) => {
        if (alan === 'local' && degisen[OTOFILL_KEY]?.newValue && bekliyor) {
          const paket = degisen[OTOFILL_KEY].newValue;
          if (applyOtofill(paket)) {
            chrome.storage.local.remove(OTOFILL_KEY).catch(() => {});
            bitir('UYAP’tan dolduruldu — göndermeden önce kontrol edin.');
          }
        }
      });
    }
  } catch (err) { console.error('Otofill dinlenemedi:', err); }
}

// Gizlilik penceresi: başlıktaki kilit simgesiyle açılır, ✕ / dışarı tıklama / Esc ile kapanır.
{
  const modal = $('privacyModal');
  if (modal) {
    const close = () => modal.classList.remove('open');
    $('privacyBtn')?.addEventListener('click', () => modal.classList.add('open'));
    $('privacyClose')?.addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }
}
