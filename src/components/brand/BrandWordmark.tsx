interface BrandWordmarkProps {
  subtitle: string;
  compact?: boolean;
  inverse?: boolean;
}

export function BrandWordmark({ subtitle, compact = false, inverse = false }: BrandWordmarkProps) {
  const className = ['brand-wordmark', compact && 'is-compact', inverse && 'is-inverse'].filter(Boolean).join(' ');

  return (
    <span className={className}>
      <strong aria-label="WardMate"><span>Ward</span><span>Mate</span></strong>
      <small>{subtitle}</small>
    </span>
  );
}
