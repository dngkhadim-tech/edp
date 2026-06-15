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
import { Camera, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Minimum 2 caractères'),
  lastName:  z.string().min(2, 'Minimum 2 caractères'),
  username:  z.string().min(3).max(30).regex(/^[a-z0-9_]+$/, 'Lettres minuscules, chiffres et _'),
  bio:       z.string().max(500).optional(),
  city:      z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-heading font-semibold mb-4">{children}</h2>;
}

function SettingsSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-card border border-border rounded-xl p-5 space-y-4">
      {children}
    </section>
  );
}

function NotifRow({
  label, checked, onCheckedChange,
}: { label: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export default function SettingsPage() {
  const { user, fetchMe, logout } = useAuthStore();
  const { toast } = useToast();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [notifs, setNotifs] = useState({
    likes: true, comments: true, followers: true, reservations: true,
  });
  const [privateAccount, setPrivateAccount] = useState(false);

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName:  user?.lastName  ?? '',
      username:  user?.username  ?? '',
      bio:       user?.bio       ?? '',
      city:      user?.city      ?? '',
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      await api.patch('/users/me', data);
      await fetchMe();
      toast({ title: 'Profil mis à jour' });
    } catch {
      toast({ variant: 'destructive', title: 'Erreur lors de la mise à jour' });
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
      await api.patch('/users/me/avatar', form);
      await fetchMe();
      toast({ title: 'Photo de profil mise à jour' });
    } catch {
      toast({ variant: 'destructive', title: "Erreur lors de l'upload" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Cette action est irréversible. Votre compte et toutes vos données seront supprimés. Continuer ?')) return;
    setDeleting(true);
    try {
      await api.delete('/users/me');
      logout();
      router.push('/');
    } catch {
      toast({ variant: 'destructive', title: 'Impossible de supprimer le compte' });
    } finally {
      setDeleting(false);
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
              aria-label="Changer la photo de profil"
              className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1.5 hover:bg-primary/90 transition-colors shadow"
            >
              <Camera size={13} aria-hidden="true" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Prénom</Label>
              <Input {...register('firstName')} className="bg-secondary" />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input {...register('lastName')} className="bg-secondary" />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nom d'utilisateur</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input {...register('username')} className="bg-secondary pl-7" />
            </div>
            {errors.username && <p className="text-xs text-destructive">{errors.username.message}</p>}
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
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </form>
      </SettingsSection>

      {/* Compte */}
      <SettingsSection>
        <SectionTitle>Compte</SectionTitle>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input
            value={user.email}
            readOnly
            className="bg-secondary text-muted-foreground cursor-not-allowed"
            aria-label="Email (lecture seule)"
          />
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/forgot-password')}
        >
          Changer le mot de passe
        </Button>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection>
        <SectionTitle>Notifications</SectionTitle>
        <NotifRow label="Likes" checked={notifs.likes} onCheckedChange={(v) => setNotifs((n) => ({ ...n, likes: v }))} />
        <NotifRow label="Commentaires" checked={notifs.comments} onCheckedChange={(v) => setNotifs((n) => ({ ...n, comments: v }))} />
        <NotifRow label="Nouveaux abonnés" checked={notifs.followers} onCheckedChange={(v) => setNotifs((n) => ({ ...n, followers: v }))} />
        <NotifRow label="Réservations" checked={notifs.reservations} onCheckedChange={(v) => setNotifs((n) => ({ ...n, reservations: v }))} />
      </SettingsSection>

      {/* Confidentialité */}
      <SettingsSection>
        <SectionTitle>Confidentialité</SectionTitle>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Compte privé</p>
            <p className="text-xs text-muted-foreground">Seuls vos abonnés peuvent voir vos publications</p>
          </div>
          <Switch checked={privateAccount} onCheckedChange={setPrivateAccount} aria-label="Compte privé" />
        </div>
      </SettingsSection>

      {/* Danger */}
      <SettingsSection>
        <SectionTitle>Danger</SectionTitle>
        <p className="text-sm text-muted-foreground">Ces actions sont irréversibles.</p>
        <Button
          variant="outline"
          className="border-destructive/30 text-destructive hover:bg-destructive/10 w-full"
          disabled={deleting}
          onClick={handleDeleteAccount}
        >
          {deleting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
          Supprimer mon compte
        </Button>
      </SettingsSection>
    </div>
  );
}
