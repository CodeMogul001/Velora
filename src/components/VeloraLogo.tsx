interface VeloraLogoProps {
  className?: string;
  size?: number;
}

export default function VeloraLogo({ className = '', size = 28 }: VeloraLogoProps) {
  return (
    <div
      id="velora-brand-logo"
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Kinetic routing curves: two streamlined flows intersecting at optimal node */}
        <path
          d="M 6 8 C 14 8, 14 24, 26 24"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          className="text-slate-900"
        />
        <path
          d="M 6 24 C 14 24, 15 12, 23 9"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          className="text-emerald-500"
        />
        {/* Optimal convergence node */}
        <circle cx="26" cy="24" r="2.75" className="fill-slate-900" />
        <circle cx="23" cy="9" r="2.75" className="fill-emerald-500" />
      </svg>
    </div>
  );
}
