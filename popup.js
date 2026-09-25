const dilekceTuruSel = document.getElementById('dilekceTuru');
const groupSorusturma = document.getElementById('groupSorusturma');
const groupYetkiBelgesi = document.getElementById('groupYetkiBelgesi');
const groupCmk = document.getElementById('groupCmk');
const groupIcraItiraz = document.getElementById('groupIcraItiraz');

const rolSel = document.getElementById('rol');
const isimLabel = document.getElementById('isimLabel');
const avukatLabel = document.getElementById('avukatLabel');

function toggleFormGroups(){
  const val = dilekceTuruSel.value;
  groupSorusturma.style.display = 'none';
  groupYetkiBelgesi.style.display = 'none';
  groupCmk.style.display = 'none';
  groupIcraItiraz.style.display = 'none';

  if(val === 'yetki_belgesi'){
    groupYetkiBelgesi.style.display = 'block';
  } else if(val === 'cmk_kayit'){
    groupCmk.style.display = 'block';
  } else if(val === 'icra_itiraz'){
    groupIcraItiraz.style.display = 'block';
  } else {
    groupSorusturma.style.display = 'block';
  }
}
dilekceTuruSel.addEventListener('change', toggleFormGroups);
toggleFormGroups();

function syncLabels(){
  if(!rolSel) return;
  if(rolSel.value === 'supheli'){
    isimLabel.textContent = 'Şüphelinin Adı Soyadı';
    avukatLabel.textContent = 'Müdafiin Adı Soyadı';
  } else {
    isimLabel.textContent = 'Müştekinin Adı Soyadı';
    avukatLabel.textContent = 'Vekilinin Adı Soyadı';
  }
}
if(rolSel){
  rolSel.addEventListener('change', syncLabels);
  syncLabels();
}

function attrsToStr(a){
  let s = '';
  for(const k in a){ s += ' ' + k + '="' + a[k] + '"'; }
  return s;
}

function cleanPartForFilename(str){
  if(!str) return '';
  const trMap = { 'ç':'c', 'Ç':'C', 'ğ':'g', 'Ğ':'G', 'ı':'i', 'İ':'I', 'ö':'o', 'Ö':'O', 'ş':'s', 'Ş':'S', 'ü':'u', 'Ü':'U' };
  return str.replace(/[çÇğĞıİöÖşŞüÜ]/g, m => trMap[m])
            .replace(/[^a-zA-Z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');
}

function buildContentXml(data){
  let offset = 0;
  let fullText = '';
  let bodyParas = '';
  const font = data.yaziTipi || 'Times New Roman';

  function addPara(pAttrs, runs){
    let inner = '';
    for(const r of runs){
      const len = r.text.length;
      inner += '<content' + attrsToStr(r.attrs || {}) + ' startOffset="' + offset + '" length="' + len + '" />';
      fullText += r.text;
      offset += len;
    }
    bodyParas += '<paragraph' + attrsToStr(pAttrs) + '>' + inner + '</paragraph>';
  }

  function addEmptyLine(alignment = "3"){
    addPara({Alignment: alignment, LineSpacing:"0.5"}, [
      {text:"\n", attrs:{}}
    ]);
  }

  if(data.dilekceTuru === 'yetki_belgesi'){
    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text:"III\n", attrs:{bold:"true"}}
    ]);
    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text:"YETKİ BELGESİ\n", attrs:{bold:"true"}}
    ]);
    
    addEmptyLine("1");

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"YETKİ BELGESİ VEREN AVUKAT/AVUKATLIK ORTAKLIĞI\n", attrs:{bold:"true", underline:"true"}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"AD VE SOYADI\t\t: ", attrs:{bold:"true"}},
      {text:"Av. " + data.yvAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"BARO VE SİCİL NO\t\t: ", attrs:{bold:"true"}},
      {text: data.yvBaro + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"VERGİ DAİRESİ VE SİCİL NO\t: ", attrs:{bold:"true"}},
      {text: data.yvVergi + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"ADRES\t\t\t: ", attrs:{bold:"true"}},
      {text: data.yvAdres + "\n", attrs:{}}
    ]);

    addEmptyLine("3");

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"YETKİLİ KILINAN AVUKAT\n", attrs:{bold:"true", underline:"true"}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"AD VE SOYADI\t\t: ", attrs:{bold:"true"}},
      {text:"Av. " + data.ykAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"BARO VE SİCİL NO\t\t: ", attrs:{bold:"true"}},
      {text: data.ykBaro + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"VERGİ DAİRESİ VE SİCİL NO\t: ", attrs:{bold:"true"}},
      {text: data.ykVergi + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"ADRES\t\t\t: ", attrs:{bold:"true"}},
      {text: data.ykAdres + "\n", attrs:{}}
    ]);

    addEmptyLine("3");

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"VEKİL EDEN\n", attrs:{bold:"true", underline:"true"}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"AD VE SOYADI\t\t: ", attrs:{bold:"true"}},
      {text: data.vekilEden + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"DAYANAK BELGE\t\t: ", attrs:{bold:"true"}},
      {text: data.vekaletNoter + "\n", attrs:{}}
    ]);

    addEmptyLine("3");

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"YETKİ BELGESİNİN KAPSAMI\n", attrs:{bold:"true", underline:"true"}}
    ]);

    const kapsamMetni1 = "Yalnızca " + data.mahkemeAdi + " " + data.mahkemeEsas + " Esas sayılı dosyaya şamil olmak üzere duruşmalara katılmaya, dilekçe, beyan ve soru sunmaya, delil sunmaya ve tüm yargılama faaliyetlerini yürütmeye, kararın tebliğini talep etmeye ve tebliğ almaya tarafımca yetki verilmiştir. İşbu yetki, müvekkilin haklarını korumak amacıyla vekaletname kapsamındaki yetkilerim çerçevesinde devredilmiştir.\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: kapsamMetni1, attrs:{resolver:"hvl-default"}}
    ]);

    const kapsamMetni2 = "Bu yetki belgesi, 1136 sayılı Avukatlık Kanunu’nu değiştiren 4667 sayılı Kanun’un 36. maddesi ile 56. maddesine eklenen hüküm uyarınca, vekaletname yerine geçmek üzere, tarafımdan düzenlenmiştir.\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: kapsamMetni2, attrs:{resolver:"hvl-default"}}
    ]);

    addEmptyLine("2");

    addPara({Alignment:"2", LineSpacing:"0.5"}, [
      {text:"Av. " + data.yvAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"2", LineSpacing:"0.5"}, [
      {text:"e-imzalıdır\n", attrs:{}}
    ]);

  } else if(data.dilekceTuru === 'cmk_kayit'){
    const isMudaﬁ = data.cmkRol === 'supheli';
    const tarafTitle = isMudaﬁ ? 'ŞÜPHELİ' : 'MÜŞTEKİ';
    const avTitle = isMudaﬁ ? 'MÜDAFİ' : 'VEKİLİ';
    const gorevUnvani = isMudaﬁ ? 'zorunlu müdafi' : 'zorunlu vekil';

    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text:"T.C.\n", attrs:{bold:"true"}}
    ]);
    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text: data.cmkBassavcilik + " CUMHURİYET BAŞSAVCILIĞINA\n\n", attrs:{bold:"true"}}
    ]);

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"SORUŞTURMA NO\t: ", attrs:{bold:"true"}},
      {text: data.cmkSorusturmaNo + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text: tarafTitle + "\t\t: ", attrs:{bold:"true"}},
      {text: data.cmkTarafIsim + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text: avTitle + "\t\t: ", attrs:{bold:"true"}},
      {text: "Av. " + data.cmkAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"KONU\t\t: ", attrs:{bold:"true"}},
      {text: "CMK uyarınca " + gorevUnvani + " kaydımızın yapılması ve dosya erişim yetkisi verilmesi talebidir.\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"AÇIKLAMALAR\t:\n", attrs:{bold:"true"}}
    ]);

    const p1 = data.cmkBaro + " tarafından yukarıda numarası belirtilen soruşturma dosyası kapsamında " + (isMudaﬁ ? "şüpheli" : "müşteki/mağdur") + " " + data.cmkTarafIsim + " için CMK hükümleri uyarınca " + gorevUnvani + " olarak görevlendirilmiş bulunmaktayım. Görevlendirme yazısı dilekçemiz ekinde sunulmuştur.\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: p1, attrs:{resolver:"hvl-default"}}
    ]);

    const p2 = "5271 sayılı Ceza Muhakemesi Kanunu’nun 150 ve devamı maddeleri ile Ceza Muhakemesi Kanunu Gereğince Müdafi ve Vekillerin Görevlendirilmeleri ile Yapılacak Ödemelerin Usul ve Esaslarına İlişkin Yönetmelik hükümleri uyarınca, tarafıma ait vekâlet/müdafilik görevinin dosya kayıtlarına işlenmesi ve UYAP sistemine vekil kaydımın yapılması gerekmektedir.\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: p2, attrs:{resolver:"hvl-default"}}
    ]);

    const p3 = "Bu kapsamda, CMK kapsamında yürütülen görevlendirmeye ilişkin ücret ve sair yasal haklarımın talep edilebilmesi bakımından dosyaya vekil kaydımın yapılmasını vekâleten talep ederim.\n\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: p3, attrs:{resolver:"hvl-default"}}
    ]);

    addEmptyLine("2");

    addPara({Alignment:"2", LineSpacing:"0.5"}, [
      {text:"Av. " + data.cmkAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"2", LineSpacing:"0.5"}, [
      {text:"e-imzalıdır\n", attrs:{}}
    ]);

  } else if(data.dilekceTuru === 'icra_itiraz'){
    // === İCRA BORCA VE FERİLERİNE İTİRAZ DİLEKÇESİ ===
    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text:"T.C.\n", attrs:{bold:"true"}}
    ]);
    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text: data.icraMudurlugu + " İCRA MÜDÜRLÜĞÜNE\n\n", attrs:{bold:"true"}}
    ]);

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"ESAS NO\t\t: ", attrs:{bold:"true"}},
      {text: data.icraEsasNo + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"BORÇLU\t\t: ", attrs:{bold:"true"}},
      {text: data.borcluAdi + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"VEKİLİ\t\t: ", attrs:{bold:"true"}},
      {text: "Av. " + data.icraAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"KONU\t\t: ", attrs:{bold:"true"}},
      {text: "BORCA, FAİZE VE TÜM FERİLERE İTİRAZ HK.\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"AÇIKLAMALAR\t:\n", attrs:{bold:"true"}}
    ]);

    const icraP1 = "Yukarıda esas numarası belirtilen icra dosyası kapsamında tarafımıza yöneltilen takip konusu asıl alacağın tamamına, işlemiş ve işleyecek faizin tamamına, faiz oranına, faiz başlangıç tarihine, icra takip giderlerine, vekâlet ücretine ve sair tüm asli ve fer’î alacaklara ayrı ayrı ve açıkça itiraz ediyoruz.\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: icraP1, attrs:{resolver:"hvl-default"}}
    ]);

    const icraP2 = "İtirazlarımız doğrultusunda icra takibinin durdurulmasına karar verilmesini vekâleten talep ederim.\n\n";
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text: icraP2, attrs:{resolver:"hvl-default"}}
    ]);

    addEmptyLine("2");

    addPara({Alignment:"2", LineSpacing:"0.5"}, [
      {text:"Av. " + data.icraAvukat + "\n", attrs:{}}
    ]);
    addPara({Alignment:"2", LineSpacing:"0.5"}, [
      {text:"e-imzalıdır\n", attrs:{}}
    ]);

  } else {
    const roleLabel = data.rol === 'supheli' ? 'ŞÜPHELİ' : 'MÜŞTEKİ';
    const repLabel  = data.rol === 'supheli' ? 'MÜDAFİ' : 'VEKİLİ';

    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text:"T.C.\n", attrs:{bold:"true"}}
    ]);
    addPara({Alignment:"1", LineSpacing:"0.5"}, [
      {text: data.bassavcilik + " CUMHURİYET BAŞSAVCILIĞINA\n", attrs:{bold:"true"}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"SORUŞTURMA NO.\t: ", attrs:{bold:"true"}},
      {text: data.sorusturmaNo + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text: roleLabel + "\t\t: ", attrs:{bold:"true"}},
      {text: data.isim + "\n", attrs:{}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text: repLabel + "\t\t: ", attrs:{bold:"true"}},
      {text: data.avukat + "\n", attrs:{resolver:"hvl-default"}}
    ]);

    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"KONU\t\t:", attrs:{resolver:"hvl-default", bold:"true"}},
      {text:" Avukatın Soruşturma Dosyasını İnceleme Talebi (Portal)\n", attrs:{resolver:"hvl-default"}}
    ]);
    addPara({Alignment:"3", LineSpacing:"0.5"}, [
      {text:"AÇIKLAMALAR\t:\n", attrs:{bold:"true"}}
    ]);
    addPara({Alignment:"3", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text:"Başsavcılığınızın yukarıda numarası belirtilen soruşturma dosyasının, müdafii olarak UYAP Avukat Portal üzerinden tarafımızca incelenebilmesi ve dosya kapsamında bulunan belgelere erişim sağlanabilmesi için gerekli yetkilendirmenin yapılmasını vekâleten talep ederim.\n", attrs:{resolver:"hvl-default"}}
    ]);
    addPara({Alignment:"2", FirstLineIndent:"25.51181", LineSpacing:"0.5"}, [
      {text:"Av. ", attrs:{resolver:"hvl-default"}},
      {text: data.avukat + "\n", attrs:{}}
    ]);
  }

  let footerInner = '';
  const t1 = "5070 Sayılı Kanuna Göre Güvenli Elektronik İmza ile İmzalanmıştır.";
  footerInner += '<content size="8" foreground="-196608" startOffset="' + offset + '" length="' + t1.length + '" />';
  fullText += t1; offset += t1.length;
  const t2 = "\n";
  footerInner += '<content family="' + font + '" size="12" description="Gövde" startOffset="' + offset + '" length="' + t2.length + '" />';
  fullText += t2; offset += t2.length;
  fullText += "\n";

  if(fullText.indexOf(']]>') !== -1){
    fullText = fullText.split(']]>').join(']]&gt;');
  }

  return '<?xml version="1.0" encoding="UTF-8" ?> \n\n<template format_id="1.8" >\n' +
    '<content><![CDATA[' + fullText + ']]></content>' +
    '<properties><pageFormat mediaSizeName="1" leftMargin="42.525000000000006" rightMargin="42.525000000000006" topMargin="42.525000000000006" bottomMargin="42.525000000000006" paperOrientation="1" headerFOffset="20.0" footerFOffset="20.0" /></properties>\n' +
    '<elements resolver="hvl-default" >\n' + bodyParas +
    '<footer><paragraph Alignment="1">' + footerInner + '</paragraph></footer>\n</elements>\n' +
    '<styles><style name="default" description="Geçerli" family="' + font + '" size="12" bold="false" italic="false" foreground="-13421773" FONT_ATTRIBUTE_KEY="javax.swing.plaf.FontUIResource[family=' + font + ',name=' + font + ',style=plain,size=12]" /><style name="hvl-default" family="' + font + '" size="12" description="Gövde" /></styles>\n</template>\n';
}

function showMsg(text, kind){
  const el = document.getElementById('msg');
  el.textContent = text;
  el.className = 'msg show ' + kind;
}

function makeCrc32Table(){
  let c; const table = [];
  for(let n =0; n < 256; n++){
    c = n;
    for(let k =0; k < 8; k++){ c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)); }
    table[n] = c;
  }
  return table;
}
const crc32Table = makeCrc32Table();
function crc32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++ ) {
    crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

async function createZipBlob(filename, uncompressedData) {
  const encoder = new TextEncoder();
  const fileBytes = encoder.encode(uncompressedData);
  const fileCrc = crc32(fileBytes);
  const uncompressedSize = fileBytes.length;

  const cs = new CompressionStream('deflate-raw');
  const writer = cs.writable.getWriter();
  writer.write(fileBytes);
  writer.close();

  const compressedChunks = [];
  const reader = cs.readable.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    compressedChunks.push(value);
  }

  const compressedBytes = new Uint8Array(
    compressedChunks.reduce((acc, chunk) => acc + chunk.length, 0)
  );
  let offset = 0;
  for (const chunk of compressedChunks) {
    compressedBytes.set(chunk, offset);
    offset += chunk.length;
  }
  const compressedSize = compressedBytes.length;

  const fileNameBytes = encoder.encode(filename);
  const fileNameLen = fileNameBytes.length;

  const localHeaderLen = 30 + fileNameLen;
  const cdHeaderLen = 46 + fileNameLen;
  const eocdLen = 22;

  const totalLen = localHeaderLen + compressedSize + cdHeaderLen + eocdLen;
  const zipBuffer = new Uint8Array(totalLen);
  const view = new DataView(zipBuffer.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 8, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, fileCrc, true);
  view.setUint32(18, compressedSize, true);
  view.setUint32(22, uncompressedSize, true);
  view.setUint16(26, fileNameLen, true);
  view.setUint16(28, 0, true);
  zipBuffer.set(fileNameBytes, 30);

  zipBuffer.set(compressedBytes, localHeaderLen);

  const cdOffset = localHeaderLen + compressedSize;
  view.setUint32(cdOffset, 0x02014b50, true);
  view.setUint16(cdOffset + 4, 20, true);
  view.setUint16(cdOffset + 6, 20, true);
  view.setUint16(cdOffset + 8, 0, true);
  view.setUint16(cdOffset + 10, 8, true);
  view.setUint16(cdOffset + 12, 0, true);
  view.setUint16(cdOffset + 14, 0, true);
  view.setUint32(cdOffset + 16, fileCrc, true);
  view.setUint32(cdOffset + 20, compressedSize, true);
  view.setUint32(cdOffset + 24, uncompressedSize, true);
  view.setUint16(cdOffset + 28, fileNameLen, true);
  view.setUint16(cdOffset + 30, 0, true);
  view.setUint16(cdOffset + 32, 0, true);
  view.setUint16(cdOffset + 34, 0, true);
  view.setUint16(cdOffset + 36, 0, true);
  view.setUint32(cdOffset + 38, 0, true);
  
  // KRİTİK DÜZELTME: Tek dosyalık arşiv yapısında offset 0 olmalıdır.
  view.setUint32(cdOffset + 42, 0, true); 
  
  zipBuffer.set(fileNameBytes, cdOffset + 46);

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

document.getElementById('go').addEventListener('click', async () => {
  const dilekceTuru = document.getElementById('dilekceTuru').value;
  const yaziTipi = document.getElementById('yaziTipi').value;
  let fileName = "";
  let payload = { dilekceTuru, yaziTipi };

  if(dilekceTuru === 'yetki_belgesi'){
    payload.yvAvukat = document.getElementById('yvAvukat').value.trim();
    payload.yvBaro = document.getElementById('yvBaro').value.trim();
    payload.yvVergi = document.getElementById('yvVergi').value.trim();
    payload.yvAdres = document.getElementById('yvAdres').value.trim();

    payload.ykAvukat = document.getElementById('ykAvukat').value.trim();
    payload.ykBaro = document.getElementById('ykBaro').value.trim();
    payload.ykVergi = document.getElementById('ykVergi').value.trim();
    payload.ykAdres = document.getElementById('ykAdres').value.trim();

    payload.vekilEden = document.getElementById('vekilEden').value.trim();
    payload.vekaletNoter = document.getElementById('vekaletNoter').value.trim();

    payload.mahkemeAdi = document.getElementById('mahkemeAdi').value.trim();
    payload.mahkemeEsas = document.getElementById('mahkemeEsas').value.trim();

    if(!payload.yvAvukat || !payload.ykAvukat || !payload.vekilEden || !payload.mahkemeAdi || !payload.mahkemeEsas){
      showMsg('Lütfen zorunlu alanları doldurun.', 'err');
      return;
    }

    const cleanMahkeme = cleanPartForFilename(payload.mahkemeAdi);
    const cleanEsas = cleanPartForFilename(payload.mahkemeEsas);
    const cleanAvukat = cleanPartForFilename(payload.ykAvukat);

    fileName = `YetkiBelgesi_${cleanMahkeme}_${cleanEsas}_${cleanAvukat}.udf`;

  } else if(dilekceTuru === 'cmk_kayit'){
    payload.cmkBassavcilik = document.getElementById('cmkBassavcilik').value.trim().toLocaleUpperCase('tr');
    payload.cmkSorusturmaNo = document.getElementById('cmkSorusturmaNo').value.trim();
    payload.cmkRol = document.getElementById('cmkRol').value;
    payload.cmkTarafIsim = document.getElementById('cmkTarafIsim').value.trim();
    payload.cmkBaro = document.getElementById('cmkBaro').value.trim();
    payload.cmkAvukat = document.getElementById('cmkAvukat').value.trim();

    if(!payload.cmkBassavcilik || !payload.cmkSorusturmaNo || !payload.cmkTarafIsim || !payload.cmkBaro || !payload.cmkAvukat){
      showMsg('Lütfen tüm alanları doldurun.', 'err');
      return;
    }

    const cleanSavcilik = cleanPartForFilename(payload.cmkBassavcilik);
    const cleanSorusturma = cleanPartForFilename(payload.cmkSorusturmaNo);
    const cleanAv = cleanPartForFilename(payload.cmkAvukat);

    fileName = `CMK_Kayit_${cleanSavcilik}_${cleanSorusturma}_${cleanAv}.udf`;

  } else if(dilekceTuru === 'icra_itiraz'){
    payload.icraMudurlugu = document.getElementById('icraMudurlugu').value.trim().toLocaleUpperCase('tr');
    payload.icraEsasNo = document.getElementById('icraEsasNo').value.trim();
    payload.borcluAdi = document.getElementById('borcluAdi').value.trim();
    payload.icraAvukat = document.getElementById('icraAvukat').value.trim();

    if(!payload.icraMudurlugu || !payload.icraEsasNo || !payload.borcluAdi || !payload.icraAvukat){
      showMsg('Lütfen tüm alanları doldurun.', 'err');
      return;
    }

    const cleanMudurluk = cleanPartForFilename(payload.icraMudurlugu);
    const cleanEsas = cleanPartForFilename(payload.icraEsasNo);
    const cleanBorclu = cleanPartForFilename(payload.borcluAdi);

    fileName = `IcraItiraz_${cleanMudurluk}_${cleanEsas}_${cleanBorclu}.udf`;

  } else {
    payload.bassavcilik = document.getElementById('bassavcilik').value.trim().toLocaleUpperCase('tr');
    payload.sorusturmaNo = document.getElementById('sorusturma').value.trim();
    payload.rol = document.getElementById('rol').value;
    payload.isim = document.getElementById('isim').value.trim();
    payload.avukat = document.getElementById('avukat').value.trim();

    if(!payload.bassavcilik || !payload.sorusturmaNo || !payload.isim || !payload.avukat){
      showMsg('Lütfen tüm alanları doldurun.', 'err');
      return;
    }
    const safeName = (payload.sorusturmaNo || 'dilekce').replace(/[^\w\-]+/g, '_');
    fileName = 'sorusturma_' + safeName + '.udf';
  }

  if (!fileName || !fileName.endsWith('.udf')) {
    fileName = 'dilekce.udf';
  }

  const btn = document.getElementById('go');
  btn.disabled = true;
  btn.textContent = 'Hazırlanıyor...';

  try{
    const xml = buildContentXml(payload);
    const zipBuffer = await createZipBlob('content.xml', xml);

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
    btn.disabled = false;
    btn.textContent = 'UDF Dosyasını İndir';

  } catch(err){
    showMsg('Beklenmeyen bir hata oluştu: ' + (err && err.message ? err.message : err), 'err');
    btn.disabled = false;
    btn.textContent = 'UDF Dosyasını İndir';
  }
});
