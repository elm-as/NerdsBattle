// Pays supportés avec emoji flags
export const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' }
]

export const getCountry = (code) => COUNTRIES.find((c) => c.code === code)
export const getFlag = (code) => getCountry(code)?.flag || '🏳️'
