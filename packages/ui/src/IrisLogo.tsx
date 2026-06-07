export type IrisLogoProps = {
  /** Pixel size of the square mark. Defaults to 36 (sidebar size). */
  size?: number;
  /** Wordmark style rendered next to the mark. Defaults to 'none' (mark only). */
  wordmark?: 'none' | 'inline' | 'stacked' | 'short';
  /** Extra classes for the wrapper element. */
  className?: string;
};

const GRADIENT = 'linear-gradient(135deg, #5D4AA8, #3F2F87)';
const SORA = 'Sora, system-ui, sans-serif';

/**
 * Iris (Care Suite) product mark + optional wordmark.
 * Single source of truth for the Iris logo — do not inline this SVG elsewhere.
 * For the tenant business logo, use <BusinessLogo> instead.
 */
export function IrisLogo({ size = 36, wordmark = 'none', className }: IrisLogoProps) {
  const markSize = Math.round(size * 0.5);
  const radius = Math.round(size * 0.33);

  return (
    <div className={`flex items-center gap-3 ${className ?? ''}`}>
      <div
        className="flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size, borderRadius: radius, background: GRADIENT }}
      >
        <svg width={markSize} height={markSize} viewBox="0 0 18 18" fill="none">
          <path
            d="M9 2C9 2 5 5.5 5 9.5C5 11.985 6.791 14 9 14C11.209 14 13 11.985 13 9.5C13 5.5 9 2 9 2Z"
            fill="white"
            opacity="0.9"
          />
          <path d="M9 14V16M6 15.5H12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {wordmark === 'inline' && (
        <span style={{ fontFamily: SORA, fontSize: '15px', fontWeight: 600, color: '#1E1830', letterSpacing: '-0.3px' }}>
          Iris Care Suite
        </span>
      )}

      {wordmark === 'short' && (
        <span style={{ fontFamily: SORA, fontSize: '15px', fontWeight: 600, color: '#1E1830', letterSpacing: '-0.3px' }}>
          Iris
        </span>
      )}

      {wordmark === 'stacked' && (
        <div className="flex flex-col leading-none">
          <span style={{ fontFamily: SORA, fontSize: '15px', fontWeight: 600, color: '#1E1830', letterSpacing: '-0.3px' }}>
            Iris
          </span>
          <span style={{ fontFamily: SORA, fontSize: '10px', fontWeight: 400, color: '#7A7090', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '1px' }}>
            Care Suite
          </span>
        </div>
      )}
    </div>
  );
}
