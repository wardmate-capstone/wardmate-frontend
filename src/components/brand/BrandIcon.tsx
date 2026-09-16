import { Buildings } from '@phosphor-icons/react';

interface BrandIconProps {
  className?: string;
  size?: number;
}

export function BrandIcon({ className, size = 25 }: BrandIconProps) {
  return <Buildings className={className} size={size} weight="regular" aria-hidden="true" />;
}
