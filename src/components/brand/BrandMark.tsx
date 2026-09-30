interface BrandMarkProps {
  className?: string;
  size?: number;
  title?: string;
}

export function BrandMark({ className, size = 48, title }: BrandMarkProps) {
  return (
    <img
      src="/wardmate-mark.svg"
      alt={title || 'WardMate'}
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    />
  );
}
