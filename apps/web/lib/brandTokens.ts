import type React from 'react';

export interface BrandTokens {
  primary: string;
  secondary: string;
  primaryLight: string;
  primaryDark: string;
  onPrimary: string;
}

const IRIS_PRIMARY = '#5D4AA8';

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/.{2}/g);
  if (!m || m.length < 3) return null;
  return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) =>
        Math.round(Math.max(0, Math.min(255, v)))
          .toString(16)
          .padStart(2, '0')
      )
      .join('')
  );
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb[0] + (255 - rgb[0]) * amount,
    rgb[1] + (255 - rgb[1]) * amount,
    rgb[2] + (255 - rgb[2]) * amount
  );
}

function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(
    rgb[0] * (1 - amount),
    rgb[1] * (1 - amount),
    rgb[2] * (1 - amount)
  );
}

function isValidHex(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export function deriveBrandTokens(
  primaryColor: string | null,
  secondaryColor: string | null
): BrandTokens {
  const primary =
    primaryColor && isValidHex(primaryColor) ? primaryColor : IRIS_PRIMARY;

  const primaryDark = darken(primary, 0.25);
  const primaryLight = lighten(primary, 0.75);
  const secondary =
    secondaryColor && isValidHex(secondaryColor)
      ? secondaryColor
      : lighten(primary, 0.88);

  const rgb = hexToRgb(primary)!;
  const lum = relativeLuminance(...rgb);
  // Pick whichever foreground (white vs dark) gives higher contrast ratio
  const darkTextLum = relativeLuminance(28, 20, 48); // #1C1430
  const contrastWithWhite = 1.05 / (lum + 0.05);
  const contrastWithDark = (lum + 0.05) / (darkTextLum + 0.05);
  const onPrimary = contrastWithWhite >= contrastWithDark ? '#FFFFFF' : '#1C1430';

  return { primary, secondary, primaryLight, primaryDark, onPrimary };
}

export function brandTokensToCssVars(tokens: BrandTokens): React.CSSProperties {
  return {
    '--brand-primary': tokens.primary,
    '--brand-secondary': tokens.secondary,
    '--brand-primary-light': tokens.primaryLight,
    '--brand-primary-dark': tokens.primaryDark,
    '--brand-on-primary': tokens.onPrimary,
  } as React.CSSProperties;
}
