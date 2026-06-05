export const colors = {
  primary:      '#E11D48',
  primaryHover: '#BE123C',
  accent:       '#A16207',
  accentLight:  '#FEF9C3',
  background:   '#FFFFFF',
  surface:      '#F9FAFB',
  foreground:   '#111827',
  muted:        '#6B7280',
  border:       '#E5E7EB',
  success:      '#16A34A',
  destructive:  '#DC2626',
  card:         '#FFFFFF',
};

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export const radius = {
  card:   16,
  button: 12,
  pill:   999,
  sm:     8,
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
} as const;
