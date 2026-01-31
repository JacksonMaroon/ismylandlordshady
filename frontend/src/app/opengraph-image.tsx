import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const title = 'NYCLandlordCheck';
const subtitle = 'NYC Building & Landlord Transparency';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#FAF7F2',
          color: '#1A1A1A',
          padding: '72px',
          position: 'relative',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-80px',
            width: '360px',
            height: '360px',
            borderRadius: '999px',
            backgroundColor: '#F04E3E',
            opacity: 0.12,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-160px',
            left: '-120px',
            width: '420px',
            height: '420px',
            borderRadius: '999px',
            backgroundColor: '#C65D3B',
            opacity: 0.14,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <img
              src="https://www.nyclandlordcheck.com/icon-144.png"
              width={96}
              height={96}
              alt="NYCLandlordCheck"
            />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '20px',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: '#C65D3B',
                  fontWeight: 700,
                }}
              >
                NYC Housing Intelligence
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <span style={{ fontSize: '64px', fontWeight: 800, lineHeight: 1.05 }}>
              {title}
            </span>
            <span style={{ fontSize: '30px', color: '#4A4A4A' }}>{subtitle}</span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginTop: '16px',
            }}
          >
            {['Violations', 'Complaints', 'Evictions', 'Ownership'].map((label) => (
              <span
                key={label}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  border: '2px solid #D4CFC4',
                  backgroundColor: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
