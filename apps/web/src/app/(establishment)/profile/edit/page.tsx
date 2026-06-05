'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft, Store } from 'lucide-react';
import Link from 'next/link';
import { EstablishmentType, PriceRange } from '@edp/shared';

const schema = z.object({
  name:        z.string().min(2, 'Minimum 2 caractères'),
  description: z.string().max(2000).optional(),
  address:     z.string().min(5, 'Adresse requise'),
  city:        z.string().min(2, 'Ville requise'),
  country:     z.string().min(2, 'Pays requis'),
  phone:       z.string().optional(),
  email:       z.string().email('Email invalide').optional().or(z.literal('')),
  priceRange:  z.nativeEnum(PriceRange).optional(),
});
type FormValues = z.infer<typeof schema>;

const TYPE_LABELS: Record<string, string> = {
  RESTAURANT:   'Restaurant',
  BAR:          'Bar',
  HOTEL:        'Hôtel',
  CAFE:         'Café',
  TOURIST_SPOT: 'Lieu touristique',
};

const PRICE_RANGE_LABELS: Record<string, string> = {
  BUDGET:    '€ — Économique',
  MODERATE:  '€€ — Modéré',
  EXPENSIVE: '€€€ — Cher',
  LUXURY:    '€€€€ — Luxe',
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      <h2 className="font-heading font-semibold text-base">{title}</h2>
      {children}
    </section>
  );
}

export default function EstablishmentEditPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: est, isLoading } = useQuery({
    queryKey: ['my-establishment'],
    queryFn: () =>
      api.get('/establishments/search?limit=1').then((r) => r.data.data?.[0] ?? null),
    enabled: !!user,
  });

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (est) {
      reset({
        name:        est.name ?? '',
        description: est.description ?? '',
        address:     est.address ?? '',
        city:        est.city ?? '',
        country:     est.country ?? '',
        phone:       est.phone ?? '',
        email:       est.email ?? '',
        priceRange:  est.priceRange,
      });
    }
  }, [est, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) => api.patch(`/establishments/${est.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-establishment'] });
      toast({ title: 'Profil mis à jour', description: 'Vos modifications ont été enregistrées.' });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le profil.', variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  if (!est) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
        <Store size={48} className="text-muted-foreground" />
        <p className="text-muted-foreground text-center">Vous n'avez pas encore d'établissement enregistré.</p>
        <Button asChild>
          <Link href="/establishment/new">Créer un établissement</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          href="/establishment/dashboard"
          className="p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Retour au tableau de bord"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-xl">Modifier le profil</h1>
          <p className="text-sm text-muted-foreground">
            {TYPE_LABELS[est.type] ?? est.type} · {est.city}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
        {/* Informations principales */}
        <Section title="Informations principales">
          <FieldRow label="Nom de l'établissement">
            <Input {...register('name')} placeholder="Le Grand Bistrot" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </FieldRow>

          <FieldRow label="Description">
            <textarea
              {...register('description')}
              rows={4}
              placeholder="Décrivez votre établissement, son ambiance, sa cuisine..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </FieldRow>

          <FieldRow label="Gamme de prix">
            <select
              {...register('priceRange')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Non renseignée</option>
              {Object.entries(PRICE_RANGE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FieldRow>
        </Section>

        {/* Localisation */}
        <Section title="Localisation">
          <FieldRow label="Adresse">
            <Input {...register('address')} placeholder="12 rue de Rivoli" />
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
          </FieldRow>

          <div className="grid grid-cols-2 gap-3">
            <FieldRow label="Ville">
              <Input {...register('city')} placeholder="Paris" />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </FieldRow>

            <FieldRow label="Pays">
              <Input {...register('country')} placeholder="France" />
              {errors.country && <p className="text-xs text-destructive">{errors.country.message}</p>}
            </FieldRow>
          </div>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <FieldRow label="Téléphone">
            <Input {...register('phone')} type="tel" placeholder="+33 1 23 45 67 89" />
          </FieldRow>

          <FieldRow label="Email">
            <Input {...register('email')} type="email" placeholder="contact@monresto.fr" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </FieldRow>
        </Section>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={!isDirty || mutation.isPending}
        >
          {mutation.isPending ? (
            <><Loader2 className="animate-spin mr-2" size={16} /> Enregistrement...</>
          ) : (
            'Enregistrer les modifications'
          )}
        </Button>
      </form>
    </div>
  );
}
