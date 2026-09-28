// Çalıştır: npm test   (Node 18+; tarayıcı/Chrome gerekmez)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
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

console.log(`\n✅ ${passed} test grubu geçti`);
