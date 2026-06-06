import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EdpLogoProps {
  className?: string;
  withTagline?: boolean;
  width?: number;
  height?: number;
}

export function EdpLogo({ className, withTagline = false, width, height }: EdpLogoProps) {
  const src = withTagline ? '/logo.png' : '/logo-icon.png';
  const defaultWidth = withTagline ? 200 : 80;
  const defaultHeight = withTagline ? 120 : 80;

  return (
    <Image
      src={src}
      alt="EDP — Eat Drink Pose"
      width={width ?? defaultWidth}
      height={height ?? defaultHeight}
      className={cn('object-contain dark:invert', className)}
      priority
    />
  );
}
