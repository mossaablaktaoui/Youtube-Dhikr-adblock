(() => {
  'use strict';

  const DEFAULT_DHIKR = [
    'الحمد لله',
    'سبحان الله',
    'لا إله إلا الله',
    'الله أكبر',
    'لا حول ولا قوة إلا بالله',
    'سبحان الله وبحمده',
    'سبحان الله العظيم',
    'أستغفر الله وأتوب إليه',
    'اللهم صلِّ على محمد',
  ];
  const OLD_ARABIC_DEFAULT_DHIKR = ['سبحان الله', 'الحمد لله', 'الله أكبر', 'أستغفر الله', 'لا إله إلا الله'];
  const OLD_ENGLISH_DEFAULT_DHIKR = ['SubhanAllah', 'Alhamdulillah', 'Allahu Akbar', 'Astaghfirullah', 'La ilaha illa Allah'];
  const DEFAULT_SETTINGS = {
    muteAds: true,
    autoSkip: true,
    hideAds: true,
    hideSidebarAds: true,
    dhikrList: [...DEFAULT_DHIKR],
    language: 'en',
    theme: 'light'
  };

  const I18N = {
    en: {
      dir: 'ltr', language: 'Language', title: 'Dhikr Ad Muter', subtitle: 'Mute, skip, and cover YouTube ads with Dhikr.',
      muteTitle: 'Mute Ads', muteDesc: 'Silence ad video immediately.', skipTitle: 'Auto-Skip', skipDesc: 'Click skip buttons automatically.',
      hideTitle: 'Hide Ads Overlay', hideDesc: 'Show black screen with Dhikr during ads.',
      hideSidebarTitle: 'Hide All Ads', hideSidebarDesc: 'Remove ads from sidebar, homepage, and everywhere else.',
      dhikrListTitle: 'Dhikr List', add: 'Add',
      input: 'Add custom Dhikr', overlayDhikr: 'Overlay Dhikr', empty: 'No Dhikr selected. Ads will show a plain black overlay.',
      edit: 'Edit', del: 'Delete', saved: 'Saved', added: 'Added', deleted: 'Deleted', updated: 'Updated', enter: 'Enter Dhikr first', exists: 'Already added', editPrompt: 'Change Dhikr text:', dark: 'Dark mode', light: 'Light mode'
    },
    ar: {
      dir: 'rtl', language: 'اللغة', title: 'كتم الإعلانات والذكر', subtitle: 'اكتم وتخطَّ وغطِّ إعلانات يوتيوب بالذكر.',
      muteTitle: 'كتم الإعلانات', muteDesc: 'كتم صوت الإعلان فورًا.', skipTitle: 'التخطي التلقائي', skipDesc: 'النقر على زر التخطي تلقائيًا.',
      hideTitle: 'تغطية الإعلانات', hideDesc: 'عرض شاشة سوداء مع الذكر أثناء الإعلان.',
      hideSidebarTitle: 'إخفاء كل الإعلانات', hideSidebarDesc: 'إزالة الإعلانات من الشريط الجانبي والصفحة الرئيسية وكل مكان.',
      dhikrListTitle: 'قائمة الأذكار', add: 'إضافة',
      input: 'أضف ذكرًا مخصصًا', overlayDhikr: 'أذكار الشاشة', empty: 'لا توجد أذكار. ستظهر شاشة سوداء فقط أثناء الإعلان.',
      edit: 'تعديل', del: 'حذف', saved: 'تم الحفظ', added: 'تمت الإضافة', deleted: 'تم الحذف', updated: 'تم التحديث', enter: 'أدخل ذكرًا أولًا', exists: 'موجود بالفعل', editPrompt: 'عدّل نص الذكر:', dark: 'الوضع الداكن', light: 'الوضع الفاتح'
    },
    fr: {
      dir: 'ltr', language: 'Langue', title: 'Muet pub & Dhikr', subtitle: 'Coupez, sautez et couvrez les pubs YouTube avec du Dhikr.',
      muteTitle: 'Couper les pubs', muteDesc: 'Couper le son de la pub immédiatement.', skipTitle: 'Saut automatique', skipDesc: 'Cliquer automatiquement sur le bouton passer.',
      hideTitle: 'Masquer les pubs', hideDesc: 'Afficher un écran noir avec Dhikr pendant les pubs.',
      hideSidebarTitle: 'Masquer toutes les pubs', hideSidebarDesc: 'Supprimer les pubs de la barre latérale, de l\'accueil et partout ailleurs.',
      dhikrListTitle: 'Liste de Dhikr', add: 'Ajouter',
      input: 'Ajouter un Dhikr personnalisé', overlayDhikr: 'Dhikr affiché', empty: 'Aucun Dhikr sélectionné. Les pubs auront un écran noir simple.',
      edit: 'Modifier', del: 'Supprimer', saved: 'Enregistré', added: 'Ajouté', deleted: 'Supprimé', updated: 'Mis à jour', enter: 'Entrez un Dhikr', exists: 'Déjà ajouté', editPrompt: 'Modifier le Dhikr :', dark: 'Mode sombre', light: 'Mode clair'
    },
    es: {
      dir: 'ltr', language: 'Idioma', title: 'Silenciar anuncios y Dhikr', subtitle: 'Silencia, salta y cubre anuncios de YouTube con Dhikr.',
      muteTitle: 'Silenciar anuncios', muteDesc: 'Silencia el anuncio inmediatamente.', skipTitle: 'Auto-saltar', skipDesc: 'Pulsa automáticamente el botón de saltar.',
      hideTitle: 'Ocultar anuncios', hideDesc: 'Muestra una pantalla negra con Dhikr durante anuncios.',
      hideSidebarTitle: 'Ocultar todos los anuncios', hideSidebarDesc: 'Eliminar anuncios de la barra lateral, inicio y en todas partes.',
      dhikrListTitle: 'Lista de Dhikr', add: 'Añadir',
      input: 'Añadir Dhikr personalizado', overlayDhikr: 'Dhikr en pantalla', empty: 'No hay Dhikr seleccionado. Los anuncios mostrarán una pantalla negra.',
      edit: 'Editar', del: 'Eliminar', saved: 'Guardado', added: 'Añadido', deleted: 'Eliminado', updated: 'Actualizado', enter: 'Introduce un Dhikr', exists: 'Ya existe', editPrompt: 'Cambiar texto del Dhikr:', dark: 'Modo oscuro', light: 'Modo claro'
    },
    tr: {
      dir: 'ltr', language: 'Dil', title: 'Reklam Susturucu & Zikir', subtitle: 'YouTube reklamlarını sustur, atla ve zikirle kapat.',
      muteTitle: 'Reklamları Sustur', muteDesc: 'Reklam sesini hemen kapat.', skipTitle: 'Otomatik Geç', skipDesc: 'Geç düğmesine otomatik tıkla.',
      hideTitle: 'Reklamı Gizle', hideDesc: 'Reklamda zikirli siyah ekran göster.',
      hideSidebarTitle: 'Tüm Reklamları Gizle', hideSidebarDesc: 'Reklamları kenar çubuğundan, ana sayfadan ve her yerden kaldır.',
      dhikrListTitle: 'Zikir Listesi', add: 'Ekle',
      input: 'Özel zikir ekle', overlayDhikr: 'Ekran Zikri', empty: 'Zikir yok. Reklamlarda düz siyah ekran gösterilir.',
      edit: 'Düzenle', del: 'Sil', saved: 'Kaydedildi', added: 'Eklendi', deleted: 'Silindi', updated: 'Güncellendi', enter: 'Önce zikir girin', exists: 'Zaten eklendi', editPrompt: 'Zikir metnini değiştir:', dark: 'Koyu mod', light: 'Açık mod'
    },
    id: {
      dir: 'ltr', language: 'Bahasa', title: 'Peredam Iklan & Dzikir', subtitle: 'Bisukan, lewati, dan tutupi iklan YouTube dengan dzikir.',
      muteTitle: 'Bisukan Iklan', muteDesc: 'Matikan suara iklan seketika.', skipTitle: 'Lewati Otomatis', skipDesc: 'Klik tombol lewati secara otomatis.',
      hideTitle: 'Sembunyikan Iklan', hideDesc: 'Tampilkan layar hitam dengan dzikir saat iklan.',
      hideSidebarTitle: 'Sembunyikan Semua Iklan', hideSidebarDesc: 'Hapus iklan dari sidebar, beranda, dan di mana pun.',
      dhikrListTitle: 'Daftar Dzikir', add: 'Tambah',
      input: 'Tambah dzikir khusus', overlayDhikr: 'Dzikir Overlay', empty: 'Tidak ada dzikir. Iklan akan menampilkan layar hitam polos.',
      edit: 'Edit', del: 'Hapus', saved: 'Tersimpan', added: 'Ditambahkan', deleted: 'Dihapus', updated: 'Diperbarui', enter: 'Masukkan dzikir dulu', exists: 'Sudah ada', editPrompt: 'Ubah teks dzikir:', dark: 'Mode gelap', light: 'Mode terang'
    }
  };

  const elements = {
    languageSelect: document.getElementById('languageSelect'), themeToggle: document.getElementById('themeToggle'), languageLabel: document.getElementById('languageLabel'),
    appTitle: document.getElementById('appTitle'), appSubtitle: document.getElementById('appSubtitle'), muteTitle: document.getElementById('muteTitle'), muteDesc: document.getElementById('muteDesc'),
    skipTitle: document.getElementById('skipTitle'), skipDesc: document.getElementById('skipDesc'), hideTitle: document.getElementById('hideTitle'), hideDesc: document.getElementById('hideDesc'),
    hideSidebarTitle: document.getElementById('hideSidebarTitle'), hideSidebarDesc: document.getElementById('hideSidebarDesc'),
    dhikrListTitle: document.getElementById('dhikrListTitle'), addButton: document.getElementById('addButton'), overlayDhikrLabel: document.getElementById('overlayDhikrLabel'),
    muteAds: document.getElementById('muteAds'), autoSkip: document.getElementById('autoSkip'), hideAds: document.getElementById('hideAds'), hideSidebarAds: document.getElementById('hideSidebarAds'), addForm: document.getElementById('addForm'),
    customDhikr: document.getElementById('customDhikr'), dhikrList: document.getElementById('dhikrList'), emptyState: document.getElementById('emptyState'), countBadge: document.getElementById('countBadge'), status: document.getElementById('status')
  };

  let state = { ...DEFAULT_SETTINGS };
  let statusTimer = null;
  const t = key => (I18N[state.language] || I18N.en)[key] || I18N.en[key] || key;

  function normalizeDhikr(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
  function uniqueDhikr(list) {
    const seen = new Set();
    return list.map(normalizeDhikr).filter(Boolean).filter(item => {
      const key = item.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  function isExactDefaultList(list, defaults) { return Array.isArray(list) && list.length === defaults.length && defaults.every(item => list.includes(item)); }

  function applyTheme() {
    document.body.classList.toggle('dark', state.theme === 'dark');
    elements.themeToggle.textContent = state.theme === 'dark' ? '☀️' : '🌙';
    elements.themeToggle.title = state.theme === 'dark' ? t('light') : t('dark');
  }

  function applyLanguage() {
    const lang = I18N[state.language] || I18N.en;
    document.documentElement.lang = state.language;
    document.documentElement.dir = lang.dir;
    elements.languageLabel.textContent = t('language');
    elements.appTitle.textContent = t('title');
    elements.appSubtitle.textContent = t('subtitle');
    elements.muteTitle.textContent = t('muteTitle');
    elements.muteDesc.textContent = t('muteDesc');
    elements.skipTitle.textContent = t('skipTitle');
    elements.skipDesc.textContent = t('skipDesc');
    elements.hideTitle.textContent = t('hideTitle');
    elements.hideDesc.textContent = t('hideDesc');
    elements.hideSidebarTitle.textContent = t('hideSidebarTitle');
    elements.hideSidebarDesc.textContent = t('hideSidebarDesc');
    elements.dhikrListTitle.textContent = t('dhikrListTitle');
    elements.addButton.textContent = t('add');
    elements.customDhikr.placeholder = t('input');
    elements.overlayDhikrLabel.textContent = t('overlayDhikr');
    elements.emptyState.textContent = t('empty');
    applyTheme();
  }

  function showStatus(messageKey) {
    elements.status.textContent = t(messageKey) || messageKey;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { elements.status.textContent = ''; }, 1600);
  }

  function save(partial, message = 'saved') {
    state = { ...state, ...partial };
    if (partial.dhikrList) state.dhikrList = uniqueDhikr(partial.dhikrList);
    const payload = partial.dhikrList ? { ...partial, dhikrList: state.dhikrList } : partial;
    chrome.storage.local.set(payload, () => {
      if (chrome.runtime.lastError) return showStatus('Unable to save settings');
      render(); showStatus(message);
    });
  }

  function load() {
    chrome.storage.local.get(DEFAULT_SETTINGS, stored => {
      const storedDhikr = Array.isArray(stored.dhikrList) ? stored.dhikrList : DEFAULT_DHIKR;
      const migrate = isExactDefaultList(storedDhikr, OLD_ENGLISH_DEFAULT_DHIKR) || isExactDefaultList(storedDhikr, OLD_ARABIC_DEFAULT_DHIKR);
      state = { ...DEFAULT_SETTINGS, ...stored, dhikrList: uniqueDhikr(migrate ? DEFAULT_DHIKR : storedDhikr) };
      if (!I18N[state.language]) state.language = 'en';
      if (!['light', 'dark'].includes(state.theme)) state.theme = 'light';
      chrome.storage.local.set(state, render);
    });
  }

  function renderDhikrList() {
    elements.dhikrList.innerHTML = '';
    elements.countBadge.textContent = String(state.dhikrList.length);
    elements.emptyState.style.display = state.dhikrList.length ? 'none' : 'block';

    state.dhikrList.forEach((text, index) => {
      const li = document.createElement('li'); li.className = 'dhikr-item';
      const value = document.createElement('span'); value.textContent = text;
      const actions = document.createElement('div'); actions.className = 'item-actions';

      const editButton = document.createElement('button');
      editButton.className = 'edit-button'; editButton.type = 'button'; editButton.textContent = t('edit');
      editButton.addEventListener('click', () => {
        const updated = normalizeDhikr(prompt(t('editPrompt'), text));
        if (!updated || updated === text) return;
        if (state.dhikrList.some((item, i) => i !== index && item.toLocaleLowerCase() === updated.toLocaleLowerCase())) return showStatus('exists');
        const next = [...state.dhikrList]; next[index] = updated; save({ dhikrList: next }, 'updated');
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'delete-button'; deleteButton.type = 'button'; deleteButton.textContent = t('del');
      deleteButton.addEventListener('click', () => save({ dhikrList: state.dhikrList.filter((_, i) => i !== index) }, 'deleted'));
      actions.append(editButton, deleteButton); li.append(value, actions); elements.dhikrList.appendChild(li);
    });
  }

  function render() {
    elements.languageSelect.value = state.language;
    elements.muteAds.checked = Boolean(state.muteAds);
    elements.autoSkip.checked = Boolean(state.autoSkip);
    elements.hideAds.checked = Boolean(state.hideAds);
    elements.hideSidebarAds.checked = Boolean(state.hideSidebarAds);
    applyLanguage();
    renderDhikrList();
  }

  function bindEvents() {
    elements.languageSelect.addEventListener('change', event => save({ language: event.target.value }, 'saved'));
    elements.themeToggle.addEventListener('click', () => save({ theme: state.theme === 'dark' ? 'light' : 'dark' }, 'saved'));
    ['muteAds', 'autoSkip', 'hideAds', 'hideSidebarAds'].forEach(key => elements[key].addEventListener('change', event => save({ [key]: event.target.checked })));
    elements.addForm.addEventListener('submit', event => {
      event.preventDefault();
      const value = normalizeDhikr(elements.customDhikr.value);
      if (!value) return showStatus('enter');
      if (state.dhikrList.some(item => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
        elements.customDhikr.value = ''; return showStatus('exists');
      }
      elements.customDhikr.value = ''; save({ dhikrList: [...state.dhikrList, value] }, 'added');
    });
  }

  document.addEventListener('DOMContentLoaded', () => { bindEvents(); load(); });
})();
