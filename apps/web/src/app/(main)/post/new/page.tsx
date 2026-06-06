'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ImagePlus, X, MapPin, Loader2, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { PostType } from '@edp/shared';
import { cn } from '@/lib/utils';

type Step = 'media' | 'details' | 'confirm';
type PublishState = 'idle' | 'loading' | 'success' | 'error';

const POST_TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: PostType.PHOTO, label: 'Publication' },
  { value: PostType.REEL, label: 'Reel' },
  { value: PostType.STORY, label: 'Story' },
];

const MAX_CAPTION = 2200;

export default function NewPostPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>('media');
  const [postType, setPostType] = useState<PostType>(PostType.PHOTO);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [publishState, setPublishState] = useState<PublishState>('idle');

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [], 'video/*': [] },
    maxFiles: 1,
  });

  const removeFile = () => { setFile(null); setPreview(null); };

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) setHashtags((prev) => [...prev, tag]);
    setHashtagInput('');
  };

  const removeHashtag = (tag: string) => setHashtags((prev) => prev.filter((h) => h !== tag));

  const handleHashtagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); addHashtag(); }
  };

  const handlePublish = async () => {
    if (!file) return;
    setStep('confirm');
    setPublishState('loading');
    try {
      const form = new FormData();
      form.append('files', file);
      form.append('caption', caption);
      form.append('type', postType);
      if (location) form.append('location', location);
      hashtags.forEach((h) => form.append('hashtags', h));
      await api.post('/posts', form);
      setPublishState('success');
    } catch (err) {
      setPublishState('error');
      toast({ variant: 'destructive', title: 'Erreur de publication' });
    }
  };

  return (
    <div className="max-w-screen-sm mx-auto px-4 py-8">
      {step === 'media' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Nouvelle publication</h1>
            <p className="text-muted-foreground text-sm mt-1">Partagez votre expérience</p>
          </div>

          <div className="flex gap-2">
            {POST_TYPE_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPostType(value)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium border transition-colors',
                  postType === value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {!preview ? (
            <div
              {...getRootProps()}
              className={cn(
                'flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl py-16 cursor-pointer transition-colors',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
              )}
            >
              <input {...getInputProps()} />
              <ImagePlus size={48} className="text-muted-foreground" aria-hidden="true" />
              <p className="text-sm font-medium text-center">
                {isDragActive ? 'Déposez vos fichiers ici' : 'Glissez une photo ou vidéo ici'}
              </p>
              <Button type="button" variant="outline" size="sm">
                Choisir depuis la galerie
              </Button>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden aspect-square bg-muted">
              <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
              <button
                onClick={removeFile}
                className="absolute top-3 right-3 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 transition-colors"
                aria-label="Supprimer le fichier"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          )}

          {preview && (
            <Button className="w-full" onClick={() => setStep('details')}>
              Suivant
            </Button>
          )}
        </div>
      )}

      {step === 'details' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-heading font-bold">Détails</h1>
            <p className="text-muted-foreground text-sm mt-1">Ajoutez une description et un lieu</p>
          </div>

          <div className="flex gap-4 items-start">
            {preview && (
              <div className="w-[120px] h-[120px] flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                <img src={preview} alt="Aperçu miniature" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-3">
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, MAX_CAPTION))}
                  placeholder="Décrivez votre expérience..."
                  style={{ minHeight: '120px' }}
                  className="w-full rounded-lg border border-input bg-secondary px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Légende"
                />
                <p className="text-xs text-muted-foreground mt-1 text-right tabular-nums">
                  {caption.length} / {MAX_CAPTION}
                </p>
              </div>

              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" aria-hidden="true" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ajouter un lieu"
                  aria-label="Lieu"
                  className="w-full h-10 rounded-lg border border-input bg-secondary pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
          </div>

          <div>
            <input
              value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleHashtagKeyDown}
              onBlur={addHashtag}
              placeholder="#hashtag — Entrée pour ajouter"
              aria-label="Ajouter des hashtags"
              className="w-full h-10 rounded-lg border border-input bg-secondary px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {hashtags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} aria-label={`Supprimer #${tag}`} className="hover:opacity-70">
                      <X size={12} aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep('media')}>
              Retour
            </Button>
            <Button className="flex-1" onClick={handlePublish}>
              Publier
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="flex flex-col items-center justify-center gap-6 py-24">
          {publishState === 'loading' && (
            <>
              <Loader2 size={48} className="text-primary animate-spin" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">Publication en cours...</p>
            </>
          )}
          {publishState === 'success' && (
            <>
              <CheckCircle2 size={48} className="text-primary" aria-hidden="true" />
              <p className="text-lg font-heading font-semibold">Publié !</p>
              <button
                className="text-primary text-sm font-medium hover:underline"
                onClick={() => router.push('/feed')}
              >
                Voir votre post →
              </button>
            </>
          )}
          {publishState === 'error' && (
            <>
              <AlertCircle size={48} className="text-destructive" aria-hidden="true" />
              <p className="text-sm font-medium text-muted-foreground">Une erreur est survenue.</p>
              <Button onClick={() => { setStep('details'); setPublishState('idle'); }}>
                Réessayer
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
