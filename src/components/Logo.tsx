// ClientFlow mark - "Kanban Flow": three board columns with a gold card
// mid-move and motion lines behind it. Drawn by hand, not a stock icon.
// The motion lines drop out below 20px so it stays legible at favicon size.
export default function Logo({ size = 20 }: { size?: number }) {
  const detailed = size >= 20;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="ClientFlow logo"
    >
      {/* left + right columns (waiting, done) */}
      <rect x="5" y="11" width="4.5" height="15" rx="1.6" fill="#ede9e3" fillOpacity="0.4" />
      <rect x="22.5" y="14" width="4.5" height="12" rx="1.6" fill="#ede9e3" fillOpacity="0.4" />
      {/* the card being moved - gold, lifted */}
      <rect x="13.5" y="6" width="5.5" height="9.5" rx="1.8" fill="#c9a35a" />
      {detailed && (
        <path
          d="M8.8 8.2h3.2M7.4 11h3.6"
          stroke="#c9a35a"
          strokeOpacity="0.8"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
      {/* next card waiting in the middle column */}
      <rect x="13.5" y="18" width="5.5" height="8" rx="1.6" fill="#ede9e3" fillOpacity="0.25" />
    </svg>
  );
}
