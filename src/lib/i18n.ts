import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

// Helper to get API URL
const getApiUrl = () => {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: 'en', // default language
    fallbackLng: 'en',
    supportedLngs: ['en', 'ne', 'es'], // Initial list, can be dynamic later or kept static for fallback
    
    // Backend configuration
    backend: {
      loadPath: `${getApiUrl()}/translations/resources`, // Endpoint we created
      parse: (data: string) => {
        try {
            return JSON.parse(data);
        } catch (error) {
            console.error('Failed to parse translation data', error);
            return {};
        }
      },
      // We can also use custom request function if needed for auth headers
      request: async (_options: unknown, url: string, _payload: unknown, callback: (error: Error | null, response: { status: number; data: string }) => void) => {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch translations');
            const data = await res.text();
            callback(null, { status: 200, data });
        } catch (e: unknown) {
            callback(e as Error, { status: 500, data: '' });
        }
      }
    },

    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    
    react: {
        useSuspense: true, // Use suspense for loading
    }
  });

export default i18n;
