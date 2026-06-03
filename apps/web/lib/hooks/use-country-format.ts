import { useBusiness } from './use-business';
import { getCountryFormat, CountryFormat } from '../countryFormats';

export function useCountryFormat(businessId: string | undefined): CountryFormat {
  const { data: business } = useBusiness(businessId);
  return getCountryFormat(business?.country || 'AU');
}
