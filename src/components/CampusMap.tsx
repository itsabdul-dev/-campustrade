/**
 * A drawn campus map rather than a photo: it always renders the same, reads
 * unambiguously as a map at any size, and costs no network request.
 */
export default function CampusMap({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Campus map showing the meet-up point"
      className={`${className} dark:opacity-90`}
    >
      <rect width="400" height="200" fill="#EEF1F6" />

      {/* Green space */}
      <rect x="118" y="52" width="164" height="96" rx="10" fill="#DCEBDA" />
      <circle cx="150" cy="80" r="9" fill="#C3DDBF" />
      <circle cx="252" cy="124" r="11" fill="#C3DDBF" />
      <circle cx="168" cy="132" r="7" fill="#C3DDBF" />

      {/* Building blocks */}
      {[
        [16, 20, 74, 46],
        [16, 96, 60, 62],
        [312, 24, 72, 58],
        [306, 104, 78, 54],
        [118, 8, 88, 28],
        [216, 8, 66, 28],
        [126, 164, 92, 28],
        [232, 164, 70, 28],
      ].map(([x, y, w, h], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          rx="4"
          fill="#DDE3EC"
          stroke="#CED6E2"
        />
      ))}

      {/* Roads */}
      <g stroke="#FFFFFF" strokeLinecap="round">
        <path d="M0 44h400" strokeWidth="9" />
        <path d="M0 158h400" strokeWidth="9" />
        <path d="M104 0v200" strokeWidth="9" />
        <path d="M296 0v200" strokeWidth="9" />
      </g>
      <g stroke="#E4E9F1" strokeWidth="1">
        <path d="M0 44h400M0 158h400M104 0v200M296 0v200" />
      </g>

      {/* Footpath through the quad */}
      <path
        d="M104 100h192"
        stroke="#F5DEB8"
        strokeWidth="5"
        strokeDasharray="10 7"
        strokeLinecap="round"
      />
    </svg>
  )
}
