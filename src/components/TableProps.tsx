/**
 * Decorative props lying on the tabletop, in the page margins only (hidden on narrow screens): a pencil, a coffee
 * ring and a half-written packing list that has already given up. Purely atmosphere: aria-hidden, no pointer events.
 */
export default function TableProps() {
  return (
    <div className="props" aria-hidden="true">
      <svg className="prop prop-list" viewBox="0 0 150 190" width="150" height="190">
        <g transform="rotate(-6 75 95)">
          <rect x="8" y="6" width="134" height="176" rx="5" fill="#fffaf0" stroke="#2b2433" strokeWidth="2.2" />
          <path d="M8 26h134" stroke="#cf8f8a" strokeWidth="1.6" />
          <g stroke="#9c8f7e" strokeWidth="1.3">
            <path d="M18 44h114M18 62h114M18 80h114M18 98h114M18 116h114M18 134h114M18 152h114" />
          </g>
          <g fontFamily="Caveat, 'Segoe Print', 'Bradley Hand', cursive" fontSize="14" fill="#2b2433">
            <text x="20" y="21" fontWeight="700">PACK:</text>
            <text x="20" y="58">1. everything</text>
            <text x="20" y="76">2. more things</text>
            <text x="20" y="94" textDecoration="line-through">3. a plan</text>
            <text x="20" y="112">4. socks?? </text>
          </g>
        </g>
      </svg>
      <svg className="prop prop-pencil" viewBox="0 0 220 28" width="220" height="28">
        <g transform="rotate(-18 110 14)">
          <rect x="22" y="6" width="150" height="16" fill="#e7b23c" stroke="#2b2433" strokeWidth="2" />
          <path d="M22 11h150M22 17h150" stroke="#b98a22" strokeWidth="1.2" />
          <path d="M22 6L2 14l20 8z" fill="#f1d9b2" stroke="#2b2433" strokeWidth="2" strokeLinejoin="round" />
          <path d="M8 12l-6 2 6 2z" fill="#2b2433" />
          <rect x="172" y="5" width="14" height="18" fill="#c9b07a" stroke="#2b2433" strokeWidth="2" />
          <rect x="186" y="6" width="16" height="16" rx="4" fill="#e58a8a" stroke="#2b2433" strokeWidth="2" />
        </g>
      </svg>
      <svg className="prop prop-ring" viewBox="0 0 120 120" width="120" height="120">
        <circle cx="60" cy="60" r="44" fill="none" stroke="#7a4b2a" strokeOpacity="0.22" strokeWidth="6" />
        <circle cx="60" cy="60" r="41" fill="none" stroke="#7a4b2a" strokeOpacity="0.1" strokeWidth="2" strokeDasharray="60 190" />
      </svg>
    </div>
  )
}
