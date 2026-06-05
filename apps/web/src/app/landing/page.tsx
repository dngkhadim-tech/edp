import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, BookOpen, Trophy, Camera, MessageCircle, Shield, Zap, Globe } from 'lucide-react';

const STATS = [
  { value: '50K+', label: 'Établissements' },
  { value: '2M+', label: 'Utilisateurs' },
  { value: '10M+', label: 'Avis publiés' },
  { value: '4.8★', label: 'Note moyenne' },
];

const FEATURES = [
  {
    icon: Camera,
    title: 'Réseau Social Gastronomique',
    desc: 'Partagez photos, vidéos et stories de vos expériences culinaires. Suivez vos restaurants favoris et découvrez les tendances.',
  },
  {
    icon: BookOpen,
    title: 'Réservation Instantanée',
    desc: 'Réservez directement depuis l\'app en quelques secondes. Restaurants, hôtels, expériences — tout en un seul endroit.',
  },
  {
    icon: Star,
    title: 'Avis Authentifiés',
    desc: 'Consultez des millions d\'avis vérifiés de vrais clients. Notes détaillées, photos et réponses des établissements.',
  },
  {
    icon: Trophy,
    title: 'Programme de Fidélité',
    desc: 'Gagnez des points à chaque action. Bronze, Silver, Gold, Platinum, Diamond — débloquez des avantages exclusifs.',
  },
  {
    icon: MapPin,
    title: 'Carte Interactive',
    desc: 'Explorez les meilleurs établissements autour de vous. Filtrez par type, note, prix et disponibilité.',
  },
  {
    icon: MessageCircle,
    title: 'Chat Intégré',
    desc: 'Discutez directement avec les établissements ou d\'autres foodlovers. Partagez vos bonnes adresses.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Sophie Martin',
    grade: 'Platinum',
    avatar: 'https://i.pravatar.cc/80?img=1',
    text: 'EDP a complètement changé ma façon de découvrir les restaurants. Je ne peux plus m\'en passer !',
    city: 'Paris',
  },
  {
    name: 'Thomas Bernard',
    grade: 'Gold',
    avatar: 'https://i.pravatar.cc/80?img=3',
    text: 'La réservation en 2 clics et les avis vérifiés, c\'est exactement ce qu\'il me fallait.',
    city: 'Lyon',
  },
  {
    name: 'Claire Dubois',
    grade: 'Silver',
    avatar: 'https://i.pravatar.cc/80?img=5',
    text: 'Le programme de fidélité est addictif ! J\'ai déjà accumulé des milliers de points.',
    city: 'Nice',
  },
];

const ESTABLISHMENTS = [
  { name: 'Le Cinq', type: 'Restaurant', city: 'Paris', rating: 4.9, img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400' },
  { name: 'Hôtel Costes', type: 'Hôtel', city: 'Paris', rating: 4.6, img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400' },
  { name: 'Bambou Bar', type: 'Bar', city: 'Paris', rating: 4.4, img: 'https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=400' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-amber-400">EDP</span>
            <span className="text-xs text-muted-foreground hidden sm:block">Eat • Drink • Pose</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalités</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Témoignages</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10" />
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920')" }}
          />
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 text-sm text-primary mb-8">
            <Zap size={14} />
            Nouveau — Reels gastronomiques disponibles
          </div>

          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-tight mb-6">
            <span className="text-amber-400">Eat.</span> <span className="text-amber-400">Drink.</span>{' '}
            <span className="text-amber-400">Pose.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-4 font-light">
            Le réseau social de la gastronomie.
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
            Partagez vos expériences, découvrez les meilleurs établissements,
            réservez en un clic et gagnez des récompenses exclusives.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary text-primary-foreground font-bold text-lg px-8 py-4 rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-lg shadow-primary/30"
            >
              Rejoindre gratuitement
            </Link>
            <Link
              href="/explore"
              className="border border-white/20 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-white/10 transition-all"
            >
              Explorer les établissements
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 max-w-4xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-amber-400">{s.value}</p>
                <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Établissements en vedette */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Établissements d'exception</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Les meilleures adresses sélectionnées par notre communauté</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ESTABLISHMENTS.map((est) => (
              <div key={est.name} className="group rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-primary/10">
                <div className="relative h-48 overflow-hidden">
                  <Image src={est.img} alt={est.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                    <Star size={14} className="fill-primary text-primary" />
                    <span className="text-white font-bold text-sm">{est.rating}</span>
                  </div>
                  <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    {est.type}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{est.name}</h3>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin size={12} />
                    {est.city}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/explore" className="text-primary hover:underline font-medium">
              Voir tous les établissements →
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 bg-card/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Une plateforme complète qui réunit Instagram, TripAdvisor et Booking en une seule app</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section id="testimonials" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ce qu'ils disent</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Image src={t.avatar} alt={t.name} width={48} height={48} className="rounded-full" />
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-primary">{t.grade} • {t.city}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className="fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed italic">"{t.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-4 bg-card/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Simple et transparent</h2>
          <p className="text-muted-foreground mb-16">Pour les utilisateurs, c'est gratuit. Pour les établissements, un seul abonnement.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-2xl p-8 text-left">
              <h3 className="font-semibold text-xl mb-2">Utilisateur</h3>
              <div className="text-4xl font-bold mb-6">Gratuit <span className="text-base font-normal text-muted-foreground">pour toujours</span></div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {['Feed personnalisé', 'Avis et notes', 'Réservations', 'Programme fidélité', 'Chat', 'Carte interactive'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="mt-8 block text-center border border-primary text-primary font-semibold py-3 rounded-xl hover:bg-primary/10 transition-colors">
                Créer mon compte
              </Link>
            </div>

            <div className="bg-gradient-to-br from-primary/20 to-card border border-primary/40 rounded-2xl p-8 text-left relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                POPULAIRE
              </div>
              <h3 className="font-semibold text-xl mb-2">Établissement Premium</h3>
              <div className="text-4xl font-bold mb-1">99€ <span className="text-base font-normal text-muted-foreground">/ mois</span></div>
              <p className="text-xs text-muted-foreground mb-6">Sans engagement</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {['Profil vérifié ✓', 'Mise en avant dans le feed', 'Statistiques avancées', 'Réservations illimitées', 'Promotions ciblées', 'Support prioritaire'].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-primary font-bold">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register?type=establishment" className="mt-8 block text-center bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:bg-primary/90 transition-colors">
                Essai gratuit 14 jours
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            Prêt à rejoindre<br />
            <span className="text-amber-400">la table ?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Des milliers de foodies vous attendent sur EDP.
          </p>
          <Link
            href="/register"
            className="bg-primary text-primary-foreground font-bold text-xl px-10 py-5 rounded-xl hover:bg-primary/90 transition-all hover:scale-105 shadow-2xl shadow-primary/30 inline-block"
          >
            Commencer maintenant — Gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="font-heading font-bold text-amber-400 text-xl mb-4">EDP</h4>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Partagez vos expériences, réservez vos moments.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/explore" className="hover:text-white">Explorer</Link></li>
                <li><Link href="/map" className="hover:text-white">Carte</Link></li>
                <li><Link href="/reels" className="hover:text-white">Reels</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Établissements</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/register?type=establishment" className="hover:text-white">Créer un profil</Link></li>
                <li><Link href="#pricing" className="hover:text-white">Tarifs</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Légal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-white">CGU</a></li>
                <li><a href="#" className="hover:text-white">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">© 2024 EDP – Eat • Drink • Pose. Tous droits réservés.</p>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield size={14} className="text-primary" />
              RGPD conforme
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
