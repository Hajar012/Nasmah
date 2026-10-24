'use strict';

const STORAGE_KEY = 'nasmah-progress-v1';
const THEME_KEY = 'nasmah-theme';
const LANG_KEY = 'nasmah-lang';
const PALETTE_KEY = 'nasmah-palette';
const PALETTES = ['purple-soft', 'ocean-indigo'];
const DEFAULT_PALETTE = 'purple-soft';
const COMPANIES_URL = '/api/companies';
const SUGGEST_URL = '/api/suggest';
const PAGE_SIZE = 12;

const I18N = {
    ar: {
        'page.title': 'نسمـــة | Nasmah — دليل التوظيف السعودي',
        'meta.description': 'نسمـــة دليل يخدمه المجتمع لمنصات التوظيف في المملكة العربيةالسعودية وصفحات الوظائف الرسمية للجهات.',
        'nav.primary': 'التنقل الرئيسي',
        'nav.home': 'الرئيسية',
        'nav.suggest': 'اقترح',
        'actions.themeToDark': 'تفعيل الوضع الداكن',
        'actions.themeToLight': 'تفعيل الوضع الفاتح',
        'actions.switchToEnglish': 'التبديل إلى الإنجليزية',
        'actions.switchToArabic': 'Switch to Arabic',
        'hero.eyebrow': 'دليل التوظيف السعودي',
        'hero.subtitle': 'دليلك المباشر لمنصات التوظيف في المملكة العربية السعودية',
        'hero.caption': 'تصفّح جهات التوظيف الموثوقة وافتح صفحات الوظائف مباشرة.',
        'hero.progressLabel': 'التقديمات',
        'hero.progressApplied': 'تم التقديم',
        'hero.progressAria': 'تقدم التقديم',
        'filters.searchLabel': 'البحث عن الشركات',
        'filters.searchPlaceholder': 'ابحث بالاسم العربي أو الإنجليزي…',
        'filters.searchAria': 'البحث عن الشركات',
        'filters.sectorMenu': 'تصفية حسب القطاع',
        'filters.statusMenu': 'تصفية حسب حالة التقديم',
        'filters.allSectors': 'كل القطاعات',
        'filters.allStatuses': 'كل الحالات',
        'filters.cityMenu': 'تصفية حسب المدينة',
        'filters.allCities': 'كل المدن',
        'filters.cityAria': 'تصفية حسب المدينة: {city}',
        'status.applied': 'قدَّمت',
        'status.notApplied': 'لم تقدم',
        'privacy.title': 'ملاحظة الخصوصية:',
        'privacy.text': 'تُحفظ حالة التقديم محليًا في هذا المتصفح فقط. لا تخزّن نسمـــة تقدمك على أي خادم.',
        'table.aria': 'جدول جهات التوظيف',
        'table.applied': 'قدَّمت',
        'table.company': 'الشركة',
        'table.status': 'الحالة',
        'table.sector': 'القطاع',
        'table.location': 'الموقع',
        'table.actions': 'الروابط',
        'table.loading': 'جارٍ تحميل الشركات…',
        'table.emptyFiltered': 'لا توجد شركات مطابقة لبحثك أو عوامل التصفية.',
        'table.empty': 'لا توجد شركات متاحة حالياً.',
        'table.error': 'تعذّر تحميل دليل الشركات.',
        'table.retry': 'حاول مرة أخرى',
        'table.careers': 'صفحة الوظائف',
        'table.linkedin': 'لينكدإن',
        'table.noLinks': 'لا توجد روابط',
        'table.uncategorized': 'غير مصنف',
        'table.markApplied': 'تعيين {company} كمتقدم إليها',
        'table.unmarkApplied': 'إزالة علامة التقديم من {company}',
        'table.linkAria': '{label} لـ {company} (يفتح في تبويب جديد)',
        'pagination.showing': 'عرض {start}–{end} من أصل {total} شركة',
        'pagination.previous': 'السابق',
        'pagination.next': 'التالي',
        'pagination.page': 'صفحة {page}',
        'pagination.label': 'ترقيم صفحات الدليل',
        'suggest.eyebrow': 'من المجتمع',
        'suggest.title': 'اقترح جهة توظيف',
        'suggest.subtitle': 'ساعدنا في إضافة جهات التوظيف في المملكة العربية السعودية المفقودة من الدليل.',
        'suggest.description': 'هل تعرف جهة توظيف غير موجودة في الدليل؟ شارك بياناتها وساعد الباحثين عن عمل في الوصول إلى صفحة الوظائف المناسبة.',
        'form.nameEn': 'اسم الشركة (بالإنجليزية)',
        'form.nameEnPlaceholder': ' Microsoft',
        'form.nameAr': 'اسم الشركة (بالعربية)',
        'form.nameArPlaceholder': 'مايكروسوفت',
        'form.careerUrl': 'رابط صفحة الوظائف',
        'form.careerUrlPlaceholder': 'https://example.com/careers',
        'form.linkedin': 'رابط لينكدإن',
        'form.linkedinPlaceholder': 'https://www.linkedin.com/company/example',
        'form.sector': 'القطاع',
        'form.sectorPlaceholder': ' التقنية',
        'form.location': 'الموقع',
        'form.locationPlaceholder': ' الرياض',
        'form.notes': 'ملاحظات',
        'form.notesPlaceholder': 'هل هناك أي شيء آخر يجب أن نعرفه؟',
        'form.optional': 'اختياري',
        'form.submit': 'إرسال الاقتراح',
        'form.submitting': 'جارٍ الإرسال…',
        'form.invalid': 'يرجى إدخال اسم الشركة ورابط وظائف صالح والقطاع والموقع.',
        'form.error': 'عذراً، تعذّر إرسال اقتراحك. يرجى المحاولة مرة أخرى.',
        'form.success': 'شكراً! تم إرسال اقتراحك للمراجعة.',
        'footer.text': 'نسمـــة دليل يخدمه المجتمع. تحقّق دائماً من التفاصيل على صفحة الوظائف الرسمية للجهة.',
        'footer.top': 'العودة إلى الأعلى',
        'footer.suggest': 'اقترح',
        'footer.copyright': 'جميع الحقوق محفوظة © 2026 Hajer M. Al-Mutairi',
        'footer.privacyLink': 'سياسة الخصوصية والشروط',
        'modal.title': 'سياسة الخصوصية والشروط',
        'modal.close': 'إغلاق النافذة',
        'modal.intro': 'نسمة دليل مهني يخدمه المجتمع. توضح هذه الصفحة كيفية حفظ بياناتك وشروط استخدام الدليل.',
        'modal.privacyHeading': 'سياسة الخصوصية',
        'modal.privacyBody': 'تُحفظ حالة التقديم محليًا في متصفحك باستخدام التخزين المحلي، ولا تُرسل إلى أي خادم أو طرف ثالث. تُحفظ اقتراحات جهات التوظيف لأغراض المراجعة وتحسين الدليل فقط، ولا تُستخدم لأي غرض آخر.',
        'modal.termsHeading': 'شروط الاستخدام',
        'modal.termsBody': 'يُقدَّم هذا الدليل لأغراض معلوماتية فقط. قد تتغير بيانات الشركات والروابط وصفحات الوظائف أو تصبح غير متاحة، لذا تحقّق دائمًا من المعلومات على الموقع الرسمي لجهة التوظيف. لا تتبع نسمة جهات التوظيف المدرجة وليست مسؤولة عن قرارات التوظيف أو المحتوى الخارجي.',
        'modal.contact': 'للاستفسارات أو الملاحظات، تواصل معنا عبر',
        'progress.aria': '{applied} من أصل {total} شركة تم التقديم إليها',
        'palette.purple-soft': 'بنفسجي ناعم',
        'palette.ocean-indigo': 'محيطي نيلي',
        'actions.cyclePalette': 'لوحة الألوان: {palette}. اضغط للتبديل.',
        'actions.paletteChanged': 'تم تغيير لوحة الألوان إلى {palette}.',
    },
    en: {
        'page.title': 'Nasmah — Saudi Career Directory',
        'meta.description': 'Nasmah is a community-maintained directory of Saudi career portals and employer career pages.',
        'nav.primary': 'Primary navigation',
        'nav.home': 'Home',
        'nav.suggest': 'Suggest',
        'actions.themeToDark': 'Switch to dark mode',
        'actions.themeToLight': 'Switch to light mode',
        'actions.switchToEnglish': 'Switch to English',
        'actions.switchToArabic': 'Switch to Arabic',
        'hero.eyebrow': 'Saudi Career Directory',
        'hero.subtitle': 'Your direct index for Saudi career portals.',
        'hero.caption': 'Browse verified employers in the Kingdom of Saudi Arabia and open their careers pages directly.',
        'hero.progressLabel': 'Application progress',
        'hero.progressApplied': 'Applied',
        'hero.progressAria': 'Application progress',
        'filters.searchLabel': 'Search companies',
        'filters.searchPlaceholder': 'Search by Arabic or English name…',
        'filters.searchAria': 'Search companies',
        'filters.sectorMenu': 'Filter by sector',
        'filters.statusMenu': 'Filter by application status',
        'filters.allSectors': 'All Sectors',
        'filters.allStatuses': 'All statuses',
        'filters.cityMenu': 'Filter by city',
        'filters.allCities': 'All Cities',
        'filters.cityAria': 'Filter by city: {city}',
        'status.applied': 'Applied',
        'status.notApplied': 'Not applied',
        'privacy.title': 'Privacy note:',
        'privacy.text': 'Your application status is saved locally in this browser only. Nasmah does not store your progress on any server.',
        'table.aria': 'Saudi employer directory table',
        'table.applied': 'Applied',
        'table.company': 'Company',
        'table.status': 'Status',
        'table.sector': 'Sector',
        'table.location': 'Location',
        'table.actions': 'Links',
        'table.loading': 'Loading companies…',
        'table.emptyFiltered': 'No companies match your search or filters.',
        'table.empty': 'No companies are available right now.',
        'table.error': 'We could not load the company directory.',
        'table.retry': 'Try again',
        'table.careers': 'Careers Page',
        'table.linkedin': 'LinkedIn',
        'table.noLinks': 'No links listed',
        'table.uncategorized': 'Uncategorized',
        'table.markApplied': 'Mark {company} as applied',
        'table.unmarkApplied': 'Remove the applied mark from {company}',
        'table.linkAria': '{label} for {company} (opens in a new tab)',
        'pagination.showing': 'Showing {start}–{end} of {total} companies',
        'pagination.previous': 'Previous',
        'pagination.next': 'Next',
        'pagination.page': 'Page {page}',
        'pagination.label': 'Directory pagination',
        'suggest.eyebrow': 'Community powered',
        'suggest.title': 'Suggest an employer',
        'suggest.subtitle': 'Help us add employers in the Kingdom of Saudi Arabia missing from the directory.',
        'suggest.description': 'Know an employer missing from the directory? Share their details and help other job seekers find the right careers page.',
        'form.nameEn': 'Company name (English)',
        'form.nameEnPlaceholder': ' Microsoft',
        'form.nameAr': 'Company name (Arabic)',
        'form.nameArPlaceholder': 'Company name',
        'form.careerUrl': 'Career URL',
        'form.careerUrlPlaceholder': 'https://example.com/careers',
        'form.linkedin': 'LinkedIn URL',
        'form.linkedinPlaceholder': 'https://www.linkedin.com/company/example',
        'form.sector': 'Sector',
        'form.sectorPlaceholder': ' Technology',
        'form.location': 'Location',
        'form.locationPlaceholder': ' Riyadh',
        'form.notes': 'Notes',
        'form.notesPlaceholder': 'Anything else we should know?',
        'form.optional': 'optional',
        'form.submit': 'Submit suggestion',
        'form.submitting': 'Submitting…',
        'form.invalid': 'Please provide a company name, a valid careers URL, a sector, and a location.',
        'form.error': 'Sorry, your suggestion could not be submitted. Please try again.',
        'form.success': 'Thanks! Your suggestion has been submitted for review.',
        'footer.text': "Nasmah is a community-maintained directory. Always verify details on the employer's official careers page.",
        'footer.top': 'Back to top',
        'footer.suggest': 'Suggest',
        'footer.copyright': 'All Rights Reserved © 2026 Hajer M. Al-Mutairi',
        'footer.privacyLink': 'Privacy Policy & Terms',
        'modal.title': 'Privacy Policy & Terms',
        'modal.close': 'Close dialog',
        'modal.intro': 'Nasmah is a community-maintained career directory. This page explains how your information is stored and the terms for using the directory.',
        'modal.privacyHeading': 'Privacy Policy',
        'modal.privacyBody': 'Your application progress is stored locally in your browser using localStorage and is never sent to a server or third party. Employer suggestions are stored only to review and improve the directory, and are not used for any other purpose.',
        'modal.termsHeading': 'Terms of Service',
        'modal.termsBody': "This directory is provided for informational purposes only. Company details, links, and career pages may change or become unavailable, so always verify information on the employer's official website. Nasmah is not affiliated with the listed employers and is not responsible for their hiring decisions or external content.",
        'modal.contact': 'Questions or concerns? Contact us at',
        'progress.aria': '{applied} of {total} companies marked as applied',
        'palette.purple-soft': 'Soft Purple',
        'palette.ocean-indigo': 'Ocean Indigo',
        'actions.cyclePalette': 'Color palette: {palette}. Click to switch.',
        'actions.paletteChanged': 'Color palette changed to {palette}.',
    },
};

const SECTOR_LABELS = {
    ar: {
        technology: 'التقنية',
        government: 'القطاع الحكومي',
        'banking & finance': 'المصارف والتمويل',
        banking: 'المصارف',
        finance: 'التمويل',
        telecom: 'الاتصالات',
        energy: 'الطاقة',
        consulting: 'الاستشارات',
        defense: 'الدفاع',
        entertainment: 'الترفيه',
        'real estate': 'العقارات',
        automotive: 'السيارات',
        aviation: 'الطيران',
        transportation: 'النقل',
        healthcare: 'الرعاية الصحية',
        education: 'التعليم',
        'food and beverage': 'الأغذية والمشروبات',
    },
    en: {},
};

const SECTOR_HUES = {
    technology: 270,
    government: 230,
    'banking & finance': 260,
    banking: 260,
    finance: 260,
    telecom: 300,
    energy: 330,
    consulting: 200,
    defense: 350,
    entertainment: 40,
    'real estate': 150,
    automotive: 190,
    aviation: 220,
    transportation: 170,
    healthcare: 0,
    education: 90,
};

const CITY_ORDER = ['Riyadh', 'Jeddah', 'Dammam', "Juabil"];

const CITY_LABELS = {
    ar: {
        riyadh: 'الرياض',
        jeddah: 'جدة',
        dammam: 'الدمام',
        juabil: 'الجبيل'
    },
    en: {},
};

const state = {
    companies: [],
    progress: loadProgress(),
    loaded: false,
    page: 1,
    pageSize: PAGE_SIZE,
    lang: getInitialLanguage(),
    theme: getInitialTheme(),
    palette: getInitialPalette(),
    listMessage: null,
    feedback: null,
};

const UI = {};
const dropdowns = new Map();
let searchTimeout = null;
let lastFocusedElement = null;

function init() {
    UI.companyList = document.getElementById('company-list');
    UI.searchInput = document.getElementById('search-input');
    UI.sectorFilter = document.getElementById('sector-filter');
    UI.statusFilter = document.getElementById('status-filter');
    UI.cityFilter = document.getElementById('city-filter');
    UI.appliedCount = document.getElementById('applied-count');
    UI.totalCount = document.getElementById('total-count');
    UI.progressBar = document.getElementById('progress-bar');
    UI.rangeSummary = document.getElementById('range-summary');
    UI.pagination = document.getElementById('pagination');
    UI.themeToggle = document.getElementById('theme-toggle');
    UI.paletteToggle = document.getElementById('palette-toggle');
    UI.paletteToggleLabel = document.getElementById('palette-toggle-label');
    UI.paletteStatus = document.getElementById('palette-status');
    UI.langToggle = document.getElementById('lang-toggle');
    UI.langToggleLabel = document.getElementById('lang-toggle-label');
    UI.suggestionForm = document.getElementById('suggestion-form');
    UI.suggestionFeedback = document.getElementById('suggestion-feedback');
    UI.suggestNameEn = document.getElementById('suggest-name-en');
    UI.suggestNameAr = document.getElementById('suggest-name-ar');
    UI.suggestCareerUrl = document.getElementById('suggest-career-url');
    UI.suggestLinkedinUrl = document.getElementById('suggest-linkedin-url');
    UI.suggestSector = document.getElementById('suggest-sector');
    UI.suggestLocation = document.getElementById('suggest-location');
    UI.suggestNotes = document.getElementById('suggest-notes');
    UI.privacyOpen = document.getElementById('privacy-open');
    UI.privacyModal = document.getElementById('privacy-modal');
    UI.privacyClose = document.getElementById('privacy-close');

    UI.privacyOpen?.addEventListener('click', openPrivacyModal);
    UI.privacyModal?.addEventListener('click', handlePrivacyModalClick);
    document.addEventListener('keydown', handlePrivacyKeydown);

    initDropdowns();
    applyPalette(state.palette, false);
    applyTheme(state.theme, false);
    applyLanguage(state.lang, false);

    if (!UI.companyList) {
        return;
    }

    UI.searchInput?.addEventListener('input', handleSearchInput);
    UI.sectorFilter?.addEventListener('change', handleFilterChange);
    UI.statusFilter?.addEventListener('change', handleFilterChange);
    UI.cityFilter?.addEventListener('change', handleFilterChange);
    UI.suggestionForm?.addEventListener('submit', submitSuggestion);
    UI.themeToggle?.addEventListener('click', () => {
        applyTheme(state.theme === 'dark' ? 'light' : 'dark', true);
    });
    UI.paletteToggle?.addEventListener('click', cyclePalette);
    UI.langToggle?.addEventListener('click', () => {
        applyLanguage(state.lang === 'ar' ? 'en' : 'ar', true);
    });
    window.addEventListener('storage', handleStorageChange);

    updateProgress();
    loadCompanies();
}

function getInitialLanguage() {
    return document.documentElement.lang === 'en' ? 'en' : 'ar';
}

function getInitialTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function getInitialPalette() {
    const palette = document.documentElement.getAttribute('data-palette');
    return PALETTES.includes(palette) ? palette : DEFAULT_PALETTE;
}

function getPaletteName(palette) {
    return t(`palette.${palette}`);
}

function t(key, variables = {}) {
    const dictionary = I18N[state.lang] || I18N.ar;
    const fallback = I18N.en[key];
    const template = dictionary[key] ?? fallback ?? key;
    return String(template).replace(/\{(\w+)\}/g, (match, name) => (
        Object.prototype.hasOwnProperty.call(variables, name) ? String(variables[name]) : match
    ));
}

function applyTheme(theme, persist) {
    state.theme = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeControl();
    updateThemeColor();

    if (persist) {
        try {
            window.localStorage.setItem(THEME_KEY, state.theme);
        } catch (error) {
            console.warn('Unable to save theme preference.', error);
        }
    }
}

function updateThemeControl() {
    if (!UI.themeToggle) {
        return;
    }
    const key = state.theme === 'dark' ? 'actions.themeToLight' : 'actions.themeToDark';
    UI.themeToggle.setAttribute('aria-label', t(key));
    UI.themeToggle.setAttribute('title', t(key));
}

function applyPalette(palette, persist) {
    state.palette = PALETTES.includes(palette) ? palette : DEFAULT_PALETTE;
    document.documentElement.setAttribute('data-palette', state.palette);
    updatePaletteControl();
    updateThemeColor();

    if (persist) {
        try {
            window.localStorage.setItem(PALETTE_KEY, state.palette);
        } catch (error) {
            console.warn('Unable to save palette preference.', error);
        }
    }
}

function cyclePalette() {
    const currentIndex = PALETTES.indexOf(state.palette);
    const nextPalette = PALETTES[(currentIndex + 1) % PALETTES.length];
    applyPalette(nextPalette, true);

    if (UI.paletteStatus) {
        UI.paletteStatus.textContent = t('actions.paletteChanged', {
            palette: getPaletteName(nextPalette),
        });
    }
}

function updatePaletteControl() {
    if (!UI.paletteToggle) {
        return;
    }
    const paletteName = getPaletteName(state.palette);
    if (UI.paletteToggleLabel) {
        UI.paletteToggleLabel.textContent = paletteName;
    }
    const label = t('actions.cyclePalette', { palette: paletteName });
    UI.paletteToggle.setAttribute('aria-label', label);
    UI.paletteToggle.setAttribute('title', label);
}

function updateThemeColor() {
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
        return;
    }
    const background = getComputedStyle(document.documentElement)
        .getPropertyValue('--background')
        .trim();
    if (background) {
        themeColor.setAttribute('content', background);
    }
}

function applyLanguage(language, persist) {
    state.lang = language === 'en' ? 'en' : 'ar';
    const root = document.documentElement;
    root.lang = state.lang;
    root.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

    document.title = t('page.title');
    const description = document.querySelector('meta[name="description"]');
    if (description) {
        description.setAttribute('content', t('meta.description'));
    }

    document.querySelectorAll('[data-i18n]').forEach((element) => {
        element.textContent = t(element.dataset.i18n);
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
        element.setAttribute('placeholder', t(element.dataset.i18nPlaceholder));
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
        element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
    });

    document.querySelectorAll('[data-i18n-title]').forEach((element) => {
        element.setAttribute('title', t(element.dataset.i18nTitle));
    });

    if (UI.langToggleLabel) {
        UI.langToggleLabel.textContent = state.lang === 'ar' ? 'English' : 'العربية';
    }
    if (UI.langToggle) {
        const toggleKey = state.lang === 'ar' ? 'actions.switchToEnglish' : 'actions.switchToArabic';
        UI.langToggle.setAttribute('aria-label', t(toggleKey));
        UI.langToggle.setAttribute('title', t(toggleKey));
    }

    updateThemeControl();
    updatePaletteControl();
    populateSectors();
    populateCities();
    syncDropdownLabel(UI.statusFilter);

    if (state.loaded) {
        renderCompanies();
        updateProgress();
    } else {
        updateRangeSummary(0, 0, 0);
        paintListMessage();
    }

    paintSuggestionFeedback();

    if (persist) {
        try {
            window.localStorage.setItem(LANG_KEY, state.lang);
        } catch (error) {
            console.warn('Unable to save language preference.', error);
        }
    }
}

function initDropdowns() {
    document.querySelectorAll('[data-dropdown]').forEach((root) => {
        const trigger = root.querySelector('[data-dropdown-trigger]');
        const menu = root.querySelector('[data-dropdown-menu]');
        const label = root.querySelector('[data-dropdown-label]');
        const input = root.querySelector('input[type="hidden"]');

        if (!trigger || !menu || !input) {
            return;
        }

        dropdowns.set(root, { trigger, menu, label, input });

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (menu.classList.contains('hidden')) {
                openDropdown(root);
            } else {
                closeDropdown(root);
            }
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') {
                return;
            }
            event.preventDefault();
            if (menu.classList.contains('hidden')) {
                openDropdown(root);
            }
            const options = [...menu.querySelectorAll('[data-value]')];
            const target = event.key === 'ArrowUp'
                ? options[options.length - 1]
                : options[0];
            target?.focus();
        });

        menu.addEventListener('click', (event) => {
            const option = event.target.closest('[data-value]');
            if (!option || !menu.contains(option)) {
                return;
            }
            event.stopPropagation();
            selectDropdownValue(root, option.dataset.value, option.textContent.trim());
        });

        menu.addEventListener('keydown', (event) => {
            const options = [...menu.querySelectorAll('[data-value]')];
            if (!options.length) {
                return;
            }
            const currentIndex = options.indexOf(document.activeElement);

            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                const direction = event.key === 'ArrowDown' ? 1 : -1;
                const nextIndex = (currentIndex + direction + options.length) % options.length;
                options[nextIndex].focus();
            } else if (event.key === 'Home') {
                event.preventDefault();
                options[0].focus();
            } else if (event.key === 'End') {
                event.preventDefault();
                options[options.length - 1].focus();
            } else if (event.key === 'Escape') {
                event.preventDefault();
                closeDropdown(root);
                trigger.focus();
            }
        });
    });

    document.addEventListener('click', () => closeAllDropdowns());
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllDropdowns();
        }
    });
}

function openDropdown(root) {
    closeAllDropdowns(root);
    const dropdown = dropdowns.get(root);
    if (!dropdown) {
        return;
    }
    dropdown.menu.hidden = false;
    dropdown.menu.classList.remove('hidden');
    dropdown.trigger.setAttribute('aria-expanded', 'true');
    root.classList.add('is-open');
}

function closeDropdown(root) {
    const dropdown = dropdowns.get(root);
    if (!dropdown) {
        return;
    }
    dropdown.menu.hidden = true;
    dropdown.menu.classList.add('hidden');
    dropdown.trigger.setAttribute('aria-expanded', 'false');
    root.classList.remove('is-open');
}

function closeAllDropdowns(exceptRoot) {
    dropdowns.forEach((_dropdown, root) => {
        if (root !== exceptRoot) {
            closeDropdown(root);
        }
    });
}

function selectDropdownValue(root, value, labelText) {
    setDropdownValue(root, value, labelText, true);
    closeDropdown(root);
}

function setDropdownValue(root, value, labelText, dispatchChange) {
    const dropdown = dropdowns.get(root);
    if (!dropdown) {
        return;
    }

    dropdown.input.value = value;
    if (dropdown.label) {
        dropdown.label.textContent = labelText || value;
    }
    dropdown.menu.querySelectorAll('[data-value]').forEach((option) => {
        option.setAttribute('aria-selected', String(option.dataset.value === value));
    });

    if (dropdown.input.id === 'city-filter') {
        updateCityControl(labelText);
    }

    if (dispatchChange) {
        dropdown.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
}

function syncDropdownLabel(input) {
    const root = input?.closest('[data-dropdown]');
    const dropdown = root ? dropdowns.get(root) : null;
    if (!dropdown) {
        return;
    }
    const selected = [...dropdown.menu.querySelectorAll('[data-value]')]
        .find((option) => option.dataset.value === input.value);
    if (selected && dropdown.label) {
        dropdown.label.textContent = selected.textContent.trim();
    }
}

function handleSearchInput() {
    window.clearTimeout(searchTimeout);
    searchTimeout = window.setTimeout(() => {
        state.page = 1;
        renderCompanies();
    }, 140);
}

function handleFilterChange() {
    state.page = 1;
    renderCompanies();
}

function loadProgress() {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return {};
        }
        return normalizeProgress(JSON.parse(raw));
    } catch (error) {
        return {};
    }
}

function normalizeProgress(data) {
    const progress = {};

    if (Array.isArray(data)) {
        data.forEach((id) => addProgressId(progress, id));
        return progress;
    }

    if (data && typeof data === 'object') {
        const hasAppliedList = Array.isArray(data.applied);
        const ids = hasAppliedList ? data.applied : Object.keys(data);
        ids.forEach((id) => {
            if (hasAppliedList || data[id] === true) {
                addProgressId(progress, id);
            }
        });
    }

    return progress;
}

function addProgressId(progress, id) {
    if (typeof id !== 'string' && typeof id !== 'number') {
        return;
    }
    const value = String(id).trim();
    if (value) {
        progress[value] = true;
    }
}

function saveProgress() {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    } catch (error) {
        console.warn('Unable to save application progress.', error);
    }
}

function isApplied(companyId) {
    return state.progress[String(companyId)] === true;
}

function handleStorageChange(event) {
    if (event.key === LANG_KEY) {
        applyLanguage(event.newValue === 'en' ? 'en' : 'ar', false);
        return;
    }
    if (event.key === THEME_KEY) {
        applyTheme(event.newValue === 'dark' ? 'dark' : 'light', false);
        return;
    }
    if (event.key === PALETTE_KEY) {
        applyPalette(event.newValue, false);
        return;
    }
    if (event.key !== STORAGE_KEY) {
        return;
    }
    state.progress = loadProgress();
    renderCompanies();
    updateProgress();
}

function openPrivacyModal() {
    if (!UI.privacyModal) {
        return;
    }
    lastFocusedElement = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    UI.privacyModal.hidden = false;
    UI.privacyModal.setAttribute('aria-hidden', 'false');
    UI.privacyOpen?.setAttribute('aria-expanded', 'true');
    document.body.classList.add('modal-open');
    window.requestAnimationFrame(() => UI.privacyClose?.focus());
}

function closePrivacyModal() {
    if (!UI.privacyModal || UI.privacyModal.hidden) {
        return;
    }
    UI.privacyModal.hidden = true;
    UI.privacyModal.setAttribute('aria-hidden', 'true');
    UI.privacyOpen?.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('modal-open');

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
    lastFocusedElement = null;
}

function handlePrivacyModalClick(event) {
    if (event.target.closest('[data-modal-close]')) {
        closePrivacyModal();
    }
}

function handlePrivacyKeydown(event) {
    if (!UI.privacyModal || UI.privacyModal.hidden) {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closePrivacyModal();
        return;
    }

    if (event.key !== 'Tab') {
        return;
    }

    const focusable = [...UI.privacyModal.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.getClientRects().length > 0);

    if (!focusable.length) {
        return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

async function loadCompanies() {
    state.loaded = false;
    setListMessage('table.loading');

    try {
        const response = await fetch(COMPANIES_URL, {
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error('Unexpected response format');
        }

        state.companies = data;
        state.loaded = true;
        populateSectors();
        populateCities();
        renderCompanies();
        updateProgress();
    } catch (error) {
        console.error('Unable to load companies:', error);
        state.loaded = false;
        setListMessage('table.error');
    }
}

function populateSectors() {
    const root = UI.sectorFilter?.closest('[data-dropdown]');
    const menu = root?.querySelector('[data-dropdown-menu]');
    if (!root || !menu) {
        return;
    }

    const current = UI.sectorFilter.value;
    const sectors = [...new Set(
        state.companies
            .map((company) => String(company.sector || '').trim())
            .filter(Boolean)
    )].sort((a, b) => a.localeCompare(b));

    const values = [
        { value: 'all', label: t('filters.allSectors') },
        ...sectors.map((sector) => ({ value: sector, label: getSectorLabel(sector) })),
    ];
    const selected = values.some((item) => item.value === current) ? current : 'all';

    menu.replaceChildren(
        ...values.map((item) => createDropdownOption(item.value, item.label, item.value === selected))
    );

    const selectedItem = values.find((item) => item.value === selected);
    setDropdownValue(root, selected, selectedItem?.label || t('filters.allSectors'), false);
}

function populateCities() {
    const root = UI.cityFilter?.closest('[data-dropdown]');
    const menu = root?.querySelector('[data-dropdown-menu]');
    if (!root || !menu) {
        return;
    }

    const current = UI.cityFilter.value;
    const available = [...new Set(
        state.companies
            .map((company) => String(company.location || '').trim())
            .filter(Boolean)
    )];
    const extras = available
        .filter((city) => !CITY_ORDER.some((base) => normalizeText(base) === normalizeText(city)))
        .sort((a, b) => a.localeCompare(b));
    const cities = [...CITY_ORDER, ...extras];

    const values = [
        { value: 'all', label: t('filters.allCities') },
        ...cities.map((city) => ({ value: city, label: getCityLabel(city) })),
    ];
    const selected = values.some((item) => item.value === current) ? current : 'all';

    menu.replaceChildren(
        ...values.map((item) => createDropdownOption(item.value, item.label, item.value === selected))
    );

    const selectedItem = values.find((item) => item.value === selected);
    setDropdownValue(root, selected, selectedItem?.label || t('filters.allCities'), false);
}

function createDropdownOption(value, label, selected) {
    const option = document.createElement('button');
    option.type = 'button';
    option.setAttribute('role', 'option');
    option.dataset.value = value;
    option.setAttribute('aria-selected', String(Boolean(selected)));
    option.className = 'dropdown-option';
    option.textContent = label;
    return option;
}

function renderCompanies() {
    if (!state.loaded || !UI.companyList) {
        return;
    }

    state.listMessage = null;
    const filtered = getFilteredCompanies();
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    state.page = Math.min(Math.max(1, state.page), totalPages);

    const startIndex = (state.page - 1) * state.pageSize;
    const visible = filtered.slice(startIndex, startIndex + state.pageSize);

    updateRangeSummary(total, startIndex, visible.length);

    if (!total) {
        setListMessage(
            state.companies.length ? 'table.emptyFiltered' : 'table.empty'
        );
        renderPagination(0);
        return;
    }

    const fragment = document.createDocumentFragment();
    visible.forEach((company, index) => {
        fragment.appendChild(createCompanyRow(company, index));
    });
    UI.companyList.replaceChildren(fragment);
    renderPagination(total);
}

function updateRangeSummary(total, startIndex, visibleCount) {
    if (!UI.rangeSummary) {
        return;
    }
    UI.rangeSummary.textContent = t('pagination.showing', {
        start: total ? startIndex + 1 : 0,
        end: total ? startIndex + visibleCount : 0,
        total,
    });
}

function getFilteredCompanies() {
    const query = normalizeText(UI.searchInput?.value);
    const sector = UI.sectorFilter?.value || 'all';
    const status = UI.statusFilter?.value || 'all';
    const city = UI.cityFilter?.value || 'all';

    return state.companies.filter((company) => {
        const matchesQuery = !query
            || normalizeText(company.name_en).includes(query)
            || normalizeText(company.name_ar).includes(query);
        const matchesSector = sector === 'all' || company.sector === sector;
        const matchesCity = city === 'all'
            || normalizeText(company.location) === normalizeText(city);

        let matchesStatus = true;
        if (status === 'applied') {
            matchesStatus = isApplied(company.id);
        } else if (status === 'not-applied') {
            matchesStatus = !isApplied(company.id);
        }

        return matchesQuery && matchesSector && matchesStatus && matchesCity;
    });
}

function normalizeText(value) {
    return String(value || '')
        .normalize('NFKC')
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .trim()
        .toLocaleLowerCase();
}

function getSectorLabel(sector) {
    if (!sector) {
        return t('table.uncategorized');
    }
    const key = normalizeText(sector);
    return SECTOR_LABELS[state.lang]?.[key] || sector;
}

function getCityLabel(city) {
    if (!city) {
        return t('filters.allCities');
    }
    const key = normalizeText(city);
    return CITY_LABELS[state.lang]?.[key] || city;
}

function updateCityControl(cityLabel) {
    const root = UI.cityFilter?.closest('[data-dropdown]');
    const trigger = root?.querySelector('[data-dropdown-trigger]');
    if (!trigger) {
        return;
    }
    const city = cityLabel || t('filters.allCities');
    const label = t('filters.cityAria', { city });
    trigger.setAttribute('aria-label', label);
    trigger.setAttribute('title', label);
}

function getSectorHue(sector) {
    return SECTOR_HUES[normalizeText(sector)] ?? 174;
}

function createStatusPill(applied) {
    const pill = document.createElement('span');
    pill.className = applied ? 'status-pill is-applied' : 'status-pill';
    pill.textContent = t(applied ? 'status.applied' : 'status.notApplied');
    return pill;
}

function createCompanyRow(company, index) {
    const applied = isApplied(company.id);
    const companyName = company.name_en || company.name_ar || 'this company';
    const row = document.createElement('tr');
    row.className = applied ? 'company-row applied' : 'company-row';
    row.dataset.companyId = company.id;
    row.style.animationDelay = `${Math.min(index, 8) * 20}ms`;

    const statusCell = document.createElement('td');
    statusCell.className = 'px-5 py-3.5';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'inline-flex cursor-pointer items-center justify-center';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'checkbox-input sr-only';
    checkbox.checked = applied;

    const checkboxBox = document.createElement('span');
    checkboxBox.className = 'checkbox-box';
    checkboxBox.innerHTML = '<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>';

    const statusPill = createStatusPill(applied);

    const refreshCheckboxCopy = (isChecked) => {
        const key = isChecked ? 'table.unmarkApplied' : 'table.markApplied';
        const label = t(key, { company: companyName });
        checkbox.setAttribute('aria-label', label);
        checkboxLabel.setAttribute('title', label);
    };
    refreshCheckboxCopy(applied);

    checkbox.addEventListener('change', () => {
        const id = String(company.id);
        const nextApplied = checkbox.checked;

        if (nextApplied) {
            state.progress[id] = true;
        } else {
            delete state.progress[id];
        }

        saveProgress();
        row.classList.toggle('applied', nextApplied);
        statusPill.className = nextApplied ? 'status-pill is-applied' : 'status-pill';
        statusPill.textContent = t(nextApplied ? 'status.applied' : 'status.notApplied');
        refreshCheckboxCopy(nextApplied);
        updateProgress();

        if (UI.statusFilter?.value !== 'all') {
            renderCompanies();
        }
    });

    checkboxLabel.append(checkbox, checkboxBox);
    statusCell.appendChild(checkboxLabel);

    const nameCell = document.createElement('th');
    nameCell.scope = 'row';
    nameCell.className = 'px-5 py-3.5 text-start';

    const nameEn = document.createElement('span');
    nameEn.className = 'company-name block';
    nameEn.textContent = company.name_en || company.name_ar || t('table.uncategorized');
    nameCell.appendChild(nameEn);

    if (company.name_ar && company.name_ar !== company.name_en) {
        const nameAr = document.createElement('span');
        nameAr.className = 'company-name-ar mt-0.5 block text-xs font-normal';
        nameAr.lang = 'ar';
        nameAr.dir = 'auto';
        nameAr.textContent = company.name_ar;
        nameCell.appendChild(nameAr);
    }

    const stateCell = document.createElement('td');
    stateCell.className = 'px-5 py-3.5';
    stateCell.appendChild(statusPill);

    const sectorCell = document.createElement('td');
    sectorCell.className = 'px-5 py-3.5';

    const sector = document.createElement('span');
    sector.className = 'sector-badge';
    sector.style.setProperty('--badge-hue', String(getSectorHue(company.sector)));
    sector.textContent = getSectorLabel(company.sector);
    if (company.sector) {
        sector.title = company.sector;
    }
    sectorCell.appendChild(sector);

    const locationCell = document.createElement('td');
    locationCell.className = 'row-location whitespace-nowrap px-5 py-3.5';
    locationCell.textContent = company.location || '—';

    const linksCell = document.createElement('td');
    linksCell.className = 'px-5 py-3.5';

    const links = document.createElement('div');
    links.className = 'flex items-center justify-end gap-2';

    const careerUrl = safeUrl(company.career_url);
    if (careerUrl) {
        links.appendChild(createCompanyLink('table.careers', careerUrl, companyName, true));
    }

    const linkedinUrl = safeUrl(company.linkedin_url);
    if (linkedinUrl) {
        links.appendChild(createCompanyLink('table.linkedin', linkedinUrl, companyName, false));
    }

    if (!links.children.length) {
        const noLinks = document.createElement('span');
        noLinks.className = 'text-xs font-medium text-muted';
        noLinks.textContent = t('table.noLinks');
        links.appendChild(noLinks);
    }

    linksCell.appendChild(links);
    row.append(statusCell, nameCell, stateCell, sectorCell, locationCell, linksCell);

    return row;
}

function createCompanyLink(labelKey, url, companyName, primary) {
    const label = t(labelKey);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = primary ? 'action-link action-link-primary' : 'action-link';
    link.innerHTML = `<span class="action-label"></span><svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H18m0 0v4.5M18 6l-7.5 7.5M6 8.25v9A.75.75 0 0 0 6.75 18h9" /></svg>`;
    link.querySelector('.action-label').textContent = label;
    link.setAttribute('aria-label', t('table.linkAria', { label, company: companyName || 'this company' }));
    return link;
}

function safeUrl(value) {
    if (!value) {
        return null;
    }
    try {
        const url = new URL(String(value), window.location.origin);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch (error) {
        return null;
    }
}

function renderPagination(total) {
    if (!UI.pagination) {
        return;
    }

    UI.pagination.replaceChildren();
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));

    if (total <= state.pageSize) {
        UI.pagination.hidden = true;
        return;
    }

    UI.pagination.hidden = false;

    const previous = createPageButton(t('pagination.previous'), state.page - 1, state.page === 1, t('pagination.previous'));
    UI.pagination.appendChild(previous);

    buildPageItems(totalPages, state.page).forEach((item) => {
        if (item === 'ellipsis') {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.setAttribute('aria-hidden', 'true');
            ellipsis.textContent = '…';
            UI.pagination.appendChild(ellipsis);
            return;
        }

        const button = createPageButton(
            String(item),
            item,
            false,
            t('pagination.page', { page: item })
        );
        if (item === state.page) {
            button.setAttribute('aria-current', 'page');
        }
        UI.pagination.appendChild(button);
    });

    UI.pagination.appendChild(
        createPageButton(t('pagination.next'), state.page + 1, state.page === totalPages, t('pagination.next'))
    );
}

function buildPageItems(totalPages, currentPage) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_value, index) => index + 1);
    }

    const items = [1];
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
        start = 2;
        end = 4;
    }
    if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
    }

    if (start > 2) {
        items.push('ellipsis');
    }
    for (let page = start; page <= end; page += 1) {
        items.push(page);
    }
    if (end < totalPages - 1) {
        items.push('ellipsis');
    }
    items.push(totalPages);

    return items;
}

function createPageButton(label, page, disabled, ariaLabel) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pagination-btn';
    button.textContent = label;
    button.dataset.page = String(page);

    if (ariaLabel) {
        button.setAttribute('aria-label', ariaLabel);
    }
    if (disabled) {
        button.disabled = true;
    } else {
        button.addEventListener('click', () => goToPage(page));
    }

    return button;
}

function goToPage(page) {
    const totalPages = Math.max(1, Math.ceil(getFilteredCompanies().length / state.pageSize));
    if (page < 1 || page > totalPages) {
        return;
    }
    state.page = page;
    renderCompanies();
}

function setListMessage(key) {
    state.listMessage = key;
    paintListMessage();
}

function paintListMessage() {
    if (!state.listMessage || !UI.companyList) {
        return;
    }

    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'px-5 py-12 text-center text-sm text-muted';
    cell.setAttribute('role', 'status');

    const text = document.createElement('p');
    text.textContent = t(state.listMessage);
    cell.appendChild(text);

    if (state.listMessage === 'table.error') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-secondary mt-3 inline-flex items-center justify-center rounded-lg px-3.5 py-1.5 text-xs font-bold';
        button.textContent = t('table.retry');
        button.addEventListener('click', loadCompanies);
        cell.appendChild(button);
    }

    row.appendChild(cell);
    UI.companyList.replaceChildren(row);
}

function updateProgress() {
    if (!UI.companyList) {
        return;
    }

    const total = state.companies.length;
    const applied = state.companies.reduce(
        (count, company) => count + (isApplied(company.id) ? 1 : 0),
        0
    );

    if (UI.appliedCount) {
        UI.appliedCount.textContent = String(applied);
    }
    if (UI.totalCount) {
        UI.totalCount.textContent = String(total);
    }
    if (UI.progressBar) {
        const percentage = total ? Math.round((applied / total) * 100) : 0;
        UI.progressBar.style.width = `${percentage}%`;

        const track = UI.progressBar.parentElement;
        if (track) {
            track.setAttribute('aria-valuenow', String(percentage));
            track.setAttribute('aria-valuetext', t('progress.aria', { applied, total }));
        }
    }
}

async function submitSuggestion(event) {
    event.preventDefault();

    if (!UI.suggestionForm.checkValidity()) {
        UI.suggestionForm.reportValidity();
        return;
    }

    const nameEn = UI.suggestNameEn?.value.trim() || '';
    const nameAr = UI.suggestNameAr?.value.trim() || '';
    const rawCareerUrl = UI.suggestCareerUrl?.value.trim() || '';
    const rawLinkedinUrl = UI.suggestLinkedinUrl?.value.trim() || '';
    const sector = UI.suggestSector?.value.trim() || '';
    const location = UI.suggestLocation?.value.trim() || '';
    const notes = UI.suggestNotes?.value.trim() || '';
    const careerUrl = safeUrl(rawCareerUrl);
    const linkedinUrl = rawLinkedinUrl ? safeUrl(rawLinkedinUrl) : null;

    if (!nameEn || !careerUrl || !sector || !location || (rawLinkedinUrl && !linkedinUrl)) {
        setSuggestionFeedback('form.invalid', 'error');
        return;
    }

    const submitButton = UI.suggestionForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton ? submitButton.innerHTML : '';

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = t('form.submitting');
    }
    setSuggestionFeedback(null, 'neutral');

    try {
        const response = await fetch(SUGGEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                company_name: nameEn,
                career_url: careerUrl,
                sector,
                notes: notes || null,
                name_en: nameEn,
                name_ar: nameAr || null,
                linkedin_url: linkedinUrl,
                location,
            }),
        });

        if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
        }

        UI.suggestionForm.reset();
        setSuggestionFeedback('form.success', 'success');
    } catch (error) {
        console.error('Unable to submit suggestion:', error);
        setSuggestionFeedback('form.error', 'error');
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = originalLabel;
        }
    }
}

function setSuggestionFeedback(key, tone) {
    state.feedback = key ? { key, tone } : null;
    paintSuggestionFeedback();
}

function paintSuggestionFeedback() {
    if (!UI.suggestionFeedback) {
        return;
    }

    if (!state.feedback) {
        UI.suggestionFeedback.hidden = true;
        UI.suggestionFeedback.textContent = '';
        return;
    }

    UI.suggestionFeedback.hidden = false;
    UI.suggestionFeedback.textContent = t(state.feedback.key);
    UI.suggestionFeedback.className = `text-sm font-semibold feedback-${state.feedback.tone}`;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
