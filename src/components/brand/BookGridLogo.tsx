import Link from 'next/link';

interface BookGridLogoProps {
  readonly href?: string;
  readonly showByline?: boolean;
  readonly size?: 'sm' | 'md';
}

/**
 * BookGrid Official Geometric Mark (Minimalist 2x2 Scheduling Grid + Active Slot)
 */
export function BookGridMark({ size = 'md' }: { readonly size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'w-7 h-7' : 'w-8 h-8';
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${dim} shrink-0`}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#1B1340" />
      <rect x="7" y="7" width="7.5" height="7.5" rx="2" fill="#FFFFFF" />
      <rect x="17.5" y="7" width="7.5" height="7.5" rx="2" fill="#94A3B8" fillOpacity="0.45" />
      <rect x="7" y="17.5" width="7.5" height="7.5" rx="2" fill="#94A3B8" fillOpacity="0.45" />
      <rect x="17.5" y="17.5" width="7.5" height="7.5" rx="2" fill="#14B8A6" />
    </svg>
  );
}

export function BookGridLogo({
  href = '/',
  showByline = false,
  size = 'md',
}: BookGridLogoProps) {
  const content = (
    <div className="inline-flex items-center gap-2.5">
      <BookGridMark size={size} />
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-lg tracking-tight text-[#1B1340]">BookGrid</span>
        {showByline && (
          <span className="hidden sm:inline text-xs font-medium text-slate-500">
            by GilByte Solutions
          </span>
        )}
      </div>
    </div>
  );

  if (!href) {
    return content;
  }

  return <Link href={href}>{content}</Link>;
}
