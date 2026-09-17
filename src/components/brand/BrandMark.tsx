interface BrandMarkProps {
  className?: string;
  size?: number;
  title?: string;
}

export function BrandMark({ className, size = 48, title }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M32 3.5 55 16.8v30.4L32 60.5 9 47.2V16.8L32 3.5Z" fill="#991D18" />
      <path d="m32 8.2 18.5 10.7-4 3.9L32 14.4l-14.5 8.4-4-3.9L32 8.2Z" fill="#FFCD00" />
      <path
        d="M14.5 25.4c6.1 0 11.7 1.7 17.5 6.1v19.1c-5-3.5-10.2-5.4-16.2-5.5l-4.4-17.7c-.3-1.1.7-2 3.1-2Z"
        fill="#FFFDF4"
      />
      <path
        d="M49.5 25.4c-6.1 0-11.7 1.7-17.5 6.1v19.1c5-3.5 10.2-5.4 16.2-5.5l4.4-17.7c.3-1.1-.7-2-3.1-2Z"
        fill="#FFFDF4"
      />
      <path d="M20.3 31.5 24 42.4l8-5.7 8 5.7 3.7-10.9" stroke="#991D18" strokeWidth="4.1" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M32 31.5v19" stroke="#E9B900" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
