import { cn } from '@/lib/utils';

interface EdpLogoProps {
  className?: string;
}

export function EdpLogo({ className }: EdpLogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="VEYA"
      className={cn('object-contain', className)}
    />
  );
}
