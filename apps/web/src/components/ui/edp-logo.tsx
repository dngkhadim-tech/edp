import { cn } from '@/lib/utils';

interface EdpLogoProps {
  className?: string;
  withTagline?: boolean;
}

export function EdpLogo({ className, withTagline = false }: EdpLogoProps) {
  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="VEYA"
        className="object-contain w-full h-full dark:invert"
      />
      {withTagline && (
        <span className="text-[10px] tracking-[0.3em] font-medium text-muted-foreground uppercase">
          Eat · Drink · Pose
        </span>
      )}
    </div>
  );
}
