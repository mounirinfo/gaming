import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './translations/en';
import { fr } from './translations/fr';
import { ar } from './translations/ar';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // IMPORTANT: Prevents loading issues
    },
  });

export default i18n;