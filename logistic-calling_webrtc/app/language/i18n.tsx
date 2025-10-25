import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en, hr,es, de, pt, ar, zh, hi, fr, ru } from './translations';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_LANGUAGE_KEY = 'settings.lang';

const languageDetectorPlugin = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async function (callback: (lang: string) => void) {
    try {
      // get stored language from Async storage
      // put your own language detection logic here
      await AsyncStorage.getItem(STORE_LANGUAGE_KEY).then(language => {
        if (language) {
          //if language was stored before, use this language in the app
          return callback(language);
        } else {
          //if language was not stored yet, use english
          return callback('en');
        }
      });
    } catch (error) {
      console.log('Error reading language', error);
    }
  },
  cacheUserLanguage: async function (language: string) {
    try {
      //save a user's language choice in Async storage
      await AsyncStorage.setItem(STORE_LANGUAGE_KEY, language);
    } catch (error) {}
  },
};
const resources = {
  en: {
    translation: en,
  },
  hr: {
    translation: hr,
  },
  es: {
    translation: es,
  },
  de: {
    translation: de,
  },
  pt: {
    translation: pt,
  },
  ar: {
    translation: ar,
  },
  zh: {
    translation: zh,
  },
  hi: {
    translation: hi,
  },
  fr: {
    translation: fr,
  },
  ru: {
    translation: ru,
  },
};

i18n
.use(languageDetectorPlugin) // ✅ Added

.use(initReactI18next).init(
  {
    resources,
    compatibilityJSON: 'v4',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  },
  () => {},
);

export { languageDetectorPlugin };

export default i18n;
