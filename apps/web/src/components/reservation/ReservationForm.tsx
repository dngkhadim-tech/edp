'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { EstablishmentType, ReservationType } from '@edp/shared';
import { CalendarIcon, Users, Clock } from 'lucide-react';

const restaurantSchema = z.object({
  date: z.string().min(1, 'Date requise'),
  time: z.string().min(1, 'Heure requise'),
  partySize: z.coerce.number().min(1).max(20),
  specialRequests: z.string().optional(),
});

const hotelSchema = z.object({
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.coerce.number().min(1),
  children: z.coerce.number().min(0).default(0),
  specialRequests: z.string().optional(),
});

interface ReservationEstablishment {
  id: string;
  name: string;
  type: string;
}

interface ReservationFormData {
  date?: string;
  time?: string;
  partySize?: number;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  children?: number;
  specialRequests?: string;
}

interface Props {
  establishment: ReservationEstablishment;
  onClose: () => void;
}

export function ReservationForm({ establishment, onClose }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isHotel = establishment.type === EstablishmentType.HOTEL;

  const schema = isHotel ? hotelSchema : restaurantSchema;
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: ReservationFormData) => {
    setLoading(true);
    try {
      await api.post('/reservations', {
        establishmentId: establishment.id,
        type: isHotel ? ReservationType.HOTEL : ReservationType.RESTAURANT,
        details: data,
      });
      toast({ title: 'Réservation envoyée', description: 'Vous serez notifié de la confirmation.' });
      onClose();
    } catch {
      toast({ variant: 'destructive', title: 'Erreur', description: 'Une erreur est survenue.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Réserver chez {establishment.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {isHotel ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Arrivée</Label>
                  <Input type="date" {...register('checkIn')} className="bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <Label>Départ</Label>
                  <Input type="date" {...register('checkOut')} className="bg-secondary" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Adultes</Label>
                  <Input type="number" min="1" {...register('adults')} defaultValue="2" className="bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <Label>Enfants</Label>
                  <Input type="number" min="0" {...register('children')} defaultValue="0" className="bg-secondary" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" {...register('date')} className="bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <Label>Heure</Label>
                  <Input type="time" {...register('time')} className="bg-secondary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Nombre de personnes</Label>
                <Input type="number" min="1" max="20" {...register('partySize')} defaultValue="2" className="bg-secondary" />
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Demandes spéciales (optionnel)</Label>
            <Input {...register('specialRequests')} placeholder="Allergies, occasion spéciale..." className="bg-secondary" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Envoi...' : 'Confirmer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
