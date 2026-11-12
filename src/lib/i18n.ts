import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appName: 'Boy Child Association',
      tagline: 'Every boy deserves a circle that has his back',
      safeguarding: 'Child Safeguarding & Protection',
      hotline: 'Sauti Child Helpline: Toll-free 116',
      pillars: {
        support: 'Support',
        unite: 'Unite',
        guide: 'Guide',
        empower: 'Empower'
      },
      roles: {
        boy: 'Boy Member',
        guardian: 'Parent or Guardian',
        mentor: 'Mentor Volunteer',
        partner: 'School or Partner',
        coordinator: 'Safeguarding Coordinator',
        admin: 'Administrator'
      }
    }
  },
  lg: {
    // Luganda language file structure ready for localisation
    translation: {
      appName: 'Ekibiina Ky’Omwana Omulenzi',
      tagline: 'Buli mwana omulenzi agwana okuba n’ekibiina ekimuwanirira',
      safeguarding: 'Okukuuma n’Okulinda Abaana',
      hotline: 'Essimu ya Sauti ey’abaana: 116 ey’obwereere',
      pillars: {
        support: 'Yamba (Support)',
        unite: 'Gatta (Unite)',
        guide: 'Luhŋamya (Guide)',
        empower: 'Zzaamu Amaanyi (Empower)'
      },
      roles: {
        boy: 'Omwana Omulenzi',
        guardian: 'Omuzadde oba Omukuza',
        mentor: 'Omuwabuzi',
        partner: 'Essomero oba Omukwano gwa Pulogulaamu',
        coordinator: 'Omukungu Akwasaganya',
        admin: 'Omukulu w’emirimu'
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
