// Çalıştır: npm test   (Node 18+; tarayıcı/Chrome gerekmez)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { templates, getTemplate } from '../js/templates/index.js';
import { buildXml, resolveAciklama } from '../js/core/builder.js';
import { resolvePlaceholders, findUnresolved } from '../js/core/placeholders.js';
import { createZipBlob, crc32 } from '../js/core/zip.js';
import { cleanPartForFilename } from '../js/core/utils.js';
import { goldenCases } from './golden.mjs';

let passed = 0;
const ok = (name, fn) => { fn(); passed++; console.log('  ✓', name); };

// ---- Örnek veri (her şablon için tüm alanlar) ----
const base = {
  yvAvukat: 'Ayşe Yılmaz', yvBaro: 'İstanbul Barosu 12345', yvVergi: 'Kadıköy VD 111', yvAdres: 'Moda Cad. No:1',
  ykAvukat: 'Mehmet Öztürk', ykBaro: 'Ankara Barosu 999', ykVergi: 'Çankaya VD 222', ykAdres: 'Kızılay Sk. No:2',
  vekilEden: 'Şükrü Çelik', vekaletNoter: 'Kadıköy 5. Noterliği 01.02.2024 - 1234',
  mahkemeAdi: 'İstanbul 3. Asliye Ticaret Mahkemesi', mahkemeEsas: '2024/123',
  cmkBassavcilik: 'YALOVA', cmkSorusturmaNo: '2024/55', cmkTarafIsim: 'Ali Veli', cmkAvukat: 'Ayşe Yılmaz',
  icraMudurlugu: 'İSTANBUL 1.', icraEsasNo: '2024/77 Esas', borcluAdi: 'Ğüzel ışık A.Ş.', icraAvukat: 'Ayşe Yılmaz',
  gkMahkemeAdi: 'ANKARA 2. ASLİYE HUKUK', gkEsasNo: '2023/10', gkKararNo: '2024/20', gkTarafAdi: 'Fatma Şahin', gkAvukatAdi: 'Ayşe Yılmaz',
  kesMahkemeAdi: 'İZMİR 4. SULH HUKUK', kesEsasNo: '2022/5', kesKararNo: '2023/9', kesTarafAdi: 'Özgür Ünal', kesAvukatAdi: 'Ayşe Yılmaz',
  bassavcilik: 'BURSA', sorusturmaNo: '2024/999', isim: 'Cem Aydın', avukat: 'Ayşe Yılmaz'
};

// ---- Eski (refactor öncesi) kodu referans olarak yükle ----
// (Yalnızca refactor'u yapan geliştirici makinesinde bulunur; yoksa bu bölüm atlanır.)
const legacyUrl = new URL('../../legacy/popup.old.js', import.meta.url);
let legacy = null;
if (fs.existsSync(legacyUrl)) {
  const legacySrc = fs.readFileSync(legacyUrl, 'utf8');
  const slice = (from, to) => legacySrc.slice(legacySrc.indexOf(from), legacySrc.indexOf(to));
  legacy = new Function(
    slice('function getAciklamaMetni', 'function getDefaultExplanationText') + '\n' +
    slice('function sanitizeXmlText', 'function showMsg') + '\n' +
    'return { buildContentXml, cleanPartForFilename };'
  )();
}

console.log('\n1) Eski kodla birebir aynı XML üretiyor mu?' + (legacy ? '' : '  [ATLANDI: referans dosya yok]'));
const variants = {
  inceleme:          [{ rol: 'supheli' }, { rol: 'musteki' }],
  yetki_belgesi:     [{}],
  cmk_kayit:         [{ cmkRol: 'supheli' }, { cmkRol: 'musteki' }],
  icra_itiraz:       [{}],
  gerekceli_karar:   [{ gkTarafRolu: 'davaci', artanAvansIadesi: true }, { gkTarafRolu: 'davali', artanAvansIadesi: false }],
  kesinlesme_talebi: [{ kesTarafRolu: 'davaci' }, { kesTarafRolu: 'davali' }]
};
let combos = 0;
// Bilerek değiştirilen şablonlar eski çıktıyla karşılaştırılmaz (kendi testleri aşağıda)
const DEGISTIRILDI = new Set(['icra_itiraz']);
for (const t of (legacy ? templates.filter(x => !DEGISTIRILDI.has(x.id)) : [])) {
  for (const extra of variants[t.id]) {
    for (const yaziTipi of ['Times New Roman', 'Cambria']) {
      for (const [ozelToggle, ozelMetin] of [[false, ''], [true, 'Özel metin ]]> & <b> "tırnak"\nİkinci satır']]) {
        const payload = { ...base, ...extra, dilekceTuru: t.id, yaziTipi, ozelToggle, ozelMetin };
        assert.equal(buildXml(t, payload), legacy.buildContentXml(payload), `${t.id} ${JSON.stringify(extra)} ${yaziTipi} ozel=${ozelToggle}`);
        combos++;
      }
    }
  }
}
if (legacy) ok(`${combos} kombinasyonun hepsi eski çıktıyla BİREBİR aynı`, () => {});

console.log('\n2) Özelleştirme kutusundaki varsayılan metin = belgeye yazılan metin');
for (const t of templates) {
  ok(t.id, () => {
    for (const extra of variants[t.id]) {
      const p = { ...base, ...extra, dilekceTuru: t.id, yaziTipi: 'Times New Roman' };
      const normal = buildXml(t, { ...p, ozelToggle: false, ozelMetin: '' });
      const ozelDefault = buildXml(t, { ...p, ozelToggle: true, ozelMetin: t.aciklama(p) });
      assert.equal(ozelDefault, normal);
    }
  });
}

console.log('\n3) Şablon sözleşmesi (yeni şablon eklerken hata yakalar)');
for (const t of templates) {
  ok(t.id, () => {
    for (const k of ['id', 'groupId', 'fields', 'required', 'profileFill', 'aciklamaDeps', 'fileName', 'aciklama', 'build'])
      assert.ok(t[k] !== undefined, `${t.id}: '${k}' eksik`);
    const keys = t.fields.map(f => f.key);
    assert.equal(new Set(keys).size, keys.length, 'tekrarlayan alan anahtarı');
    t.required.forEach(k => assert.ok(keys.includes(k), `required '${k}' fields içinde yok`));
    t.aciklamaDeps.forEach(k => assert.ok(keys.includes(k), `aciklamaDeps '${k}' fields içinde yok`));
    for (const k of ['label', 'aciklamaKisa'])
      assert.ok(typeof t[k] === 'string' && t[k].length > 5, `${t.id}: '${k}' eksik veya çok kısa`);
    assert.ok(t.fileName({ ...base }, cleanPartForFilename).endsWith('.udf'));
    const unresolved = findUnresolved(resolvePlaceholders(t.aciklama({ ...base, rol: 'supheli' }), t, { ...base }));
    assert.deepEqual(unresolved, [], `${t.id}: aciklama() içinde tanımsız [alan] var`);
  });
}
ok('şablon id\'leri benzersiz ve popup.html <option> değerleriyle eşleşiyor', () => {
  const html = fs.readFileSync(new URL('../popup.html', import.meta.url), 'utf8');
  const ids = templates.map(t => t.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const t of templates) {
    assert.ok(html.includes(`<option value="${t.id}">`), `${t.id} için <option> yok`);
    assert.ok(html.includes(`id="${t.groupId}"`), `${t.groupId} bölümü yok`);
    for (const f of t.fields) assert.ok(html.includes(`id="${f.id || f.key}"`), `${t.id}: #${f.id || f.key} elemanı HTML'de yok`);
    for (const el of Object.keys(t.profileFill)) assert.ok(html.includes(`id="${el}"`), `${t.id}: profileFill #${el} HTML'de yok`);
  }
  assert.equal(getTemplate('bilinmeyen').id, 'inceleme');
});
ok('popup.html <option> metinleri şablon `label`ı ile aynı (sync-docs senkronu)', () => {
  const html = fs.readFileSync(new URL('../popup.html', import.meta.url), 'utf8');
  for (const t of templates) {
    const re = new RegExp(`<option value="${t.id}">([^<]*)</option>`);
    const m = html.match(re);
    assert.ok(m, `${t.id}: option bulunamadı`);
    assert.equal(m[1], t.label, `${t.id}: HTML metni "${m[1]}" ≠ label "${t.label}" — node scripts/sync-docs.mjs çalıştırın`);
  }
});
ok('dokümanlarda şablon sayısı elle yazılmış değil (tek kaynak: js/templates)', () => {
  for (const p of ['README.md', 'docs/MAGAZA_ACIKLAMASI.md']) {
    const md = fs.readFileSync(new URL('../' + p, import.meta.url), 'utf8');
    // 1) her şablon adı geçiyor mu
    for (const t of templates) assert.ok(md.includes(t.label), `${p}: "${t.label}" eksik`);
    // 2) hiçbir yerde "6 şablon" gibi kalabalık sayı kalmasın
    assert.ok(!/\b\d+\s+(matbu\s+)?şablon/i.test(md), `${p}: elle yazılmış şablon sayısı var — sync-docs işaretli bloklara geçmeli`);
    // 3) senkronizasyon işaretleri mevcut
    assert.ok(md.includes('ŞABLON-LİSTESİ:BAŞ') && md.includes('ŞABLON-LİSTESİ:BİT'), `${p}: senkron işaretleri yok`);
  }
});
ok('mağaza açıklamasındaki sürüm/açıklama manifest ile aynı', () => {
  const mf = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
  const md = fs.readFileSync(new URL('../docs/MAGAZA_ACIKLAMASI.md', import.meta.url), 'utf8');
  assert.ok(md.includes(mf.version), `MAGAZA_ACIKLAMASI.md sürüm ${mf.version} içermiyor`);
  assert.ok(md.includes(mf.description), 'kısa açıklama manifest ile aynı değil');
  assert.ok(mf.description.length <= 132, `kısa açıklama ${mf.description.length} karakter (sınır 132)`);
});
ok('gizlilik politikası eklentiyi doğru tanımlıyor (Data Safety "Hayır" beyanı tutarlı)', () => {
  const mf = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
  const pol = fs.readFileSync(new URL('../docs/GIZLILIK_POLITIKASI.md', import.meta.url), 'utf8');
  assert.ok(!mf.host_permissions, 'beyan tutarlı olsun diye host_permissions olmamalı');
  for (const izin of mf.permissions) assert.ok(pol.includes('`' + izin + '`'), `politika '${izin}' iznini açıklamıyor`);
  assert.ok(pol.includes(mf.version), 'politika sürümü manifest ile eşleşmeli');
});

console.log('\n4) İcra müdürlüğü: kullanıcı "İCRA MÜDÜRLÜĞÜ" yazsa da tekrarlanmaz');
ok('düzeltilmiş regex Türkçe harflerle çalışıyor', () => {
  const t = getTemplate('icra_itiraz');
  const mk = m => buildXml(t, { ...base, icraMudurlugu: m, dilekceTuru: t.id, yaziTipi: 'Times New Roman' });
  const ref = mk('İSTANBUL 1.');
  assert.equal(mk('İSTANBUL 1. İCRA MÜDÜRLÜĞÜ'), ref);
  assert.equal(mk('İSTANBUL 1. İCRA MÜDÜRLÜĞÜ'.toLocaleLowerCase('tr').toLocaleUpperCase('tr')), ref);
  assert.ok(!ref.includes('İCRA MÜDÜRLÜĞÜ İCRA'));
});

console.log('\n4a) İcra itiraz: 3 paragraf, her biri 0,9 cm (25.51181 pt) ilk satır girintili');
{
  const t = getTemplate('icra_itiraz');
  const p = { ...base, dilekceTuru: t.id, yaziTipi: 'Times New Roman', ozelToggle: false, ozelMetin: '' };
  const girintili = xml => (xml.match(/<paragraph Alignment="3" FirstLineIndent="25.51181" LineSpacing="0.5">/g) || []).length;
  ok('varsayılan metin 3 ayrı, girintili paragraf', () => {
    assert.equal(t.aciklama().split('\n\n').length, 3);
    assert.equal(girintili(buildXml(t, p)), 3);
  });
  ok('özelleştirilmiş metinde her satır grubu ayrı paragraf olur', () => {
    assert.equal(girintili(buildXml(t, { ...p, ozelToggle: true, ozelMetin: 'Bir.\nİki.\n\nÜç.\nDört.' })), 4);
  });
  ok('metin belgeye eksiksiz yazılıyor', () => {
    const xml = buildXml(t, p);
    assert.ok(xml.includes('tarafıma ilamsız icra takibi başlatılmış ve ödeme emri gönderilmiştir.'));
    assert.ok(xml.includes('fer’î alacak kalemlerine ayrı ayrı ve açıkça itiraz ediyorum.'));
    assert.ok(xml.includes('icra takibinin durdurulmasına karar verilmesini vekâleten talep ederim.'));
  });
  ok('0.9 satır aralığı hiçbir yerde kullanılmıyor', () => {
    assert.ok(!buildXml(t, p).includes('LineSpacing="0.9"'));
  });
}

console.log('\n4b) [Köşeli] alanlar (placeholder)');
{
  const t = getTemplate('yetki_belgesi');
  const p = { ...base, dilekceTuru: t.id, yaziTipi: 'Times New Roman' };
  ok('matbu metin işaretçili gelir, belgede gerçek değerle dolar', () => {
    assert.ok(t.aciklama(p).includes('[Mahkeme Adı] [Mahkeme Esas No] Esas sayılı'));
    const xml = buildXml(t, { ...p, ozelToggle: false, ozelMetin: '' });
    assert.ok(xml.includes('Yalnızca İstanbul 3. Asliye Ticaret Mahkemesi 2024/123 Esas sayılı'));
    assert.ok(!xml.includes('[Mahkeme'));
  });
  ok('özelleştirilmiş metinde de dolar; form sonradan değişirse GÜNCEL değer yazılır (eski değer kalmaz)', () => {
    const ozel = 'Sadece [Mahkeme Adı] dosyası [Mahkeme Esas No] için yetki verdim.';
    const yeni = { ...p, mahkemeAdi: 'Bursa 1. Sulh Hukuk', mahkemeEsas: '2025/9', ozelToggle: true, ozelMetin: ozel };
    assert.equal(resolveAciklama(t, yeni), 'Sadece Bursa 1. Sulh Hukuk dosyası 2025/9 için yetki verdim.');
  });
  ok('küçük/büyük harf, ı/i ve fazla boşluk farkını tolere eder', () => {
    for (const yazim of ['[mahkeme adi]', '[MAHKEME ADI]', '[ Mahkeme   Adı ]', '[Mahkeme Adı]'])
      assert.equal(resolvePlaceholders(yazim, t, p), p.mahkemeAdi, yazim);
  });
  ok('tanınmayan [ifade] aynen kalır ve findUnresolved ile yakalanır', () => {
    const out = resolvePlaceholders('A [Mahkeme Adı] B [Mahkme Adı] C [imza]', t, p);
    assert.equal(out, 'A ' + p.mahkemeAdi + ' B [Mahkme Adı] C [imza]');
    assert.deepEqual(findUnresolved(out), ['[Mahkme Adı]', '[imza]']);
  });
  ok('değerin içindeki $ ve [ ] karakterleri bozulmaz / yeniden işlenmez', () => {
    const r = resolvePlaceholders('[Mahkeme Adı]', t, { ...p, mahkemeAdi: 'X $& [Mahkeme Esas No] $1' });
    assert.equal(r, 'X $& [Mahkeme Esas No] $1');
  });
  ok('işaretçisi olmayan şablonlarda köşeli parantez metni değişmez', () => {
    const i = getTemplate('inceleme');
    assert.equal(resolvePlaceholders('[Mahkeme Adı] [x]', i, base), '[Mahkeme Adı] [x]');
  });
}

console.log('\n5) ZIP/UDF geçerliliği');
ok('crc32 bilinen değer', () => assert.equal(crc32(new TextEncoder().encode('123456789')), 0xCBF43926));
const tmp = fs.mkdtempSync(os.tmpdir() + '/lexudf-');
// Windows yolundaki ters bölüler gömülü Python kodunu bozar (\U kaçışı) — Python'a bölü çizgili ver.
const tmpPy = tmp.replace(/\\/g, '/');
for (const t of templates) {
  const p = { ...base, dilekceTuru: t.id, yaziTipi: 'Times New Roman', ozelToggle: false, ozelMetin: '', rol: 'supheli', cmkRol: 'supheli', gkTarafRolu: 'davaci', kesTarafRolu: 'davali', artanAvansIadesi: true };
  const xml = buildXml(t, p);
  const buf = await createZipBlob('content.xml', xml);
  fs.writeFileSync(`${tmp}/${t.fileName(p, cleanPartForFilename)}`, buf);
  fs.writeFileSync(`${tmp}/${t.id}.xml`, xml);
}
ok('Python zipfile (central directory üzerinden okur) 6 dosyayı da açıp içeriği doğruluyor', () => {
  const py = `
import zipfile, glob, os, sys
n = 0
for f in sorted(glob.glob('${tmpPy}/*.udf')):
    with zipfile.ZipFile(f) as z:
        assert z.testzip() is None, f
        assert z.namelist() == ['content.xml'], f
        info = z.infolist()[0]
        assert info.header_offset == 0, ('local header offset', f)
        xml = z.read('content.xml').decode('utf-8')
        assert xml.startswith('<?xml') and xml.rstrip().endswith('</template>'), f
        n += 1
print(n)`;
  assert.equal(execFileSync('python3', ['-c', py]).toString().trim(), String(templates.length));
});
ok('açılan içerik üretilen XML ile aynı (Türkçe karakterler bozulmuyor)', () => {
  const t = getTemplate('yetki_belgesi');
  const f = fs.readdirSync(tmp).find(n => n.startsWith('YetkiBelgesi_'));
  const out = execFileSync('python3', ['-c', `import zipfile,sys;sys.stdout.buffer.write(zipfile.ZipFile('${tmpPy}/${f}').read('content.xml'))`]);
  assert.equal(out.toString('utf8'), fs.readFileSync(`${tmp}/${t.id}.xml`, 'utf8'));
});
fs.rmSync(tmp, { recursive: true, force: true });

console.log('\n6) Golden referanslar (UYAP-onaylı çıktı değişmedi mi?)');
{
  const dir = new URL('./golden/', import.meta.url);
  const onDisk = fs.existsSync(dir) ? fs.readdirSync(dir).filter(n => n.endsWith('.xml')).sort() : [];
  const cases = goldenCases();
  ok('golden dosyaları mevcut (yoksa: node tests/update-golden.mjs)', () => {
    assert.ok(onDisk.length > 0, 'tests/golden boş — önce `node tests/update-golden.mjs` çalıştırın');
  });
  ok('golden sayısı vaka sayısıyla eşleşiyor', () => {
    assert.equal(onDisk.length, cases.length, `diskte ${onDisk.length}, vakada ${cases.length} — golden'lar güncel değil`);
  });
  for (const c of cases) {
    ok(c.name, () => {
      const expected = fs.readFileSync(new URL('./golden/' + c.name + '.xml', import.meta.url), 'utf8');
      assert.equal(buildXml(getTemplate(c.templateId), c.payload), expected);
    });
  }
}

console.log('\n7) Belge üretiminin durum taşımadığı doğrulanıyor');
{
  const { createDocument } = await import('../js/core/xml.js');
  const footerCount = s => (s.match(/5070 Sayılı/g) || []).length;
  ok('toXml() kaç kez çağrılırsa çağrılsın aynı XML\'i döndürür (footer bir kez)', () => {
    const doc = createDocument('Times New Roman');
    doc.addPara({ Alignment: '1' }, [{ text: 'Merhaba\n', attrs: {} }]);
    const a = doc.toXml();
    const b = doc.toXml();
    assert.equal(footerCount(a), 1);
    assert.equal(footerCount(b), 1, 'toXml() ikinci çağrıda footer\'ı ikinci kez ekledi');
    assert.equal(a, b, 'toXml() çağrılar arasında belge durumunu bozuyor');
  });
  ok('addPara() toXml() sonrası hâlâ çalışır (dokunulmazlık bozulmadı)', () => {
    const doc = createDocument('Times New Roman');
    doc.toXml();
    doc.addPara({ Alignment: '3' }, [{ text: 'Sonradan\n', attrs: {} }]);
    assert.ok(doc.toXml().includes('Sonradan'));
    assert.equal(footerCount(doc.toXml()), 1);
  });
  ok('buildXml() üretimi golden ile aynı kaldı (değişiklik fark edilmedi)', () => {
    const t = getTemplate('yetki_belgesi');
    const p = { ...base, dilekceTuru: t.id, yaziTipi: 'Times New Roman', ozelToggle: false, ozelMetin: '' };
    const expected = fs.readFileSync(new URL('./golden/yetki_belgesi__varsayilan__times__normal.xml', import.meta.url), 'utf8');
    assert.equal(buildXml(t, p), expected);
  });
}

console.log('\n8) Dosya adı sınırı (uzun girdiler yol sınırını aşmasın)');
{
  const { shortPartForFilename, cleanPartForFilename, MAX_PART_LENGTH } = await import('../js/core/utils.js');
  const uzun = 'F'.repeat(300);
  ok('her parça sınırlanıyor, kısaltma sonrası "_" kalmıyor', () => {
    assert.equal(shortPartForFilename(uzun).length, MAX_PART_LENGTH);
    // 40. karakter alt çizgiye denk geliyor: sondaki "_" temizlenmeli
    const kesik = shortPartForFilename('F'.repeat(39) + '/' + 'G'.repeat(300));
    assert.equal(kesik, 'F'.repeat(39), 'kırpma noktasındaki alt çizgi bırakılmamalı');
    assert.ok(!kesik.endsWith('_'));
  });
  ok('kısa girdi değişmez — mevcut dosya adları bozulmaz', () => {
    for (const v of ['BURSA', '2024/999', 'Örnek Borçlu A.Ş.', 'Ayşe Yılmaz', 'İSTANBUL 1.'])
      assert.equal(shortPartForFilename(v), cleanPartForFilename(v), v);
  });
  ok('300 karakterlik girdide 6 şablonun hiçbiri Windows yol sınırını aşmıyor', () => {
    const p = { ...base, bassavcilik: uzun, icraMudurlugu: uzun, gkMahkemeAdi: uzun, kesMahkemeAdi: uzun, borcluAdi: uzun, gkEsasNo: uzun, gkKararNo: uzun, cmkBassavcilik: uzun, cmkSorusturmaNo: uzun, sorusturmaNo: uzun, icraEsasNo: uzun, kesEsasNo: uzun, kesKararNo: uzun };
    for (const t of templates) {
      const name = t.fileName({ ...p, ozelToggle: false, ozelMetin: '' }, shortPartForFilename);
      assert.ok(name.length < 200, `${t.id}: dosya adı çok uzun (${name.length})`);
      assert.ok(name.endsWith('.udf'));
    }
  });
  ok('sınır uygulanmasa dosya adı gerçekten patlıyordu (regresyon testi)', () => {
    const p = { ...base, gkMahkemeAdi: uzun, gkEsasNo: uzun, gkKararNo: uzun, gkTarafAdi: 'X', gkAvukatAdi: 'Y' };
    const t = getTemplate('gerekceli_karar');
    assert.ok(t.fileName(p, cleanPartForFilename).length > 200, 'beklenen: sınırsızda ad şişiyor');
    assert.ok(t.fileName(p, shortPartForFilename).length < 200, 'düzeltme: ad sınırlanıyor');
  });
}

console.log('\n9) Astral karakterlerde offset/length tutarlılığı');
{
  const { createDocument, textLength } = await import('../js/core/xml.js');
  ok('textLength() JS .length\'ten farklıdır (birleşik karakter 1 sayılır)', () => {
    assert.equal(textLength('abc'), 3);
    assert.equal('😀'.length, 2, 'ön koşul: JS astral karakteri 2 birim sayar');
    assert.equal(textLength('😀'), 1, 'textLength() 1 demeli');
    assert.equal(textLength('Ali 😀 Veli'), 10);
  });
  ok('emoji girdisinde son content öğesinin bitişi CDATA uzunluğuyla tutarlı', () => {
    const t = getTemplate('inceleme');
    const p = { ...base, isim: 'Ali 😀 Veli', dilekceTuru: t.id, yaziTipi: 'Times New Roman', ozelToggle: false, ozelMetin: '' };
    const xml = buildXml(t, p);
    const body = xml.match(/<content><!\[CDATA\[([\s\S]*?)\]\]><\/content>/)[1];
    const els = [...xml.matchAll(/<content[^>]*startOffset="(\d+)" length="(\d+)"/g)];
    const last = els[els.length - 1];
    const end = Number(last[1]) + Number(last[2]);
    // Gövdenin sonunda <content> öğesine karşılık gelmeyen tek bir satır sonu vardır
    // (bkz. xml.js toXml(): metin += '\n'). Offset'lar bunu saymamalıdır.
    assert.ok(body.endsWith('\n'), 'gövde satır sonuyla bitmeli');
    assert.equal(end, textLength(body.slice(0, -1)), 'offset/length CDATA ile uyuşmuyor');
  });
  ok('her content öğesinin uzunluğu metniyle birebir tutarlı', () => {
    const doc = createDocument('Times New Roman');
    doc.addPara({ Alignment: '3' }, [{ text: '😀😀 bir\n', attrs: {} }]);
    const xml = doc.toXml();
    const body = xml.match(/<content><!\[CDATA\[([\s\S]*?)\]\]><\/content>/)[1];
    const first = xml.match(/<content[^>]*startOffset="(\d+)" length="(\d+)"/);
    assert.equal(Number(first[1]), 0);
    assert.equal(Number(first[2]), textLength('😀😀 bir\n'));
    assert.ok(body.startsWith('😀😀 bir\n'));
  });
  ok('regresyon: JS .length kullanılsaydı tutarsızlık çıkardı', () => {
    const s = '😀';
    assert.notEqual(s.length, textLength(s), 'bu eşitlik düzeltmenin gerekçesidir');
  });
}

console.log('\n10) font değeri XML\'e güvenli giriyor');
{
  const { createDocument } = await import('../js/core/xml.js');
  ok('tırnak/&/< içeren font değeri XML yapısını bozmaz', () => {
    const xml = createDocument('Evil" family="x & <y>').toXml();
    assert.ok(!/family="Evil" family=/.test(xml), 'ham tırnak sızdı');
    assert.ok(xml.includes('&quot;'), 'tırnak kaçırılmış olmalı');
    assert.ok(xml.includes('&amp;'), "& kaçırılmış olmalı");
    assert.ok(xml.includes('&lt;y&gt;'), '< > kaçırılmış olmalı');
    // styles/footer satırlarındaki her family="..." kapanışı eşleşmeli
    for (const m of xml.matchAll(/<style name="[^"]+"[^>]*family="([^"]*)"/g))
      assert.ok(m[1].includes('&quot;') || !m[1].includes('"'), 'açılmamış tırnak kalmamalı');
  });
  ok('normal font adı çıktıyı değiştirmez (golden korunur)', () => {
    const a = createDocument('Times New Roman').toXml();
    const b = createDocument('Times New Roman').toXml();
    assert.equal(a, b);
    assert.ok(a.includes('family="Times New Roman"'));
  });
}

console.log('\n11) Portal çekirdek paritesi (portal/ gömülü çekirdek js/core ile aynı)');
{
  const portal = fs.readFileSync(new URL('../portal/content-uyap-sablon.js', import.meta.url), 'utf8');
  const xmlCore = fs.readFileSync(new URL('../js/core/xml.js', import.meta.url), 'utf8');
  const blocks = fs.readFileSync(new URL('../js/core/blocks.js', import.meta.url), 'utf8');
  const zipCore = fs.readFileSync(new URL('../js/core/zip.js', import.meta.url), 'utf8');
  const utils = fs.readFileSync(new URL('../js/core/utils.js', import.meta.url), 'utf8');
  const coreAll = xmlCore + blocks + zipCore + utils;
  // Kritik UYAP çıktı sabitleri iki tarafta da birebir olmalı (biri kayarsa çıktı sapar)
  for (const imza of [
    '5070 Sayılı Kanuna Göre Güvenli Elektronik İmza ile İmzalanmıştır.',
    'bottomMargin="42.525000000000006"',
    'foreground="-13421773"',
    "LineSpacing: '0.5'",
    'for (const _ of s)',
    ']]]]><![CDATA[>',
    'FirstLineIndent',
    '25.51181',
    'AÇIKLAMALAR\\t:\\n',
    'e-imzalıdır\\n',
    'deflate-raw',
    '0xEDB88320',
    '[çÇğĞıİöÖşŞüÜ]',
  ]) {
    ok(`parite: ${imza.slice(0, 30)}`, () => {
      assert.ok(coreAll.includes(imza), 'js/core tarafında yok');
      assert.ok(portal.includes(imza), 'portal tarafında yok');
    });
  }
  ok('portal harici bağımlılık içermiyor', () => {
    assert.ok(!/new\s+(window\.)?PizZip\s*\(/.test(portal), 'PizZip kullanımı');
    assert.ok(!/(window\.)?saveAs\s*\(/.test(portal), 'FileSaver kullanımı');
    assert.ok(!/^\s*import\s/m.test(portal), 'ES import (content-script klasik olmalı)');
    assert.ok(!portal.includes('require('), 'CommonJS require');
  });
  ok('manifest content_scripts dosyalara çözülüyor', () => {
    const mf = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
    assert.ok(Array.isArray(mf.content_scripts) && mf.content_scripts.length > 0, 'content_scripts yok');
    for (const cs of mf.content_scripts) {
      assert.ok((cs.matches || []).includes('https://avukat.uyap.gov.tr/*'), 'portal eşleşmesi yok');
      for (const f of [...(cs.js || []), ...(cs.css || [])]) {
        assert.ok(fs.existsSync(new URL('../' + f, import.meta.url)), `eksik dosya: ${f}`);
      }
    }
  });
}

console.log('\n12) Sürüm kitleri bütünlüğü (releases/vX: anlık + magaza + paket)');
{
  const kok = fileURLToPath(new URL('../', import.meta.url));
  const git = (args) => execFileSync('git', args, { cwd: kok }).toString().trim();
  const sha256 = (rel) => createHash('sha256').update(fs.readFileSync(new URL(`../${rel}`, import.meta.url))).digest('hex');
  const SABLON = ['js/templates/index.js', 'js/templates/inceleme.js', 'js/templates/yetkiBelgesi.js', 'js/templates/cmkKayit.js', 'js/templates/icraItiraz.js', 'js/templates/gerekceliKarar.js', 'js/templates/kesinlesme.js', 'popup.html'];
  const OLUSTURUCU = ['manifest.json', 'portal/content-uyap-sablon.js', 'portal/content-uyap-sablon.css'];
  const MAGAZA = ['magaza/aciklama.txt', 'magaza/kisa-aciklama.txt', 'magaza/surum-notlari.txt', 'magaza/gizlilik-politikasi.txt'];
  ok('bileşen değişiklik notları var', () => {
    assert.ok(fs.existsSync(new URL('../releases/DEĞİŞİKLİKLER-sablonlar.md', import.meta.url)));
    assert.ok(fs.existsSync(new URL('../releases/DEĞİŞİKLİKLER-olusturucu.md', import.meta.url)));
  });
  const surumler = fs.readdirSync(new URL('../releases/', import.meta.url), { withFileTypes: true })
    .filter(e => e.isDirectory() && /^v\d+\.\d+\.\d+$/.test(e.name))
    .map(e => e.name)
    .sort();
  ok('en az bir sürüm kiti var', () => {
    assert.ok(surumler.length > 0, 'boş');
  });
  for (const v of surumler) {
    ok(`${v} anlık dosyalar kaynakla aynı`, () => {
      assert.ok(fs.existsSync(new URL(`../releases/${v}/README.md`, import.meta.url)), 'README.md yok');
      assert.ok(fs.existsSync(new URL(`../releases/${v}/BİLGİ.md`, import.meta.url)), 'BİLGİ.md yok');
      const bilgi = fs.readFileSync(new URL(`../releases/${v}/BİLGİ.md`, import.meta.url), 'utf8');
      const m = bilgi.match(/^-\s*Kaynak:\s*(\S+)/m);
      assert.ok(m, 'BİLGİ.md Kaynak satırı yok');
      git(['cat-file', '-e', `${m[1]}^{commit}`]);
      for (const f of SABLON) {
        assert.equal(git(['hash-object', `releases/${v}/sablonlar/${f}`]), git(['rev-parse', `${m[1]}:${f}`]), `sablonlar/${f} kaynakla uyuşmuyor`);
      }
      for (const f of OLUSTURUCU) {
        assert.equal(git(['hash-object', `releases/${v}/olusturucu/${f}`]), git(['rev-parse', `${m[1]}:${f}`]), `olusturucu/${f} kaynakla uyuşmuyor`);
      }
      assert.equal(git(['hash-object', `releases/${v}/README.md`]), git(['rev-parse', `${m[1]}:README.md`]), 'README.md kaynakla uyuşmuyor');
    });
    ok(`${v} mağaza kiti tutarlı`, () => {
      for (const f of MAGAZA) {
        assert.ok(fs.existsSync(new URL(`../releases/${v}/${f}`, import.meta.url)), `eksik dosya: ${f}`);
      }
      const aciklama = fs.readFileSync(new URL(`../releases/${v}/magaza/aciklama.txt`, import.meta.url), 'utf8');
      const notlar = fs.readFileSync(new URL(`../releases/${v}/magaza/surum-notlari.txt`, import.meta.url), 'utf8').trim();
      const kisa = fs.readFileSync(new URL(`../releases/${v}/magaza/kisa-aciklama.txt`, import.meta.url), 'utf8').trim();
      const gizlilik = fs.readFileSync(new URL(`../releases/${v}/magaza/gizlilik-politikasi.txt`, import.meta.url), 'utf8');
      assert.ok(aciklama.includes(notlar), 'sürüm notları açıklamada yok');
      assert.ok(kisa.length <= 132, `kısa açıklama ${kisa.length} karakter (sınır 132)`);
      assert.ok(gizlilik.includes(`Sürüm ${v.slice(1)}`), 'gizlilik metni sürümü tutmuyor');
    });
    ok(`${v} paket kaydı tutarlı`, () => {
      const bilgi = fs.readFileSync(new URL(`../releases/${v}/BİLGİ.md`, import.meta.url), 'utf8');
      const h = bilgi.match(/^-\s*Paket SHA-256:\s*([0-9a-f]{64})/m);
      assert.ok(h, 'BİLGİ.md Paket SHA-256 satırı yok');
      const zip = `releases/${v}/lexudf-${v.slice(1)}-store.zip`;
      assert.ok(fs.existsSync(new URL(`../${zip}`, import.meta.url)), 'paket yok');
      assert.equal(sha256(zip), h[1], 'paket hash kaydı tutmuyor');
    });
  }
}

console.log('\n13) İcra otomatik doldurma (deneme/icra-otofill — saf ayrıştırıcı)');
{
  const { parseIcraBaslik, normalizeMudurluk, isAttorneyMatch, mapIcraOtofill } =
    await import('../js/core/icraOtofill.js');
  ok('başlık parse: esas + müdürlük ham', () => {
    assert.deepEqual(parseIcraBaslik('2026/123456 Konya 7. İcra Dairesi - İcra Dosyası'),
      { icraEsasNo: '2026/123456', mudurlukHam: 'Konya 7. İcra Dairesi' });
    assert.equal(parseIcraBaslik('alakasız metin'), null);
    assert.equal(parseIcraBaslik(''), null);
  });
  ok('müdürlük normalize: Dairesi/Müdürlüğü soneki temizlenir, çıplak ad aynen kalır', () => {
    assert.equal(normalizeMudurluk('Konya 7. İcra Dairesi'), 'Konya 7.');
    assert.equal(normalizeMudurluk('Konya 7. İCRA DAİRESİ'), 'Konya 7.');
    assert.equal(normalizeMudurluk('İSTANBUL 1.'), 'İSTANBUL 1.');
    assert.equal(normalizeMudurluk('İstanbul 1. İcra Müdürlüğü'), 'İstanbul 1.');
  });
  ok('vekil eşleşme: [AD], Av. öneki ve "-" toleranslı', () => {
    assert.equal(isAttorneyMatch('Mustafa Yıldıran', '[MUSTAFA YILDIRAN]'), true);
    assert.equal(isAttorneyMatch('Mustafa Yıldıran', '[av. blablabla]'), false);
    assert.equal(isAttorneyMatch('Mustafa Yıldıran', '-'), false);
    assert.equal(isAttorneyMatch('', '[MUSTAFA YILDIRAN]'), false);
  });
  ok('uçtan uca: müvekkil borçlu seçilir, müdürlük normalize edilir', () => {
    const satirlar = [
      { rol: 'Alacaklı', adi: 'ALACAKLI A', vekil: '[av. blablabla]' },
      { rol: 'Borçlu', adi: 'BORCLU B', vekil: '-' },
      { rol: 'Borçlu', adi: 'MUVEKKIL C', vekil: '[MUSTAFA YILDIRAN]' }
    ];
    const out = mapIcraOtofill('2026/123456 Konya 7. İcra Dairesi - İcra Dosyası', satirlar, 'Mustafa Yıldıran');
    assert.equal(out.icraEsasNo, '2026/123456');
    assert.equal(out.icraMudurlugu, 'Konya 7.');
    assert.equal(out.borcluAdi, 'MUVEKKIL C');
  });
  ok('eşleşme yoksa tüm borçlular doldurulur (kullanıcı eler)', () => {
    const satirlar = [
      { rol: 'Borçlu', adi: 'BORCLU B', vekil: '-' },
      { rol: 'Alacaklı', adi: 'ALACAKLI A', vekil: '[av. blablabla]' }
    ];
    const out = mapIcraOtofill('2026/123456 Konya 7. İcra Dairesi - İcra Dosyası', satirlar, 'Mustafa Yıldıran');
    assert.equal(out.borcluAdi, 'BORCLU B');
  });
  ok('portal gömülü kopya çekirdekle aynı kuralları taşıyor', () => {
    const portal = fs.readFileSync(new URL('../portal/content-uyap-sablon.js', import.meta.url), 'utf8');
    assert.ok(portal.includes('lexudf.otofill'), 'otofill anahtarı portalda yok');
    assert.ok(portal.includes('cra Dosyas'), 'icra başlık taraması portalda yok');
    assert.ok(portal.includes('icra_itiraz'), 'hedef şablon portalda yok');
  });
  ok('ayrışma: portal indir düğmesi kendi işini yapar, otomatik periyodik yazma yok', () => {
    const portal = fs.readFileSync(new URL('../portal/content-uyap-sablon.js', import.meta.url), 'utf8');
    assert.ok(!/setInterval\s*\(\s*checkIcraOtofill/.test(portal), 'içerik betiği periyodik yazmamalı (istek-yanıt olmalı)');
    assert.ok(portal.includes('lexudf.otofill-istek'), 'istek anahtarı dinlenmiyor');
  });
  ok('panelde istek düğmesi var ve istek anahtarını yazıyor', () => {
    const html = fs.readFileSync(new URL('../popup.html', import.meta.url), 'utf8');
    const main = fs.readFileSync(new URL('../js/main.js', import.meta.url), 'utf8');
    assert.ok(html.includes('data-sablon="icra_itiraz"'), 'icra grubunda düğme yok');
    assert.ok(main.includes('OTOFILL_ISTEK_KEY'), 'main.js istek anahtarını kullanmıyor');
    assert.ok(main.includes('btn-otofill'), 'main.js düğmeleri bağlamıyor');
  });
}

console.log('\n14) Dava/soruşturma otomatik doldurma (yetki belgesi hariç)');
{
  const { mapDavaOtofill, rolSupheliMi, rolDavaciMi, sehirCikar } =
    await import('../js/core/otofill.js');
  const header = { mahkeme: 'YALOVA 2. ASLİYE HUKUK', dosyaNo: '2026/123' };
  const taraflar = [
    { rol: 'Davacı', adi: 'MUVEKKIL A', vekil: '[MUSTAFA YILDIRAN]' },
    { rol: 'Davalı', adi: 'KARSI B', vekil: '[av. baskasi]' }
  ];
  ok('rol çeviriciler', () => {
    assert.equal(rolSupheliMi(['SANIK']), 'supheli');
    assert.equal(rolSupheliMi(['Müşteki']), 'musteki');
    assert.equal(rolDavaciMi(['Davacı']), 'davaci');
    assert.equal(rolDavaciMi(['Davalı']), 'davali');
    assert.equal(rolDavaciMi(['Müdahil']), '');
    assert.equal(sehirCikar('YALOVA 2. ASLİYE HUKUK'), 'YALOVA');
  });
  ok('inceleme + cmk: başsavcılık, no, isim, rol dolar; avukat profile kalır', () => {
    assert.deepEqual(mapDavaOtofill('inceleme', header, taraflar, 'Mustafa Yıldıran'),
      { bassavcilik: 'YALOVA', sorusturma: '2026/123', rol: 'musteki', isim: 'MUVEKKIL A' });
    assert.deepEqual(mapDavaOtofill('cmk_kayit', header, taraflar, 'Mustafa Yıldıran'),
      { cmkBassavcilik: 'YALOVA', cmkSorusturmaNo: '2026/123', cmkRol: 'musteki', cmkTarafIsim: 'MUVEKKIL A' });
  });
  ok('gerekçeli + kesinleşme: mahkeme, esas, müvekkil dolar; karar no elle kalır', () => {
    const gk = mapDavaOtofill('gerekceli_karar', header, taraflar, 'Mustafa Yıldıran');
    assert.equal(gk.gkMahkemeAdi, 'YALOVA 2. ASLİYE HUKUK');
    assert.equal(gk.gkEsasNo, '2026/123');
    assert.equal(gk.gkTarafAdi, 'MUVEKKIL A');
    assert.equal(gk.gkTarafRolu, 'davaci');
    assert.ok(!('gkKararNo' in gk) && !('gkAvukatAdi' in gk), 'karar no ve avukat doldurulmamalı');
    const kes = mapDavaOtofill('kesinlesme_talebi', header, taraflar, 'Mustafa Yıldıran');
    assert.equal(kes.kesMahkemeAdi, 'YALOVA 2. ASLİYE HUKUK');
    assert.equal(kes.kesTarafRolu, 'davaci');
    assert.ok(!('kesKararNo' in kes), 'karar no doldurulmamalı');
  });
  ok('eşleşen müvekkil yoksa isim boş kalır (yanlış ad yazılmaz)', () => {
    const out = mapDavaOtofill('inceleme', header,
      [{ rol: 'Davacı', adi: 'X', vekil: '[av. baskasi]' }], 'Mustafa Yıldıran');
    assert.equal(out.isim, '');
  });
  ok('5 formda düğme var, yetki belgesinde yok', () => {
    const html = fs.readFileSync(new URL('../popup.html', import.meta.url), 'utf8');
    for (const s of ['inceleme', 'cmk_kayit', 'icra_itiraz', 'gerekceli_karar', 'kesinlesme_talebi'])
      assert.ok(html.includes(`data-sablon="${s}"`), `${s} düğmesi yok`);
    const yetkiBolumu = html.slice(html.indexOf('id="groupYetkiBelgesi"'));
    assert.ok(!yetkiBolumu.slice(0, yetkiBolumu.indexOf('id="groupCmk"')).includes('btn-otofill'), 'yetki belgesinde düğme olmamalı');
  });
}

console.log(`\n✅ ${passed} test grubu geçti`);
