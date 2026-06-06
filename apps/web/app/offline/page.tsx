export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F4F3F8',
        padding: '32px 24px',
        textAlign: 'center',
        fontFamily: 'Sora, system-ui, sans-serif',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #5D4AA8 0%, #3F2F87 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          boxShadow: '0 12px 32px rgba(63,47,135,0.32)',
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path
            d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <h1
        style={{
          fontSize: 26,
          fontWeight: 700,
          color: '#1C1430',
          marginBottom: 10,
          letterSpacing: -0.5,
        }}
      >
        You&rsquo;re offline
      </h1>

      <p
        style={{
          fontSize: 15,
          color: '#7A7090',
          lineHeight: 1.6,
          maxWidth: 280,
          marginBottom: 32,
        }}
      >
        No internet connection. Iris will reload automatically when you&rsquo;re back online.
      </p>

      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '13px 28px',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #5D4AA8 0%, #3F2F87 100%)',
          border: 'none',
          fontSize: 15,
          fontWeight: 600,
          color: '#fff',
          cursor: 'pointer',
          fontFamily: 'Sora, system-ui, sans-serif',
          boxShadow: '0 6px 18px rgba(63,47,135,0.35)',
        }}
      >
        Try again
      </button>
    </div>
  );
}
