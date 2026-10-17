/** A scalloped gold wax-style seal reading PERFECT PACK. Stamped onto the boarding pass; static under reduced motion. */
export default function PerfectSeal() {
  const teeth = 20
  const pts = Array.from({ length: teeth * 2 }, (_, i) => {
    const a = (Math.PI * i) / teeth
    const r = i % 2 ? 44 : 50
    return `${(50 + r * Math.sin(a)).toFixed(2)},${(50 - r * Math.cos(a)).toFixed(2)}`
  }).join(' ')
  return (
    <svg className="perfect-seal" viewBox="0 0 100 100" role="img" aria-label="Perfect pack seal">
      <defs>
        <linearGradient id="seal-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4d36b" />
          <stop offset="0.5" stopColor="#c9981f" />
          <stop offset="1" stopColor="#8a6416" />
        </linearGradient>
        <path id="seal-arc-top" d="M20 54A30 30 0 0 1 80 54" />
        <path id="seal-arc-bottom" d="M16 58A34 34 0 0 0 84 58" />
      </defs>
      <polygon points={pts} fill="url(#seal-gold)" stroke="#6a4a0c" strokeWidth={1.4} strokeLinejoin="round" />
      <circle cx={50} cy={50} r={36} fill="none" stroke="#fff3c7" strokeWidth={1.4} />
      <circle cx={50} cy={50} r={32} fill="none" stroke="#6a4a0c" strokeWidth={0.8} strokeDasharray="1.5 1.5" />
      <text fontFamily="var(--ui)" fontWeight={800} fontSize={10.5} letterSpacing={1.5} fill="#4a3206" textAnchor="middle">
        <textPath href="#seal-arc-top" startOffset="50%">PERFECT</textPath>
      </text>
      <text fontFamily="var(--ui)" fontWeight={800} fontSize={10.5} letterSpacing={1.5} fill="#4a3206" textAnchor="middle">
        <textPath href="#seal-arc-bottom" startOffset="50%">PACK</textPath>
      </text>
      <path d="M50 38l3.2 7.6 8.2.7-6.2 5.4 1.9 8-7.1-4.3-7.1 4.3 1.9-8-6.2-5.4 8.2-.7z" fill="#fff3c7" stroke="#6a4a0c" strokeWidth={1} strokeLinejoin="round" />
    </svg>
  )
}
