import { cn } from '@/lib/utils';

interface EdpLogoProps {
  className?: string;
  withTagline?: boolean;
}

export function EdpLogo({ className, withTagline = false }: EdpLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={withTagline ? '0 0 480 320' : '0 0 480 220'}
      fill="none"
      aria-label="EDP — Eat Drink Pose"
      className={cn('text-foreground', className)}
    >
      {/* E */}
      <polyline points="110,24 24,24 24,196 110,196"
        stroke="currentColor" strokeWidth="11" strokeLinecap="square" strokeLinejoin="miter" fill="none"/>
      <line x1="24" y1="108" x2="92" y2="108"
        stroke="currentColor" strokeWidth="11" strokeLinecap="square"/>

      {/* D */}
      <line x1="148" y1="24" x2="148" y2="196"
        stroke="currentColor" strokeWidth="11" strokeLinecap="square"/>
      <path d="M148 24 H204 Q296 24 296 110 Q296 196 204 196 H148"
        stroke="currentColor" strokeWidth="11" strokeLinejoin="round" fill="none"/>

      {/* P */}
      <line x1="336" y1="24" x2="336" y2="196"
        stroke="currentColor" strokeWidth="11" strokeLinecap="square"/>
      <path d="M336 24 H390 Q456 24 456 96 Q456 110 390 110 H336"
        stroke="currentColor" strokeWidth="11" strokeLinejoin="round" fill="none"/>

      {withTagline && (
        <text
          x="240" y="268"
          textAnchor="middle"
          fontFamily="'DM Sans', 'Helvetica Neue', Arial, sans-serif"
          fontSize="22"
          fontWeight="400"
          letterSpacing="8"
          fill="currentColor"
        >
          EAT · DRINK · POSE
        </text>
      )}
    </svg>
  );
}
