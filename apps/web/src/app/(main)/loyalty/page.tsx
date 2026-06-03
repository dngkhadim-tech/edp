'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { gradeColor, gradeLabel, formatNumber } from '@/lib/utils';
import { LoyaltyGrade, LOYALTY_THRESHOLDS } from '@edp/shared';
import { Trophy, Star, Zap, Gift, Crown } from 'lucide-react';

const GRADE_ICONS: Record<string, React.ComponentType<any>> = {
  BRONZE: Trophy,
  SILVER: Star,
  GOLD: Zap,
  PLATINUM: Gift,
  DIAMOND: Crown,
};

const GRADE_BENEFITS: Record<string, string[]> = {
  BRONZE: ['Badge Bronze'],
  SILVER: ['Badge Silver', 'Réductions partenaires'],
  GOLD: ['Badge Gold', 'Réductions partenaires', 'Réservations prioritaires'],
  PLATINUM: ['Badge Platinum', 'Offres exclusives', 'Réservations prioritaires'],
  DIAMOND: ['Badge Diamond', 'Expériences VIP', 'Offres exclusives', 'Réservations prioritaires'],
};

export default function LoyaltyPage() {
  const { user } = useAuthStore();

  const { data: history } = useQuery({
    queryKey: ['loyalty', 'history'],
    queryFn: () => api.get('/loyalty/history').then((r) => r.data),
  });

  const { data: leaderboard } = useQuery({
    queryKey: ['loyalty', 'leaderboard'],
    queryFn: () => api.get('/loyalty/leaderboard').then((r) => r.data),
  });

  const grades = Object.values(LoyaltyGrade);
  const currentGradeIndex = grades.indexOf(user?.loyaltyGrade as LoyaltyGrade);
  const nextGrade = grades[currentGradeIndex + 1];
  const nextThreshold = nextGrade ? LOYALTY_THRESHOLDS[nextGrade as LoyaltyGrade] : null;
  const progress = nextThreshold
    ? ((user?.loyaltyPoints || 0) / nextThreshold) * 100
    : 100;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-display font-bold">Programme de fidélité</h1>
        <p className="text-muted-foreground mt-1">Gagnez des points et débloquez des avantages exclusifs</p>
      </div>

      {user && (
        <div className="bg-gradient-to-br from-primary/20 via-card to-card border border-primary/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Votre grade</p>
              <h2 className={`text-3xl font-display font-bold ${gradeColor(user.loyaltyGrade)}`}>
                {gradeLabel(user.loyaltyGrade)}
              </h2>
            </div>
            {(() => {
              const Icon = GRADE_ICONS[user.loyaltyGrade] || Trophy;
              return <Icon size={48} className={gradeColor(user.loyaltyGrade)} />;
            })()}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-semibold">{formatNumber(user.loyaltyPoints)} points</span>
              {nextGrade && <span className="text-muted-foreground">{formatNumber(nextThreshold!)} pour {gradeLabel(nextGrade)}</span>}
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-gold-light rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {grades.map((grade) => {
          const Icon = GRADE_ICONS[grade] || Trophy;
          const isActive = grade === user?.loyaltyGrade;
          const isAchieved = grades.indexOf(grade) <= currentGradeIndex;
          return (
            <div
              key={grade}
              className={`rounded-xl border p-4 text-center space-y-2 transition-all ${
                isActive
                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                  : isAchieved
                  ? 'border-border bg-card'
                  : 'border-border bg-card opacity-40'
              }`}
            >
              <Icon size={28} className={`mx-auto ${gradeColor(grade)}`} />
              <p className={`font-semibold text-sm ${gradeColor(grade)}`}>{gradeLabel(grade)}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(LOYALTY_THRESHOLDS[grade as LoyaltyGrade])} pts</p>
              <ul className="text-xs text-left space-y-1 mt-2">
                {GRADE_BENEFITS[grade]?.map((b) => (
                  <li key={b} className="text-muted-foreground flex items-center gap-1">
                    <span className="text-primary">•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Historique des points</h2>
          <div className="space-y-3">
            {history?.data?.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                <div>
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="font-bold text-primary">+{tx.points}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Classement</h2>
          <div className="space-y-3">
            {leaderboard?.map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg">
                <span className={`text-lg font-bold w-8 text-center ${i < 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.firstName} {u.lastName}</p>
                  <p className="text-xs text-muted-foreground">@{u.username}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{formatNumber(u.loyaltyPoints)}</p>
                  <p className={`text-xs font-medium ${gradeColor(u.loyaltyGrade)}`}>{gradeLabel(u.loyaltyGrade)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
