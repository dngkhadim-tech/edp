# Reservations, Loyalty, Settings, Login & Register Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign five pages (Reservations, Loyalty, Settings, Login, Register) to match the new design spec — adding tab filtering, grade-based hero cards, per-section settings layout, split-screen auth, and 2-step registration.

**Architecture:** Each page file is replaced in full; shared primitives that don't exist (Switch) are added first so every page can import them. No new routes — only the existing five page files are rewritten plus one new UI primitive.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Lucide React, @tanstack/react-query, react-hook-form, zod, @radix-ui/react-switch (to be installed), zustand

---

## File Map

| Action | Path | Purpose |
|--------|------|---------|
| Create | `apps/web/src/components/ui/switch.tsx` | Radix Switch wrapper (used in Settings notifications/privacy) |
| Modify | `apps/web/src/app/(main)/reservations/page.tsx` | Tabs + typed ReservationCard + cancel dialog |
| Modify | `apps/web/src/app/(main)/loyalty/page.tsx` | Grade hero card with spec gradients + points history grouped by date + podium leaderboard |
| Modify | `apps/web/src/app/(main)/settings/page.tsx` | Sectioned layout: Profil / Compte / Notifications / Confidentialité / Danger |
| Modify | `apps/web/src/app/(auth)/login/page.tsx` | Split 50/50 desktop, centered mobile, EDP logo text-primary |
| Modify | `apps/web/src/app/(auth)/register/page.tsx` | Split layout + 2-step (type selection → form with password strength) |

---

## Task 1: Install @radix-ui/react-switch and create Switch component

**Files:**
- Create: `apps/web/src/components/ui/switch.tsx`

- [ ] **Step 1: Install the package**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm add @radix-ui/react-switch
```

Expected: package added, no error.

- [ ] **Step 2: Create the Switch component**

Create `apps/web/src/components/ui/switch.tsx`:

```tsx
'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
```

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output (no errors).

- [ ] **Step 4: Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/web/src/components/ui/switch.tsx apps/web/package.json pnpm-lock.yaml && git commit -m "feat: add Switch UI primitive (@radix-ui/react-switch)"
```

---

## Task 2: Reservations page — tabs, typed cards, cancel dialog

**Files:**
- Modify: `apps/web/src/app/(main)/reservations/page.tsx`

**Design spec recap:**
- Tabs: [À venir] [Passées] [Annulées]  
- "À venir" = PENDING + CONFIRMED; "Passées" = COMPLETED; "Annulées" = CANCELLED  
- ReservationCard: logo placeholder 48×48 + name + category + date (Calendar icon) + guests (Users icon) + status badge + buttons  
- Annuler button: only on PENDING/CONFIRMED, opens confirmation dialog  
- Status badge colours: PENDING=yellow-50/yellow-700, CONFIRMED=green-50/green-700, CANCELLED=red-50/red-700, COMPLETED=blue-50/blue-700

- [ ] **Step 1: Rewrite the reservations page**

Replace the entire contents of `apps/web/src/app/(main)/reservations/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import type { Reservation, ReservationStatus, ReservationType } from '@edp/shared';

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-yellow-50 text-yellow-700 border border-yellow-200',
  CONFIRMED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border border-red-200',
  COMPLETED: 'bg-blue-50 text-blue-700 border border-blue-200',
  NO_SHOW:   'bg-gray-50 text-gray-600 border border-gray-200',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:   'En attente',
  CONFIRMED: 'Confirmée',
  CANCELLED: 'Annulée',
  COMPLETED: 'Terminée',
  NO_SHOW:   'Absent',
};

interface ReservationWithEstablishment extends Reservation {
  establishment?: {
    name: string;
    category?: string;
    logo?: string;
  };
}

function ReservationCard({
  res,
  onCancel,
}: {
  res: ReservationWithEstablishment;
  onCancel: (id: string) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canCancel = res.status === 'PENDING' || res.status === 'CONFIRMED';

  const dateLabel =
    res.type === 'RESTAURANT'
      ? `${(res.details as { date: string; time: string }).date} à ${(res.details as { date: string; time: string }).time}`
      : `${(res.details as { checkIn: string; checkOut: string }).checkIn} → ${(res.details as { checkIn: string; checkOut: string }).checkOut}`;

  const guestsLabel =
    res.type === 'RESTAURANT'
      ? `${(res.details as { partySize: number }).partySize} personne${(res.details as { partySize: number }).partySize > 1 ? 's' : ''}`
      : `${(res.details as { adults: number }).adults} adulte${(res.details as { adults: number }).adults > 1 ? 's' : ''}`;

  return (
    <div className="bg-card border border-border rounded-xl p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {res.establishment?.logo ? (
            <img src={res.establishment.logo} alt="" className="h-12 w-12 object-cover" />
          ) : (
            <span className="text-lg font-heading font-bold text-muted-foreground">
              {res.establishment?.name?.[0] ?? '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{res.establishment?.name}</p>
          {res.establishment?.category && (
            <p className="text-xs text-muted-foreground">{res.establishment.category}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[res.status]}`}>
          {STATUS_LABEL[res.status]}
        </span>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Calendar size={14} className="text-primary" />
          {dateLabel}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="text-primary" />
          {guestsLabel}
        </span>
      </div>

      <div className="flex gap-2">
        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setDialogOpen(true)}
          >
            Annuler
          </Button>
        )}
        <Button variant="outline" size="sm">
          Détails
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler la réservation</DialogTitle>
            <DialogDescription>
              Voulez-vous annuler votre réservation chez{' '}
              <strong>{res.establishment?.name}</strong> ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Retour</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                onCancel(res.id);
                setDialogOpen(false);
              }}
            >
              Confirmer l'annulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const TAB_FILTER: Record<string, (status: string) => boolean> = {
  upcoming:  (s) => s === 'PENDING' || s === 'CONFIRMED',
  past:      (s) => s === 'COMPLETED' || s === 'NO_SHOW',
  cancelled: (s) => s === 'CANCELLED',
};

export default function ReservationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['reservations', 'mine'],
    queryFn: () => api.get('/reservations/me').then((r) => r.data),
  });

  const { mutate: cancel } = useMutation({
    mutationFn: (id: string) => api.patch(`/reservations/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] }),
  });

  const reservations: ReservationWithEstablishment[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-screen-md mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-heading font-bold">Mes réservations</h1>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">À venir</TabsTrigger>
          <TabsTrigger value="past" className="flex-1">Passées</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex-1">Annulées</TabsTrigger>
        </TabsList>

        {(['upcoming', 'past', 'cancelled'] as const).map((tab) => {
          const items = reservations.filter((r) => TAB_FILTER[tab](r.status));
          return (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-4">
              {items.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-medium">Aucune réservation</p>
                  {tab === 'upcoming' && (
                    <>
                      <p className="text-sm mt-1">Explorez les établissements pour réserver</p>
                      <Button className="mt-4" asChild>
                        <a href="/explore">Explorer</a>
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                items.map((res) => (
                  <ReservationCard key={res.id} res={res} onCancel={cancel} />
                ))
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/web/src/app/\(main\)/reservations/page.tsx && git commit -m "feat: redesign reservations page with tabs and cancel dialog"
```

---

## Task 3: Loyalty page — grade hero, progress bar, grouped history, podium

**Files:**
- Modify: `apps/web/src/app/(main)/loyalty/page.tsx`

**Design spec recap:**
- Hero card: gradient per grade (BRONZE=amber-100→amber-200, SILVER=slate-100→slate-200, GOLD=yellow-50→amber-100, PLATINUM=sky-50→sky-100, DIAMOND=violet-50→purple-100)
- Progress bar: bg-border bg + bg-primary fill + transition-all duration-700
- Points history: icon (Zap) + description + `+X pts` in text-success, grouped by date (formatted fr-FR header)
- Leaderboard: top 3 podium (1st center/taller, 2nd left, 3rd right) + flat list for the rest + highlight current user

- [ ] **Step 1: Rewrite the loyalty page**

Replace the entire contents of `apps/web/src/app/(main)/loyalty/page.tsx`:

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { gradeColor, gradeLabel, formatNumber } from '@/lib/utils';
import { LoyaltyGrade, LOYALTY_THRESHOLDS } from '@edp/shared';
import type { LoyaltyTransaction } from '@edp/shared';
import { Trophy, Star, Zap, Gift, Crown } from 'lucide-react';

const GRADE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  BRONZE: Trophy,
  SILVER: Star,
  GOLD: Zap,
  PLATINUM: Gift,
  DIAMOND: Crown,
};

const GRADE_HERO_GRADIENT: Record<string, string> = {
  BRONZE:   'from-amber-100 to-amber-200',
  SILVER:   'from-slate-100 to-slate-200',
  GOLD:     'from-yellow-50 to-amber-100',
  PLATINUM: 'from-sky-50 to-sky-100',
  DIAMOND:  'from-violet-50 to-purple-100',
};

const GRADE_HERO_TEXT: Record<string, string> = {
  BRONZE:   'text-amber-800',
  SILVER:   'text-slate-600',
  GOLD:     'text-amber-700',
  PLATINUM: 'text-sky-700',
  DIAMOND:  'text-violet-700',
};

interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  loyaltyPoints: number;
  loyaltyGrade: string;
  avatar?: string;
}

function groupByDate(transactions: LoyaltyTransaction[]): Record<string, LoyaltyTransaction[]> {
  return transactions.reduce<Record<string, LoyaltyTransaction[]>>((acc, tx) => {
    const key = new Date(tx.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {});
}

function Podium({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  const podiumOrder = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights = ['h-16', 'h-24', 'h-12'];
  const medals = ['🥈', '🥇', '🥉'];

  return (
    <div className="flex items-end justify-center gap-2 mb-6">
      {podiumOrder.map((entry, i) => (
        <div
          key={entry.id}
          className={`flex flex-col items-center gap-2 ${entry.id === currentUserId ? 'opacity-100' : 'opacity-90'}`}
        >
          <span className="text-2xl">{medals[i]}</span>
          <div className="text-center">
            <p className="text-xs font-semibold truncate max-w-[80px]">{entry.firstName}</p>
            <p className="text-xs text-muted-foreground">{formatNumber(entry.loyaltyPoints)} pts</p>
          </div>
          <div
            className={`${heights[i]} w-16 rounded-t-lg bg-gradient-to-t from-primary/30 to-primary/10 border border-primary/20 flex items-end justify-center pb-1`}
          >
            <span className="text-xs font-bold text-primary">{i === 1 ? 1 : i === 0 ? 2 : 3}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoyaltyPage() {
  const { user } = useAuthStore();

  const { data: historyData } = useQuery({
    queryKey: ['loyalty', 'history'],
    queryFn: () => api.get('/loyalty/history').then((r) => r.data),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['loyalty', 'leaderboard'],
    queryFn: () => api.get('/loyalty/leaderboard').then((r) => r.data),
  });

  const grades = Object.values(LoyaltyGrade);
  const currentGradeIndex = grades.indexOf(user?.loyaltyGrade as LoyaltyGrade);
  const nextGrade = grades[currentGradeIndex + 1] as LoyaltyGrade | undefined;
  const nextThreshold = nextGrade ? LOYALTY_THRESHOLDS[nextGrade] : null;
  const progress = nextThreshold
    ? Math.min(((user?.loyaltyPoints ?? 0) / nextThreshold) * 100, 100)
    : 100;

  const heroGradient = GRADE_HERO_GRADIENT[user?.loyaltyGrade ?? 'BRONZE'] ?? 'from-amber-100 to-amber-200';
  const heroText = GRADE_HERO_TEXT[user?.loyaltyGrade ?? 'BRONZE'] ?? 'text-amber-800';
  const GradeIcon = GRADE_ICONS[user?.loyaltyGrade ?? 'BRONZE'] ?? Trophy;

  const transactions: LoyaltyTransaction[] = historyData?.data ?? [];
  const grouped = groupByDate(transactions);
  const entries: LeaderboardEntry[] = leaderboard ?? [];

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold">Programme de fidélité</h1>
        <p className="text-muted-foreground mt-1">Gagnez des points et débloquez des avantages exclusifs</p>
      </div>

      {user && (
        <div className={`bg-gradient-to-br ${heroGradient} rounded-2xl p-6 space-y-5`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${heroText} opacity-70`}>Votre grade</p>
              <h2 className={`text-4xl font-heading font-bold ${heroText}`}>
                {gradeLabel(user.loyaltyGrade)}
              </h2>
            </div>
            <GradeIcon size={52} className={heroText} />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className={`font-semibold ${heroText}`}>{formatNumber(user.loyaltyPoints)} points</span>
              {nextGrade && (
                <span className={`${heroText} opacity-70`}>
                  {formatNumber(nextThreshold!)} pour {gradeLabel(nextGrade)}
                </span>
              )}
            </div>
            <div className="h-3 bg-border/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Historique des points</h2>
          {Object.entries(grouped).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun historique disponible.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, txs]) => (
                <div key={date}>
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">{date}</p>
                  <div className="space-y-2">
                    {txs.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg"
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Zap size={14} className="text-primary" />
                        </div>
                        <p className="flex-1 text-sm">{tx.description}</p>
                        <span className="font-bold text-sm text-success shrink-0">+{tx.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Classement</h2>
          {entries.length >= 3 && (
            <Podium entries={entries.slice(0, 3)} currentUserId={user?.id} />
          )}
          <div className="space-y-2">
            {entries.slice(3).map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  entry.id === user?.id
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border'
                }`}
              >
                <span className="text-sm font-bold w-6 text-center text-muted-foreground">
                  #{i + 4}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {entry.firstName} {entry.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">@{entry.username}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm">{formatNumber(entry.loyaltyPoints)}</p>
                  <p className={`text-xs font-medium ${gradeColor(entry.loyaltyGrade)}`}>
                    {gradeLabel(entry.loyaltyGrade)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/web/src/app/\(main\)/loyalty/page.tsx && git commit -m "feat: redesign loyalty page with grade hero card, grouped history, and podium"
```

---

## Task 4: Settings page — sectioned layout with notifications and privacy toggles

**Files:**
- Modify: `apps/web/src/app/(main)/settings/page.tsx`

**Design spec recap:**
- Section "Mon profil": avatar + camera overlay (bg-primary) + Prénom, Nom, Username, Bio, Ville + [Enregistrer]
- Section "Compte": Email read-only + [Changer le mot de passe] (placeholder button, no modal needed)
- Section "Notifications": 4 Switch toggles — Likes, Commentaires, Abonnés, Réservations
- Section "Confidentialité": Switch toggle — Compte privé
- Section "Danger": [Supprimer mon compte] outline destructive

Notification/privacy toggle state is local (no API for preferences in spec — use `useState`).

- [ ] **Step 1: Rewrite the settings page**

Replace the entire contents of `apps/web/src/app/(main)/settings/page.tsx`:

```tsx
'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Camera } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _'),
  bio: z.string().max(500).optional(),
  city: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-heading font-semibold mb-4">{children}</h2>;
}

function SettingsSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`bg-card border border-border rounded-xl p-5 space-y-4 ${className ?? ''}`}>
      {children}
    </section>
  );
}

function NotificationRow({
  label,
  checked,
  onCheckedChange,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function SettingsPage() {
  const { user, fetchMe } = useAuthStore();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [notifs, setNotifs] = useState({
    likes: true,
    comments: true,
    followers: true,
    reservations: true,
  });
  const [privateAccount, setPrivateAccount] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      username: user?.username ?? '',
      bio: user?.bio ?? '',
      city: user?.city ?? '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      await api.patch('/users/me', data);
      await fetchMe();
      toast({ title: 'Profil mis à jour' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err?.response?.data?.message });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.patch('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      await fetchMe();
      toast({ title: 'Photo de profil mise à jour' });
    } catch {
      toast({ variant: 'destructive', title: "Erreur lors de l'upload" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-heading font-bold">Paramètres</h1>

      {/* Mon profil */}
      <SettingsSection>
        <SectionTitle>Mon profil</SectionTitle>

        <div className="flex justify-center mb-2">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-heading">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors shadow"
            >
              <Camera size={13} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input {...register('firstName')} className="bg-secondary" />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input {...register('lastName')} className="bg-secondary" />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nom d'utilisateur</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                @
              </span>
              <Input {...register('username')} className="bg-secondary pl-7" />
            </div>
            {errors.username && (
              <p className="text-xs text-destructive">{errors.username.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Bio</Label>
            <textarea
              {...register('bio')}
              rows={3}
              placeholder="Décrivez-vous en quelques mots..."
              className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Ville</Label>
            <Input {...register('city')} placeholder="Paris" className="bg-secondary" />
          </div>

          <Button type="submit" disabled={saving || !isDirty} className="w-full">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>
      </SettingsSection>

      {/* Compte */}
      <SettingsSection>
        <SectionTitle>Compte</SectionTitle>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input value={user.email} readOnly className="bg-secondary text-muted-foreground cursor-not-allowed" />
        </div>
        <Button variant="outline" className="w-full">
          Changer le mot de passe
        </Button>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection>
        <SectionTitle>Notifications</SectionTitle>
        <NotificationRow
          label="Likes"
          checked={notifs.likes}
          onCheckedChange={(v) => setNotifs((n) => ({ ...n, likes: v }))}
        />
        <NotificationRow
          label="Commentaires"
          checked={notifs.comments}
          onCheckedChange={(v) => setNotifs((n) => ({ ...n, comments: v }))}
        />
        <NotificationRow
          label="Abonnés"
          checked={notifs.followers}
          onCheckedChange={(v) => setNotifs((n) => ({ ...n, followers: v }))}
        />
        <NotificationRow
          label="Réservations"
          checked={notifs.reservations}
          onCheckedChange={(v) => setNotifs((n) => ({ ...n, reservations: v }))}
        />
      </SettingsSection>

      {/* Confidentialité */}
      <SettingsSection>
        <SectionTitle>Confidentialité</SectionTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Compte privé</p>
            <p className="text-xs text-muted-foreground">Seuls vos abonnés peuvent voir vos publications</p>
          </div>
          <Switch checked={privateAccount} onCheckedChange={setPrivateAccount} />
        </div>
      </SettingsSection>

      {/* Danger */}
      <SettingsSection>
        <SectionTitle>Danger</SectionTitle>
        <p className="text-sm text-muted-foreground">Ces actions sont irréversibles.</p>
        <Button
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          Supprimer mon compte
        </Button>
      </SettingsSection>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/web/src/app/\(main\)/settings/page.tsx && git commit -m "feat: redesign settings page with sectioned layout and notification toggles"
```

---

## Task 5: Login page — 50/50 split layout, EDP logo text-primary, show/hide password

**Files:**
- Modify: `apps/web/src/app/(auth)/login/page.tsx`

**Design spec recap:**
- Desktop: left half = gradient hero (bg-gradient-to-br from-primary/20 via-background to-background) with EDP branding; right half = form
- Mobile: full width, centered form
- Logo: "EDP" font-heading font-extrabold text-4xl text-primary (NOT gold-text)
- Inputs: Email + Password with show/hide toggle
- [Se connecter] bg-primary h-12 full width
- OAuth: Google + Facebook outline buttons (use existing SVGs)
- "Pas encore de compte ? S'inscrire →" link

- [ ] **Step 1: Rewrite the login page**

Replace the entire contents of `apps/web/src/app/(auth)/login/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [showPass, setShowPass] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data.email, data.password);
      router.push('/feed');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Connexion échouée',
        description: err?.response?.data?.message ?? 'Identifiants invalides',
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background flex-col justify-between p-12">
        <span className="text-4xl font-heading font-extrabold text-primary">EDP</span>
        <div>
          <p className="text-2xl font-light text-foreground/80">Partagez vos expériences,</p>
          <p className="text-2xl font-light text-foreground/80">réservez vos moments.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <span className="text-4xl font-heading font-extrabold text-primary">EDP</span>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold">Bienvenue</h1>
            <p className="mt-1 text-sm text-muted-foreground">Connectez-vous à votre compte</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                {...register('email')}
                className="bg-secondary border-border"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-3 border-border hover:bg-secondary"
              onClick={() =>
                (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`)
              }
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continuer avec Google
            </Button>

            <Button
              variant="outline"
              className="w-full gap-3 border-border hover:bg-secondary"
              onClick={() =>
                (window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/facebook`)
              }
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-600" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Continuer avec Facebook
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary hover:underline font-medium">
              S'inscrire →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/web/src/app/\(auth\)/login/page.tsx && git commit -m "feat: redesign login page with split layout and text-primary EDP logo"
```

---

## Task 6: Register page — split layout, 2-step (type selection + form with password strength)

**Files:**
- Modify: `apps/web/src/app/(auth)/register/page.tsx`

**Design spec recap:**
- Same split layout as login (left gradient hero, right form)
- Step 1: Two cards side by side — "Utilisateur" and "Établissement". Selected card gets `border-primary bg-primary/5`. Clicking [Continuer] moves to step 2.
- Step 2: Prénom, Nom, Username (@-prefixed), Email, Password + [Retour] + [Créer mon compte]
- Password strength: 4 colored bars below password input. Strength is 0–4 based on: length≥8, uppercase, number, special char. Colors: 0=bg-border, 1=bg-red-500, 2=bg-orange-400, 3=bg-yellow-400, 4=bg-success
- Validation: react-hook-form + zod (same schema as existing)

- [ ] **Step 1: Rewrite the register page**

Replace the entire contents of `apps/web/src/app/(auth)/register/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Building2, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  username: z
    .string()
    .min(3, 'Minimum 3 caractères')
    .max(30)
    .regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _ uniquement'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
});

type FormData = z.infer<typeof schema>;

function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_COLOR: Record<number, string> = {
  0: 'bg-border',
  1: 'bg-red-500',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-success',
};

function PasswordStrengthBars({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="flex gap-1 mt-2">
      {[1, 2, 3, 4].map((level) => (
        <div
          key={level}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors duration-200',
            strength >= level ? STRENGTH_COLOR[strength] : 'bg-border',
          )}
        />
      ))}
    </div>
  );
}

type AccountType = 'user' | 'establishment';

function TypeCard({
  type,
  selected,
  onSelect,
}: {
  type: AccountType;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = type === 'user' ? User : Building2;
  const label = type === 'user' ? 'Utilisateur' : 'Établissement';
  const description =
    type === 'user'
      ? 'Découvrez et partagez vos expériences'
      : 'Gérez votre établissement et vos réservations';

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-left',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <div
        className={cn(
          'h-12 w-12 rounded-full flex items-center justify-center',
          selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon size={22} />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<AccountType>('user');
  const [showPass, setShowPass] = useState(false);
  const [passwordValue, setPasswordValue] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({ ...data, isEstablishment: accountType === 'establishment' });
      router.push('/feed');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err?.response?.data?.message ?? "Erreur lors de l'inscription",
      });
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left hero — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background flex-col justify-between p-12">
        <span className="text-4xl font-heading font-extrabold text-primary">EDP</span>
        <div>
          <p className="text-2xl font-light text-foreground/80">Rejoignez la communauté</p>
          <p className="text-2xl font-light text-foreground/80">et partagez vos moments.</p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-6">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <span className="text-4xl font-heading font-extrabold text-primary">EDP</span>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-heading font-bold">Créer un compte</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 1 ? 'Quel type de compte souhaitez-vous créer ?' : 'Vos informations'}
            </p>
          </div>

          {step === 1 ? (
            <div className="space-y-6">
              <div className="flex gap-4">
                <TypeCard
                  type="user"
                  selected={accountType === 'user'}
                  onSelect={() => setAccountType('user')}
                />
                <TypeCard
                  type="establishment"
                  selected={accountType === 'establishment'}
                  onSelect={() => setAccountType('establishment')}
                />
              </div>
              <Button className="w-full h-12" onClick={() => setStep(2)}>
                Continuer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prénom</Label>
                  <Input {...register('firstName')} placeholder="Jean" className="bg-secondary" />
                  {errors.firstName && (
                    <p className="text-xs text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Nom</Label>
                  <Input {...register('lastName')} placeholder="Dupont" className="bg-secondary" />
                  {errors.lastName && (
                    <p className="text-xs text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Nom d'utilisateur</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    @
                  </span>
                  <Input
                    {...register('username')}
                    placeholder="jean_dupont"
                    className="bg-secondary pl-7"
                  />
                </div>
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="jean@exemple.com"
                  className="bg-secondary"
                />
                {errors.email && (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Mot de passe</Label>
                <div className="relative">
                  <Input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="bg-secondary pr-10"
                    onChange={(e) => setPasswordValue(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordValue && <PasswordStrengthBars password={passwordValue} />}
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Retour
                </Button>
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: TypeScript check**

```bash
cd /Users/khadimdiongue/edp/apps/web && pnpm tsc --noEmit 2>&1 | grep -i error | grep -v "map/page" | grep -v "e2e/" | head -10
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/khadimdiongue/edp && git add apps/web/src/app/\(auth\)/register/page.tsx && git commit -m "feat: redesign register page with split layout and 2-step flow"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered in task |
|------------------|-----------------|
| Reservations: tabs À venir / Passées / Annulées | Task 2 |
| Reservations: ReservationCard with logo 48px, name, category, date, guests, status badge | Task 2 |
| Reservations: status badge colours PENDING/CONFIRMED/CANCELLED | Task 2 |
| Reservations: Annuler button only on PENDING/CONFIRMED, with confirmation dialog | Task 2 |
| Reservations: Détails button | Task 2 |
| Reservations: API GET /reservations/me, PATCH /reservations/{id}/cancel | Task 2 |
| Loyalty: hero grade card with per-grade gradient | Task 3 |
| Loyalty: progress bar bg-border + bg-primary animated | Task 3 |
| Loyalty: points history grouped by date with Zap icon and text-success amount | Task 3 |
| Loyalty: leaderboard top-3 podium + user rank in flat list | Task 3 |
| Loyalty: API GET /loyalty/history, /loyalty/leaderboard | Task 3 |
| Settings: "Paramètres" header | Task 4 |
| Settings: Avatar with camera overlay bg-primary | Task 4 |
| Settings: Profil inputs Prénom, Nom, Username, Bio, Ville | Task 4 |
| Settings: Compte section with read-only email | Task 4 |
| Settings: Notifications section with 4 Switch toggles | Task 4 |
| Settings: Confidentialité toggle Compte privé | Task 4 |
| Settings: Danger section with destructive button | Task 4 |
| Login: desktop 50/50 split | Task 5 |
| Login: mobile centered form | Task 5 |
| Login: EDP logo Outfit 800 text-primary | Task 5 |
| Login: password show/hide toggle | Task 5 |
| Login: [Se connecter] primary h-12 | Task 5 |
| Login: Google + Facebook OAuth outline buttons | Task 5 |
| Login: "Pas encore de compte ? S'inscrire →" | Task 5 |
| Register: same split layout | Task 6 |
| Register: step 1 account type selection cards with border-primary when selected | Task 6 |
| Register: step 2 form fields | Task 6 |
| Register: password strength indicator 4 bars | Task 6 |
| Register: API POST /auth/register | Task 6 (via useAuthStore.register) |
| Switch component for Settings | Task 1 |

### Placeholder scan

No TBDs, no "implement later", no vague instructions. All steps have complete code.

### Type consistency

- `ReservationWithEstablishment` defined and used only in Task 2.
- `LeaderboardEntry` defined and used only in Task 3 (matches the leaderboard API response shape from usage in original file).
- `ProfileForm` used in Task 4 — matches `profileSchema` inferred type.
- `AccountType` in Task 6 used for `step` and `setStep` — `step` typed as `1 | 2`, `accountType` typed as `AccountType`.
- `getPasswordStrength` returns `number`; `STRENGTH_COLOR` keyed by `number` — consistent.
- `PasswordStrengthBars` receives `password: string` and uses `getPasswordStrength` — consistent.
- `TAB_FILTER` in Task 2 keyed by `string`, values are `(status: string) => boolean` — consistent with `res.status` usage.
