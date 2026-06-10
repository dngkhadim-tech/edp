import { cn } from '@/lib/utils';

interface EdpLogoProps {
  className?: string;
  withTagline?: boolean;
}

export function EdpLogo({ className, withTagline: _withTagline }: EdpLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="VEYA"
      className={cn('object-contain mix-blend-multiply dark:invert dark:mix-blend-screen', className)}
    />
  );
}
