'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Image, Film, BookOpen, Sparkles } from 'lucide-react';
import { PostType } from '@edp/shared';
import { cn } from '@/lib/utils';

const POST_TYPES = [
  { value: PostType.PHOTO, label: 'Photo', icon: Image },
  { value: PostType.VIDEO, label: 'Vidéo', icon: Film },
  { value: PostType.REEL, label: 'Reel', icon: Film },
  { value: PostType.STORY, label: 'Story', icon: Sparkles },
];

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [postType, setPostType] = useState<PostType>(PostType.PHOTO);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted: File[]) => {
    setFiles((prev) => [...prev, ...accepted].slice(0, 10));
    accepted.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string].slice(0, 10));
      reader.readAsDataURL(f);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 10,
  });

  const removeFile = (i: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== i));
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!files.length) {
      toast({ variant: 'destructive', title: 'Ajoutez au moins un fichier' });
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('type', postType);
      form.append('caption', caption);
      if (location) form.append('location', location);
      files.forEach((f) => form.append('files', f));

      await api.post('/posts', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast({ title: 'Publication créée !', description: 'Votre post est en ligne.' });
      router.push('/feed');
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: err?.response?.data?.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold">Nouvelle publication</h1>
        <p className="text-muted-foreground text-sm mt-1">Partagez votre expérience</p>
      </div>

      <div className="flex gap-2">
        {POST_TYPES.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setPostType(value)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border',
              postType === value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50',
        )}
      >
        <input {...getInputProps()} />
        <Upload size={32} className="mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">
          {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez vos photos/vidéos ou cliquez'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4 • Max 10 fichiers</p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
              <img src={src} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium block mb-1.5">Légende</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Décrivez votre expérience... Utilisez #hashtags"
            rows={4}
            className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground mt-1">{caption.length} / 2200 caractères</p>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1.5">Lieu (optionnel)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Restaurant, ville..."
            className="w-full h-10 rounded-lg border border-input bg-secondary px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={loading || !files.length}
        >
          {loading ? 'Publication...' : 'Publier'}
        </Button>
      </div>
    </div>
  );
}
