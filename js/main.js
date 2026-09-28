// Giriş noktası: arayüzü şablon kayıt defterine bağlar.
// Şablona özel HİÇBİR mantık burada yok — hepsi js/templates/ altında.
import { templates, getTemplate } from './templates/index.js';
import { collectFields, findMissing } from './core/form.js';
import { buildXml, resolveAciklama } from './core/builder.js';
import { findUnresolved, listPlaceholders } from './core/placeholders.js';
import { createZipBlob } from './core/zip.js';
import { cleanPartForFilename } from './core/utils.js';
import { initProfiles } from './core/profiles.js';

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

  let fileName = template.fileName(payload, cleanPartForFilename);
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

      showMsg('UDF dosyası indirildi. UYAP\u2019a yüklemeden önce bilgileri kontrol etmeyi unutmayın.', 'ok');
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
