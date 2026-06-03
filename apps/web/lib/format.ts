export interface CountryOption {
  code: string;
  name: string;
  currency: string;
  locale: string;
  phonePrefix: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'AU', name: 'Australia', currency: 'AUD', locale: 'en-AU', phonePrefix: '+61' },
  { code: 'US', name: 'United States', currency: 'USD', locale: 'en-US', phonePrefix: '+1' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', locale: 'en-GB', phonePrefix: '+44' },
  { code: 'CA', name: 'Canada', currency: 'CAD', locale: 'en-CA', phonePrefix: '+1' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', locale: 'en-NZ', phonePrefix: '+64' },
  { code: 'AT', name: 'Austria', currency: 'EUR', locale: 'de-AT', phonePrefix: '+43' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', locale: 'fr-BE', phonePrefix: '+32' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', locale: 'pt-BR', phonePrefix: '+55' },
  { code: 'CN', name: 'China', currency: 'CNY', locale: 'zh-CN', phonePrefix: '+86' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', locale: 'cs-CZ', phonePrefix: '+420' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', locale: 'da-DK', phonePrefix: '+45' },
  { code: 'FI', name: 'Finland', currency: 'EUR', locale: 'fi-FI', phonePrefix: '+358' },
  { code: 'FR', name: 'France', currency: 'EUR', locale: 'fr-FR', phonePrefix: '+33' },
  { code: 'DE', name: 'Germany', currency: 'EUR', locale: 'de-DE', phonePrefix: '+49' },
  { code: 'GR', name: 'Greece', currency: 'EUR', locale: 'el-GR', phonePrefix: '+30' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', locale: 'zh-HK', phonePrefix: '+852' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', locale: 'hu-HU', phonePrefix: '+36' },
  { code: 'IN', name: 'India', currency: 'INR', locale: 'en-IN', phonePrefix: '+91' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', locale: 'id-ID', phonePrefix: '+62' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', locale: 'en-IE', phonePrefix: '+353' },
  { code: 'IL', name: 'Israel', currency: 'ILS', locale: 'he-IL', phonePrefix: '+972' },
  { code: 'IT', name: 'Italy', currency: 'EUR', locale: 'it-IT', phonePrefix: '+39' },
  { code: 'JP', name: 'Japan', currency: 'JPY', locale: 'ja-JP', phonePrefix: '+81' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', locale: 'ko-KR', phonePrefix: '+82' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', locale: 'ms-MY', phonePrefix: '+60' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', locale: 'es-MX', phonePrefix: '+52' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', locale: 'nl-NL', phonePrefix: '+31' },
  { code: 'NO', name: 'Norway', currency: 'NOK', locale: 'nb-NO', phonePrefix: '+47' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', locale: 'en-PH', phonePrefix: '+63' },
  { code: 'PL', name: 'Poland', currency: 'PLN', locale: 'pl-PL', phonePrefix: '+48' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', locale: 'pt-PT', phonePrefix: '+351' },
  { code: 'RO', name: 'Romania', currency: 'RON', locale: 'ro-RO', phonePrefix: '+40' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', locale: 'ar-SA', phonePrefix: '+966' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', locale: 'en-SG', phonePrefix: '+65' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', locale: 'en-ZA', phonePrefix: '+27' },
  { code: 'ES', name: 'Spain', currency: 'EUR', locale: 'es-ES', phonePrefix: '+34' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', locale: 'sv-SE', phonePrefix: '+46' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', locale: 'de-CH', phonePrefix: '+41' },
  { code: 'TW', name: 'Taiwan', currency: 'TWD', locale: 'zh-TW', phonePrefix: '+886' },
  { code: 'TH', name: 'Thailand', currency: 'THB', locale: 'th-TH', phonePrefix: '+66' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', locale: 'ar-AE', phonePrefix: '+971' },
  { code: 'PK', name: 'Pakistan', currency: 'PKR', locale: 'ur-PK', phonePrefix: '+92' },
];

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'TWD', name: 'New Taiwan Dollar', symbol: 'NT$' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
];

const CURRENCY_LOCALE: Record<string, string> = Object.fromEntries(
  COUNTRIES.map((c) => [c.currency, c.locale])
);

export function getCurrencyLocale(currency: string): string {
  return CURRENCY_LOCALE[currency] || 'en-US';
}

export function getCountryByCurrency(currencyCode: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.currency === currencyCode);
}

export function getCountryByCode(countryCode: string): CountryOption | undefined {
  return COUNTRIES.find((c) => c.code === countryCode);
}

export function formatCurrency(
  amount: number,
  currency = 'AUD',
  opts?: { maximumFractionDigits?: number; minimumFractionDigits?: number }
): string {
  const locale = getCurrencyLocale(currency);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: opts?.minimumFractionDigits ?? 0,
    maximumFractionDigits: opts?.maximumFractionDigits ?? 2,
  }).format(amount);
}
