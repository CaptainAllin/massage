import { getCountryFormat, formatPhoneDigits, COUNTRY_FORMATS } from '@/lib/countryFormats';

describe('getCountryFormat', () => {
  it('returns AU format for AU country code', () => {
    const fmt = getCountryFormat('AU');
    expect(fmt.phonePrefix).toBe('+61');
    expect(fmt.phonePlaceholder).toBe('04XX XXX XXX');
    expect(fmt.postcodeLabel).toBe('Postcode');
    expect(fmt.stateLabel).toBe('State');
    expect(fmt.states.length).toBeGreaterThan(0);
  });

  it('returns US format for US country code', () => {
    const fmt = getCountryFormat('US');
    expect(fmt.phonePrefix).toBe('+1');
    expect(fmt.phonePlaceholder).toBe('(XXX) XXX-XXXX');
    expect(fmt.postcodeLabel).toBe('ZIP Code');
    expect(fmt.stateLabel).toBe('State');
    expect(fmt.states.length).toBe(51); // 50 states + DC
  });

  it('returns CA format for CA country code', () => {
    const fmt = getCountryFormat('CA');
    expect(fmt.phonePrefix).toBe('+1');
    expect(fmt.postcodePlaceholder).toBe('A1A 1A1');
    expect(fmt.postcodeLabel).toBe('Postal Code');
    expect(fmt.stateLabel).toBe('Province');
    expect(fmt.states.find((s) => s.code === 'ON')).toBeDefined();
  });

  it('returns GB format for GB country code', () => {
    const fmt = getCountryFormat('GB');
    expect(fmt.phonePrefix).toBe('+44');
    expect(fmt.postcodeLabel).toBe('Postcode');
    expect(fmt.stateLabel).toBe('County');
  });

  it('returns NZ format for NZ country code', () => {
    const fmt = getCountryFormat('NZ');
    expect(fmt.phonePrefix).toBe('+64');
    expect(fmt.stateLabel).toBe('Region');
  });

  it('falls back to COUNTRIES data for unknown country codes with a known phone prefix', () => {
    const fmt = getCountryFormat('FR'); // France, not in COUNTRY_FORMATS
    expect(fmt.phonePrefix).toBe('+33');
    expect(fmt.stateLabel).toBe('State / Province');
    expect(fmt.states).toHaveLength(0);
  });

  it('returns default format for empty country code', () => {
    const fmt = getCountryFormat('');
    expect(fmt.stateLabel).toBe('State / Province');
    expect(fmt.phonePrefix).toBe('');
  });
});

describe('AU state list', () => {
  it('includes all 8 Australian states and territories', () => {
    const { states } = getCountryFormat('AU');
    const codes = states.map((s) => s.code);
    expect(codes).toContain('NSW');
    expect(codes).toContain('VIC');
    expect(codes).toContain('QLD');
    expect(codes).toContain('WA');
    expect(codes).toContain('SA');
    expect(codes).toContain('TAS');
    expect(codes).toContain('ACT');
    expect(codes).toContain('NT');
  });
});

describe('CA province list', () => {
  it('includes all 13 Canadian provinces and territories', () => {
    const { states } = getCountryFormat('CA');
    expect(states).toHaveLength(13);
    const codes = states.map((s) => s.code);
    expect(codes).toContain('ON');
    expect(codes).toContain('QC');
    expect(codes).toContain('BC');
  });
});

describe('postcodePattern validation', () => {
  it('AU pattern accepts 4-digit postcodes', () => {
    const { postcodePattern } = getCountryFormat('AU');
    expect(postcodePattern.test('3000')).toBe(true);
    expect(postcodePattern.test('0200')).toBe(true);
    expect(postcodePattern.test('999')).toBe(false);
    expect(postcodePattern.test('12345')).toBe(false);
  });

  it('US pattern accepts 5-digit ZIP codes', () => {
    const { postcodePattern } = getCountryFormat('US');
    expect(postcodePattern.test('94102')).toBe(true);
    expect(postcodePattern.test('94102-1234')).toBe(true);
    expect(postcodePattern.test('941')).toBe(false);
  });

  it('CA pattern accepts letter-digit postal codes', () => {
    const { postcodePattern } = getCountryFormat('CA');
    expect(postcodePattern.test('A1A 1A1')).toBe(true);
    expect(postcodePattern.test('M5V1J1')).toBe(true);
    expect(postcodePattern.test('12345')).toBe(false);
  });
});

describe('formatPhoneDigits', () => {
  it('formats AU numbers as XXXX XXX XXX', () => {
    expect(formatPhoneDigits('0412345678', 'AU')).toBe('0412 345 678');
    expect(formatPhoneDigits('0412', 'AU')).toBe('0412');
    expect(formatPhoneDigits('041234', 'AU')).toBe('0412 34');
  });

  it('formats US/CA numbers as (XXX) XXX-XXXX', () => {
    expect(formatPhoneDigits('5551234567', 'US')).toBe('(555) 123-4567');
    expect(formatPhoneDigits('555', 'US')).toBe('555');
    expect(formatPhoneDigits('5551', 'CA')).toBe('(555) 1');
  });

  it('leaves other countries unformatted', () => {
    expect(formatPhoneDigits('33123456789', 'FR')).toBe('33123456789');
  });
});
