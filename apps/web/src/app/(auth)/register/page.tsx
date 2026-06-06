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
  lastName:  z.string().min(2, 'Minimum 2 caractères'),
  username:  z.string().min(3, 'Minimum 3 caractères').max(30).regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _ uniquement'),
  email:     z.string().email('Email invalide'),
  password:  z.string().min(8, 'Minimum 8 caractères'),
});
type FormData = z.infer<typeof schema>;

function getPasswordStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const STRENGTH_COLOR: Record<number, string> = {
  0: 'bg-border', 1: 'bg-destructive', 2: 'bg-orange-400', 3: 'bg-yellow-400', 4: 'bg-success',
};

function StrengthBars({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  return (
    <div className="flex gap-1 mt-2" role="img" aria-label={`Force du mot de passe: ${['', 'faible', 'moyen', 'fort', 'très fort'][strength]}`}>
      {[1, 2, 3, 4].map((lvl) => (
        <div key={lvl} className={cn('h-1 flex-1 rounded-full transition-colors duration-200', strength >= lvl ? STRENGTH_COLOR[strength] : 'bg-border')} />
      ))}
    </div>
  );
}

type AccountType = 'user' | 'establishment';

function TypeCard({ type, selected, onSelect }: { type: AccountType; selected: boolean; onSelect: () => void }) {
  const Icon = type === 'user' ? User : Building2;
  const label = type === 'user' ? 'Utilisateur' : 'Établissement';
  const desc  = type === 'user' ? 'Découvrez et partagez vos expériences' : 'Gérez votre établissement et vos réservations';

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex-1 flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all',
        selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40',
      )}
    >
      <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="text-center">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
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

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser({ ...data, isEstablishment: accountType === 'establishment' });
      window.location.replace('/feed');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: typeof msg === 'string' ? msg : "Erreur lors de l'inscription",
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
                <TypeCard type="user"          selected={accountType === 'user'}          onSelect={() => setAccountType('user')} />
                <TypeCard type="establishment" selected={accountType === 'establishment'} onSelect={() => setAccountType('establishment')} />
              </div>
              <Button className="w-full h-12" onClick={() => setStep(2)}>Continuer</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
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
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <Input {...register('username')} placeholder="jean_dupont" className="bg-secondary pl-7" />
                </div>
                {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input {...register('email')} type="email" placeholder="jean@exemple.com" className="bg-secondary" />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
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
                    {showPass ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
                {passwordValue && <StrengthBars password={passwordValue} />}
                {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>Retour</Button>
                <Button type="submit" className="flex-1 h-12 bg-primary text-primary-foreground hover:bg-primary/90" disabled={isLoading}>
                  {isLoading ? 'Création...' : 'Créer mon compte'}
                </Button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
