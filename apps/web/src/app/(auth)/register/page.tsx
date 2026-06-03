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

const schema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName: z.string().min(2, 'Minimum 2 caractères'),
  username: z.string().min(3, 'Minimum 3 caractères').max(30).regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _ uniquement'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  isEstablishment: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading } = useAuthStore();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<'user' | 'establishment'>('user');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isEstablishment: false },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({ ...data, isEstablishment: accountType === 'establishment' });
      router.push('/feed');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: err?.response?.data?.message || 'Erreur lors de l\'inscription',
      });
    }
  };

  return (
    <div className="min-h-screen bg-edp-black flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-display font-bold gold-text">EDP</h1>
          <h2 className="text-2xl font-semibold mt-2">Créer un compte</h2>
          <p className="mt-2 text-muted-foreground text-sm">Rejoignez la communauté EDP</p>
        </div>

        <div className="flex rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => setAccountType('user')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${accountType === 'user' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Utilisateur
          </button>
          <button
            onClick={() => setAccountType('establishment')}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${accountType === 'establishment' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
          >
            Établissement
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input {...register('firstName')} placeholder="Jean" className="bg-secondary" />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input {...register('lastName')} placeholder="Dupont" className="bg-secondary" />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nom d'utilisateur</Label>
            <Input {...register('username')} placeholder="jean_dupont" className="bg-secondary" />
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input {...register('email')} type="email" placeholder="jean@exemple.com" className="bg-secondary" />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Mot de passe</Label>
            <Input {...register('password')} type="password" placeholder="••••••••" className="bg-secondary" />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
            disabled={isLoading}
          >
            {isLoading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
