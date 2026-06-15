'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { gradeColor, gradeLabel, formatNumber } from '@/lib/utils';
import { LoyaltyGrade, LOYALTY_THRESHOLDS } from '@edp/shared';
import { Trophy, Star, Zap, Gift, Crown, Loader2, type LucideIcon } from 'lucide-react';

const GRADE_ICONS: Record<string, LucideIcon> = {
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

interface LoyaltyTransaction {
  id: string;
  description: string;
  points: number;
  createdAt: string;
}

interface LeaderboardEntry {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  loyaltyPoints: number;
  loyaltyGrade: string;
}

function groupByDate(txs: LoyaltyTransaction[]): Record<string, LoyaltyTransaction[]> {
  return txs.reduce<Record<string, LoyaltyTransaction[]>>((acc, tx) => {
    const key = new Date(tx.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    (acc[key] ??= []).push(tx);
    return acc;
  }, {});
}

function Podium({ entries, currentUserId }: { entries: LeaderboardEntry[]; currentUserId?: string }) {
  const order = [entries[1], entries[0], entries[2]].filter(Boolean);
  const heights = ['h-16', 'h-24', 'h-12'];
  const ranks = [2, 1, 3];

  return (
    <div className="flex items-end justify-center gap-3 mb-6" role="list" aria-label="Podium top 3">
      {order.map((entry, i) => (
        <div key={entry.id} role="listitem" className="flex flex-col items-center gap-2">
          <span className="text-2xl font-heading font-bold text-muted-foreground" aria-hidden="true">
            {ranks[i] === 1 ? '①' : ranks[i] === 2 ? '②' : '③'}
          </span>
          <div className="text-center">
            <p className="text-xs font-semibold truncate max-w-[72px]">{entry.firstName}</p>
            <p className="text-xs text-muted-foreground tabular-nums">{formatNumber(entry.loyaltyPoints)} pts</p>
          </div>
          <div className={`${heights[i]} w-16 rounded-t-lg bg-gradient-to-t from-primary/30 to-primary/10 border border-primary/20 flex items-end justify-center pb-1`}>
            <span className="text-xs font-bold text-primary tabular-nums" aria-label={`Rang ${ranks[i]}`}>{ranks[i]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LoyaltyPage() {
  const { user } = useAuthStore();

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['loyalty', 'history'],
    queryFn: () => api.get('/loyalty/history').then((r) => r.data),
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery({
    queryKey: ['loyalty', 'leaderboard'],
    queryFn: () => api.get('/loyalty/leaderboard').then((r) => r.data),
  });

  const grades = Object.values(LoyaltyGrade);
  const currentIndex = grades.indexOf(user?.loyaltyGrade as LoyaltyGrade);
  const nextGrade = grades[currentIndex + 1] as LoyaltyGrade | undefined;
  const nextThreshold = nextGrade ? LOYALTY_THRESHOLDS[nextGrade] : null;
  const progress = nextThreshold
    ? Math.min(((user?.loyaltyPoints ?? 0) / nextThreshold) * 100, 100)
    : 100;

  const grade = user?.loyaltyGrade ?? 'BRONZE';
  const heroGradient = GRADE_HERO_GRADIENT[grade] ?? 'from-amber-100 to-amber-200';
  const heroText = GRADE_HERO_TEXT[grade] ?? 'text-amber-800';
  const GradeIcon: LucideIcon = GRADE_ICONS[grade] ?? Trophy;

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
            <GradeIcon size={52} className={heroText} aria-hidden="true" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className={`font-semibold ${heroText} tabular-nums`}>
                {formatNumber(user.loyaltyPoints)} points
              </span>
              {nextGrade && nextThreshold && (
                <span className={`${heroText} opacity-70 tabular-nums`}>
                  {formatNumber(nextThreshold)} pour {gradeLabel(nextGrade)}
                </span>
              )}
            </div>
            <div className="h-3 bg-black/10 rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
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
          <h2 className="text-xl font-heading font-semibold mb-4">Historique des points</h2>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun historique disponible.</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, txs]) => (
                <div key={date}>
                  <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">{date}</p>
                  <div className="space-y-2">
                    {txs.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Zap size={14} className="text-primary" aria-hidden="true" />
                        </div>
                        <p className="flex-1 text-sm">{tx.description}</p>
                        <span className="font-bold text-sm text-success shrink-0 tabular-nums">+{tx.points}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-heading font-semibold mb-4">Classement</h2>
          {leaderboardLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : (
          <>
          {entries.length >= 3 && (
            <Podium entries={entries.slice(0, 3)} currentUserId={user?.id} />
          )}
          <div className="space-y-2">
            {entries.slice(entries.length >= 3 ? 3 : 0).map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  entry.id === user?.id
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border'
                }`}
              >
                <span className="text-sm font-bold w-7 text-center text-muted-foreground tabular-nums">
                  #{(entries.length >= 3 ? i + 4 : i + 1)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{entry.firstName} {entry.lastName}</p>
                  <p className="text-xs text-muted-foreground">@{entry.username}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-sm tabular-nums">{formatNumber(entry.loyaltyPoints)}</p>
                  <p className={`text-xs font-medium ${gradeColor(entry.loyaltyGrade)}`}>
                    {gradeLabel(entry.loyaltyGrade)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
