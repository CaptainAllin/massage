import { COUNTRIES } from './format';

export interface StateOption {
  code: string;
  name: string;
}

export interface CountryFormat {
  phonePrefix: string;
  phonePlaceholder: string;
  postcodeLabel: string;
  postcodePlaceholder: string;
  postcodePattern: RegExp;
  stateLabel: string;
  states: StateOption[];
}

const AU_STATES: StateOption[] = [
  { code: 'NSW', name: 'New South Wales' },
  { code: 'VIC', name: 'Victoria' },
  { code: 'QLD', name: 'Queensland' },
  { code: 'WA', name: 'Western Australia' },
  { code: 'SA', name: 'South Australia' },
  { code: 'TAS', name: 'Tasmania' },
  { code: 'ACT', name: 'Australian Capital Territory' },
  { code: 'NT', name: 'Northern Territory' },
];

const US_STATES: StateOption[] = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' }, { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

const CA_PROVINCES: StateOption[] = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

const NZ_REGIONS: StateOption[] = [
  { code: 'AUK', name: 'Auckland' },
  { code: 'BOP', name: 'Bay of Plenty' },
  { code: 'CAN', name: 'Canterbury' },
  { code: 'GIS', name: 'Gisborne' },
  { code: 'HKB', name: "Hawke's Bay" },
  { code: 'MWT', name: 'Manawatū-Whanganui' },
  { code: 'MBH', name: 'Marlborough' },
  { code: 'NSN', name: 'Nelson' },
  { code: 'NTL', name: 'Northland' },
  { code: 'OTA', name: 'Otago' },
  { code: 'STL', name: 'Southland' },
  { code: 'TAS', name: 'Tasman' },
  { code: 'TKI', name: 'Taranaki' },
  { code: 'WKO', name: 'Waikato' },
  { code: 'WGN', name: 'Wellington' },
  { code: 'WTC', name: 'West Coast' },
];

const UK_REGIONS: StateOption[] = [
  { code: 'ENG', name: 'England' },
  { code: 'SCT', name: 'Scotland' },
  { code: 'WLS', name: 'Wales' },
  { code: 'NIR', name: 'Northern Ireland' },
];

export const COUNTRY_FORMATS: Record<string, CountryFormat> = {
  AU: {
    phonePrefix: '',
    phonePlaceholder: '03 9876 2345',
    postcodeLabel: 'Postcode',
    postcodePlaceholder: '3000',
    postcodePattern: /^\d{4}$/,
    stateLabel: 'State',
    states: AU_STATES,
  },
  US: {
    phonePrefix: '+1',
    phonePlaceholder: '(XXX) XXX-XXXX',
    postcodeLabel: 'ZIP Code',
    postcodePlaceholder: '94102',
    postcodePattern: /^\d{5}(-\d{4})?$/,
    stateLabel: 'State',
    states: US_STATES,
  },
  CA: {
    phonePrefix: '+1',
    phonePlaceholder: '(XXX) XXX-XXXX',
    postcodeLabel: 'Postal Code',
    postcodePlaceholder: 'A1A 1A1',
    postcodePattern: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
    stateLabel: 'Province',
    states: CA_PROVINCES,
  },
  GB: {
    phonePrefix: '+44',
    phonePlaceholder: 'XXXX XXX XXXX',
    postcodeLabel: 'Postcode',
    postcodePlaceholder: 'SW1A 1AA',
    postcodePattern: /^[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$/i,
    stateLabel: 'County',
    states: UK_REGIONS,
  },
  NZ: {
    phonePrefix: '+64',
    phonePlaceholder: '0XX XXX XXXX',
    postcodeLabel: 'Postcode',
    postcodePlaceholder: '1010',
    postcodePattern: /^\d{4}$/,
    stateLabel: 'Region',
    states: NZ_REGIONS,
  },
};

export function getCountryFormat(countryCode: string): CountryFormat {
  if (countryCode && COUNTRY_FORMATS[countryCode]) {
    return COUNTRY_FORMATS[countryCode];
  }
  const country = COUNTRIES.find((c) => c.code === countryCode);
  return {
    phonePrefix: country?.phonePrefix || '',
    phonePlaceholder: 'Phone number',
    postcodeLabel: 'Postcode / ZIP',
    postcodePlaceholder: '',
    postcodePattern: /.*/,
    stateLabel: 'State / Province',
    states: [],
  };
}

export function formatPhoneDisplay(phone: string, countryCode = 'AU'): string {
  if (!phone) return phone;
  const digits = phone.replace(/\D/g, '');
  return formatPhoneDigits(digits, countryCode);
}

export function formatPhoneDigits(digits: string, countryCode: string): string {
  const d = digits.replace(/\D/g, '');
  switch (countryCode) {
    case 'AU': {
      // Mobile (04xx): 04XX XXX XXX | Landline (0x): 0X XXXX XXXX
      if (d.startsWith('04')) {
        if (d.length <= 4) return d;
        if (d.length <= 7) return `${d.slice(0, 4)} ${d.slice(4)}`;
        return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 10)}`;
      }
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
    }
    case 'US':
    case 'CA': {
      // (XXX) XXX-XXXX
      if (d.length <= 3) return d;
      if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
      return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6, 10)}`;
    }
    case 'NZ': {
      // XX XXXX XXXX
      if (d.length <= 2) return d;
      if (d.length <= 6) return `${d.slice(0, 2)} ${d.slice(2)}`;
      return `${d.slice(0, 2)} ${d.slice(2, 6)} ${d.slice(6, 10)}`;
    }
    case 'GB': {
      // XXXXX XXXXXX
      if (d.length <= 5) return d;
      return `${d.slice(0, 5)} ${d.slice(5, 11)}`;
    }
    default:
      return digits;
  }
}
