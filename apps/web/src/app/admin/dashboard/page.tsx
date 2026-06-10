'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import { Users, Store, Star, Calendar, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((r) => r.data),
  });

  const { data: growth } = useQuery({
    queryKey: ['admin', 'growth'],
    queryFn: () => api.get('/admin/analytics/growth').then((r) => r.data),
  });

  const STAT_CARDS = [
    { label: 'Utilisateurs', value: stats?.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Établissements', value: stats?.totalEstablishments, icon: Store, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Avis', value: stats?.totalReviews, icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Réservations', value: stats?.totalReservations, icon: Calendar, color: 'text-green-400', bg: 'bg-green-400/10' },
    { label: 'Nouveaux utilisateurs (auj.)', value: stats?.newUsersToday, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { label: 'Publications', value: stats?.totalPosts, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
  ];

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground mt-1">Vue d'ensemble de la plateforme VEYA</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-xl p-5">
              <div className={`inline-flex p-2.5 rounded-lg ${card.bg} mb-3`}>
                <Icon size={20} className={card.color} />
              </div>
              <p className="text-2xl font-bold">{formatNumber(card.value || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold mb-6">Croissance utilisateurs (30 jours)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={growth || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
