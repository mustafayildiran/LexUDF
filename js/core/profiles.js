// Çoklu avukat profili yönetimi (chrome.storage.local — veriler yalnızca cihazda kalır).
import { templates } from '../templates/index.js';

const $ = id => document.getElementById(id);
const profilSecim = $('profilSecim');
const profAdSoyad = $('profAdSoyad');
const profBaro = $('profBaro');
const profVergi = $('profVergi');
const profAdres = $('profAdres');

let avukatlarListesi = [];

// Profil bilgisini, her şablonun kendi `profileFill` tanımına göre formlara yazar.
export function applyProfileToForms(p) {
  for (const t of templates) {
    for (const [elId, key] of Object.entries(t.profileFill || {})) {
      const el = $(elId);
      if (el) el.value = p[key] ?? '';
    }
  }
}

function clearProfileFields() {
  profAdSoyad.value = '';
  profBaro.value = '';
  profVergi.value = '';
  profAdres.value = '';
}

function renderOptions(selectedIndex) {
  profilSecim.innerHTML = '<option value="yeni">➕ Yeni Avukat Ekle...</option>';
  avukatlarListesi.forEach((av, index) => {
    const opt = document.createElement('option');
    opt.value = index;
    opt.textContent = av.adSoyad || `Avukat #${index + 1}`;
    profilSecim.appendChild(opt);
  });
  if (selectedIndex !== null && selectedIndex !== undefined) profilSecim.value = selectedIndex;
}

function loadProfileIntoForm(index) {
  const av = avukatlarListesi[index];
  if (!av) return;
  profAdSoyad.value = av.adSoyad || '';
  profBaro.value = av.baro || '';
  profVergi.value = av.vergi || '';
  profAdres.value = av.adres || '';
  applyProfileToForms(av);
  chrome.storage.local.set({ aktifAvukatIndex: index }).catch(console.error);
}

async function persist(activeIndex) {
  await chrome.storage.local.set({ avukatlarListesi, aktifAvukatIndex: activeIndex });
}

export async function initProfiles() {
  profilSecim.addEventListener('change', () => {
    const val = profilSecim.value;
    if (val === 'yeni') clearProfileFields();
    else loadProfileIntoForm(parseInt(val, 10));
  });

  $('btnSaveProfile').addEventListener('click', async () => {
    const ad = profAdSoyad.value.trim();
    if (!ad) {
      alert('Lütfen en azından Avukat Adı Soyadı alanını doldurun.');
      return;
    }
    const yeniAvukat = {
      adSoyad: ad,
      baro: profBaro.value.trim(),
      vergi: profVergi.value.trim(),
      adres: profAdres.value.trim()
    };

    let hedefIndex;
    if (profilSecim.value === 'yeni') {
      avukatlarListesi.push(yeniAvukat);
      hedefIndex = avukatlarListesi.length - 1;
    } else {
      hedefIndex = parseInt(profilSecim.value, 10);
      avukatlarListesi[hedefIndex] = yeniAvukat;
    }

    try {
      await persist(hedefIndex);
    } catch (err) {
      console.error(err);
      alert('Profil kaydedilemedi. Lütfen tekrar deneyin.');
      return;
    }
    renderOptions(hedefIndex);
    applyProfileToForms(yeniAvukat);
    alert('Avukat profili başarıyla cihaza kaydedildi!');
  });

  $('btnDeleteProfile').addEventListener('click', async () => {
    if (profilSecim.value === 'yeni') {
      alert('Silinecek bir profil seçilmedi.');
      return;
    }
    const index = parseInt(profilSecim.value, 10);
    if (!confirm('Bu avukat profilini silmek istediğinize emin misiniz?')) return;

    avukatlarListesi.splice(index, 1);
    const yeniAktifIndex = avukatlarListesi.length > 0 ? Math.max(0, index - 1) : 0;

    try {
      await persist(yeniAktifIndex);
    } catch (err) {
      console.error(err);
      alert('Profil silinemedi. Lütfen tekrar deneyin.');
      return;
    }
    renderOptions(avukatlarListesi.length > 0 ? yeniAktifIndex : null);
    if (avukatlarListesi.length > 0) loadProfileIntoForm(yeniAktifIndex);
    else clearProfileFields();
    alert('Profil silindi.');
  });

  // Kayıtlı profilleri yükle
  const result = await chrome.storage.local.get(['avukatlarListesi', 'aktifAvukatIndex']);
  avukatlarListesi = Array.isArray(result.avukatlarListesi) ? result.avukatlarListesi : [];
  renderOptions(null);
  if (avukatlarListesi.length > 0) {
    const aktifIdx = (Number.isInteger(result.aktifAvukatIndex) && result.aktifAvukatIndex >= 0 && result.aktifAvukatIndex < avukatlarListesi.length)
      ? result.aktifAvukatIndex
      : 0;
    profilSecim.value = aktifIdx;
    loadProfileIntoForm(aktifIdx);
  }
}
