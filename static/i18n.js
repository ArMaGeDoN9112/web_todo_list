// i18n configuration
const i18next = window.i18next;

// Load translations
async function loadTranslations() {
  const languages = ['en', 'es', 'fr', 'de', 'ru'];
  const resources = {};

  for (const lang of languages) {
    try {
      const response = await fetch(`/static/locales/${lang}/translation.json`);
      if (!response.ok) {
        console.warn(`Failed to load ${lang} translations: ${response.status} ${response.statusText}`);
        continue;
      }
      const translation = await response.json();
      resources[lang] = { translation };
    } catch (error) {
      console.warn(`Failed to load ${lang} translations:`, error);
    }
  }

  // Ensure we have at least English translations
  if (!resources['en']) {
    console.error('Failed to load English translations, which are required');
    throw new Error('Required translations not available');
  }

  return resources;
}

// Initialize i18next
async function initializeI18n() {
  try {
    console.log('i18n: Starting initialization');
    const resources = await loadTranslations();
    console.log('i18n: Translations loaded');
    
    await i18next.init({
      resources,
      lng: localStorage.getItem('language') || 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false
      }
    });
    console.log('i18n: i18next initialized');

    // Language switcher component
    function createLanguageSwitcher() {
      console.log('i18n: Creating language switcher');
      const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' },
        { code: 'de', name: 'Deutsch' },
        { code: 'ru', name: 'Русский' }
      ];

      const container = document.createElement('div');
      container.className = 'language-switcher';

      const select = document.createElement('select');
      select.className = 'language-select';
      select.onchange = (e) => {
        const newLang = e.target.value;
        localStorage.setItem('language', newLang);
        i18next.changeLanguage(newLang);
        updateContent();
      };

      languages.forEach(lang => {
        const option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.name;
        if (lang.code === i18next.language) {
          option.selected = true;
        }
        select.appendChild(option);
      });

      container.appendChild(select);
      console.log('i18n: Language switcher created');
      return container;
    }

    // Update all translatable content
    function updateContent() {
      console.log('i18n: Updating content');
      document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        element.textContent = i18next.t(key);
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        element.placeholder = i18next.t(key);
      });
    }

    // Initialize language switcher and content
    const navActions = document.querySelector('.nav-actions');
    console.log('i18n: Found nav-actions element:', !!navActions);
    if (navActions) {
      const languageSwitcher = createLanguageSwitcher();
      navActions.insertBefore(languageSwitcher, navActions.firstChild);
      console.log('i18n: Language switcher inserted into nav-actions');
    } else {
      console.error('i18n: nav-actions element not found');
    }
    updateContent();

    // Export functions for use in other files
    window.i18n = {
      t: (key) => i18next.t(key),
      updateContent
    };
  } catch (error) {
    console.error('i18n: Failed to initialize:', error);
    // Provide a fallback i18n object that returns the key
    window.i18n = {
      t: (key) => key,
      updateContent: () => {}
    };
  }
}

// Start initialization
document.addEventListener('DOMContentLoaded', () => {
  initializeI18n();
}); 