const pg = require('pg');
const bcrypt = require('bcryptjs');

const DB_URL = 'postgresql://edp_user:edp_password@localhost:5432/edp_db';

function makeSlug(name, city) {
  return (name + '-' + city).toLowerCase()
    .replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/[ç]/g, 'c')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').substring(0, 60);
}

const ESTABLISHMENTS = [
  { name: 'Le Cinq', type: 'RESTAURANT', city: 'Paris', country: 'France',
    address: '31 Avenue George V, 75008', lat: 48.8694, lng: 2.3008,
    desc: 'Restaurant gastronomique 3 etoiles Michelin au Four Seasons George V. Une experience culinaire d exception.',
    cuisine: ['Française', 'Gastronomique'], priceRange: 'LUXURY', rating: 4.9, reviews: 342 },
  { name: 'Septime', type: 'RESTAURANT', city: 'Paris', country: 'France',
    address: '80 Rue de Charonne, 75011', lat: 48.8542, lng: 2.3786,
    desc: 'Bistrot contemporain de Bertrand Grebaut. Cuisine bistronomique creative avec produits locaux.',
    cuisine: ['Française', 'Bistronomie'], priceRange: 'EXPENSIVE', rating: 4.7, reviews: 891 },
  { name: 'Hotel Plaza Athenee', type: 'HOTEL', city: 'Paris', country: 'France',
    address: '25 Avenue Montaigne, 75008', lat: 48.8669, lng: 2.3013,
    desc: 'Palace iconique sur Avenue Montaigne. Vue Tour Eiffel, spa Dior Beauty, restaurant Ducasse.',
    amenities: ['Spa Dior', 'Piscine', 'Restaurant étoilé', 'Concierge 24h', 'WiFi'],
    priceRange: 'LUXURY', rating: 4.8, reviews: 1203 },
  { name: 'Bambou Bar', type: 'BAR', city: 'Paris', country: 'France',
    address: '23 Rue des Jeuneures, 75002', lat: 48.8686, lng: 2.3464,
    desc: 'Bar tropical chic au coeur de Paris. Cocktails exotiques, jungle urbaine, musique live.',
    priceRange: 'MODERATE', rating: 4.4, reviews: 567 },
  { name: "L'Ami Jean", type: 'RESTAURANT', city: 'Paris', country: 'France',
    address: '27 Rue Malar, 75007', lat: 48.8608, lng: 2.3034,
    desc: 'Bistrot basque parisien legendaire. Cuisine généreuse, riz au lait mythique.',
    cuisine: ['Basque', 'Française'], priceRange: 'MODERATE', rating: 4.6, reviews: 2341 },
  { name: 'Nobu Paris', type: 'RESTAURANT', city: 'Paris', country: 'France',
    address: '15 Place Vendome, 75001', lat: 48.8677, lng: 2.3293,
    desc: 'Cuisine japonaise-peruvienne de Nobu Matsuhisa. Black cod mythique, decor luxueux.',
    cuisine: ['Japonaise', 'Péruvienne', 'Fusion'], priceRange: 'LUXURY', rating: 4.5, reviews: 789 },
  { name: 'Bouillon Pigalle', type: 'RESTAURANT', city: 'Paris', country: 'France',
    address: '22 Boulevard de Clichy, 75018', lat: 48.8843, lng: 2.3348,
    desc: 'Bouillon populaire modernisé. Cuisine française authentique à prix démocratiques.',
    cuisine: ['Française', 'Brasserie'], priceRange: 'BUDGET', rating: 4.3, reviews: 3421 },
  { name: 'Perruche Rooftop', type: 'BAR', city: 'Paris', country: 'France',
    address: '52 Rue de Provence, 75009', lat: 48.8753, lng: 2.3349,
    desc: 'Rooftop bar Printemps Haussmann. Vue panoramique Paris, cocktails créatifs, DJ sets.',
    priceRange: 'EXPENSIVE', rating: 4.5, reviews: 1876 },
  { name: 'Hotel Costes', type: 'HOTEL', city: 'Paris', country: 'France',
    address: '239 Rue Saint-Honore, 75001', lat: 48.8655, lng: 2.3306,
    desc: 'Hotel boutique ultra-chic. Piscine interieure, ambiance musicale signature, brunch legendaire.',
    amenities: ['Piscine intérieure', 'Spa', 'Restaurant', 'Bar', 'WiFi'],
    priceRange: 'LUXURY', rating: 4.6, reviews: 934 },
  { name: 'Paul Bocuse Auberge', type: 'RESTAURANT', city: 'Lyon', country: 'France',
    address: '40 Rue de la Plage, 69660 Collonges-au-Mont-dOr', lat: 45.8359, lng: 4.8284,
    desc: 'Institution gastronomie française. 3 étoiles Michelin depuis 1965, temple cuisine lyonnaise.',
    cuisine: ['Lyonnaise', 'Gastronomique'], priceRange: 'LUXURY', rating: 4.9, reviews: 2108 },
  { name: 'InterContinental Lyon', type: 'HOTEL', city: 'Lyon', country: 'France',
    address: '20 Quai Jules Courmont, 69002 Lyon', lat: 45.7568, lng: 4.8294,
    desc: 'Palace 5 etoiles dans ancien Hotel-Dieu classé monument historique, au bord du Rhône.',
    amenities: ['Spa', 'Piscine', 'Restaurant gastronomique', 'Bar', 'Fitness'],
    priceRange: 'LUXURY', rating: 4.7, reviews: 1456 },
  { name: 'La Chevre dOr', type: 'HOTEL', city: 'Eze', country: 'France',
    address: 'Rue du Barri, 06360 Eze', lat: 43.7279, lng: 7.3613,
    desc: 'Hotel perche sur les hauteurs d Eze. Vue Mediterranee imprenable, restaurant étoilé.',
    amenities: ['Piscine à débordement', 'Spa', 'Restaurant étoilé', 'Vue mer', 'Terrasse'],
    priceRange: 'LUXURY', rating: 4.8, reviews: 876 },
  { name: 'Cafe de Flore', type: 'CAFE', city: 'Paris', country: 'France',
    address: '172 Boulevard Saint-Germain, 75006', lat: 48.8540, lng: 2.3334,
    desc: 'Cafe historique Saint-Germain-des-Pres depuis 1887. Lieu de rencontre artistes et intellectuels.',
    priceRange: 'MODERATE', rating: 4.2, reviews: 5678 },
  { name: 'Tour Eiffel Brasserie', type: 'RESTAURANT', city: 'Paris', country: 'France',
    address: 'Champ de Mars, 75007', lat: 48.8584, lng: 2.2945,
    desc: 'Brasserie au pied de la Tour Eiffel. Vue emblematique, cuisine française traditionnelle.',
    cuisine: ['Française', 'Brasserie'], priceRange: 'EXPENSIVE', rating: 4.1, reviews: 8234 },
];

async function run() {
  const client = new pg.Client({ connectionString: DB_URL });
  await client.connect();
  console.log('Connexion PostgreSQL OK');

  const adminRes = await client.query("SELECT id FROM users WHERE email = 'admin@edp.app' LIMIT 1");
  if (!adminRes.rows[0]) { console.error('Admin not found'); await client.end(); return; }
  const adminId = adminRes.rows[0].id;

  // Create test users
  const userPass = bcrypt.hashSync('Test@1234', 12);
  const testUsers = [
    { email: 'sophie@edp.app', username: 'sophie_foodie', fn: 'Sophie', ln: 'Martin', bio: 'Food blogger & travel enthusiast', city: 'Paris', pts: 8500, grade: 'PLATINUM' },
    { email: 'thomas@edp.app', username: 'thomas_explore', fn: 'Thomas', ln: 'Bernard', bio: 'Amateur de bonne cuisine et vins', city: 'Lyon', pts: 2300, grade: 'GOLD' },
    { email: 'claire@edp.app', username: 'claire_voyage', fn: 'Claire', ln: 'Dubois', bio: 'Passionnee de voyages et decouverte culinaires', city: 'Nice', pts: 620, grade: 'SILVER' },
    { email: 'marc@edp.app', username: 'marc_gourmet', fn: 'Marc', ln: 'Fontaine', bio: 'Chef amateur | Gastronome | Paris', city: 'Paris', pts: 55000, grade: 'DIAMOND' },
    { email: 'lea@edp.app', username: 'lea_paris', fn: 'Lea', ln: 'Rousseau', bio: 'Parisienne gourmande', city: 'Paris', pts: 150, grade: 'BRONZE' },
  ];

  const userIds = {};
  for (const u of testUsers) {
    const r = await client.query(
      "INSERT INTO users (email,username,first_name,last_name,password,role,email_verified,bio,city,country,loyalty_points,loyalty_grade,followers_count,following_count,posts_count) VALUES ($1,$2,$3,$4,$5,'USER',true,$6,$7,'France',$8,$9,$10,$11,$12) ON CONFLICT (email) DO UPDATE SET loyalty_points=EXCLUDED.loyalty_points,loyalty_grade=EXCLUDED.loyalty_grade RETURNING id",
      [u.email, u.username, u.fn, u.ln, userPass, u.bio, u.city, u.pts, u.grade,
       Math.floor(Math.random()*500+10), Math.floor(Math.random()*200+5), Math.floor(Math.random()*50+2)]
    );
    userIds[u.username] = r.rows[0].id;
    process.stdout.write('U');
  }
  console.log('\n  Utilisateurs:', Object.keys(userIds).length);

  // Create establishments
  const estIds = {};
  for (const est of ESTABLISHMENTS) {
    const s = makeSlug(est.name, est.city);
    const r = await client.query(
      "INSERT INTO establishments (user_id,name,slug,type,description,address,city,country,latitude,longitude,cuisine,amenities,price_range,average_rating,reviews_count,followers_count,is_verified,is_premium) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,true,$17) ON CONFLICT (slug) DO UPDATE SET average_rating=EXCLUDED.average_rating RETURNING id",
      [adminId, est.name, s, est.type, est.desc, est.address, est.city, est.country,
       est.lat, est.lng, JSON.stringify(est.cuisine||[]), JSON.stringify(est.amenities||[]),
       est.priceRange, est.rating, est.reviews, Math.floor(Math.random()*3000+100),
       est.priceRange === 'LUXURY']
    );
    estIds[est.name] = r.rows[0].id;
    process.stdout.write('E');
  }
  console.log('\n  Etablissements:', Object.keys(estIds).length);

  // Create reviews
  const revTexts = [
    [5, 'Experience absolument magique', 'Un repas inoubliable. La cuisine est d une precision remarquable. Le service parfait, discret et attentionné. Je recommande vivement a tous les amateurs de gastronomie.'],
    [5, 'Le meilleur restaurant', 'Nous y sommes alles pour notre anniversaire et ce fut une soiree parfaite. Les saveurs sont intenses, les presentations artistiques, l equipe en salle absolument charmante.'],
    [4, 'Tres bonne experience', 'Excellent rapport qualite-prix, cuisine fraiche et bien executee. Le service etait un peu lent mais les plats valaient l attente. J y retournerai.'],
    [4, 'Solide et fiable', 'Comme toujours, une belle soiree. La carte a evolue et les nouveaux plats sont tres reussis. Mention speciale pour le dessert.'],
    [3, 'Bien mais peut mieux faire', 'L endroit est beau, l ambiance agreable, mais la cuisine manquait un peu de personnalite ce soir-la.'],
    [5, 'Incontournable !', 'Si vous ne deviez faire qu un seul restaurant lors de votre visite, choisissez celui-ci. La carte est imaginative, les produits d une fraicheur irreprochable.'],
  ];

  const usedPairs = new Set();
  let rCount = 0;
  const userArr = Object.values(userIds);
  for (const estId of Object.values(estIds)) {
    for (let i = 0; i < 3 && i < userArr.length; i++) {
      const uid = userArr[(rCount + i) % userArr.length];
      const key = uid + ':' + estId;
      if (usedPairs.has(key)) continue;
      usedPairs.add(key);
      const [rating, title, content] = revTexts[rCount % revTexts.length];
      const exists = await client.query('SELECT id FROM reviews WHERE user_id=$1 AND establishment_id=$2', [uid, estId]);
      if (exists.rows.length === 0) {
        await client.query(
          "INSERT INTO reviews (user_id,establishment_id,rating,title,content,is_verified,helpful_count) VALUES ($1,$2,$3,$4,$5,true,$6)",
          [uid, estId, rating, title, content, Math.floor(Math.random()*50)]
        );
      }
      rCount++;
      process.stdout.write('R');
    }
  }
  console.log('\n  Reviews:', rCount);

  // Create posts with Unsplash images
  const imgUrls = [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800',
  ];
  const captions = [
    'Soiree inoubliable dans ce restaurant exceptionnel #gastronomie #paris #foodlover',
    'Le dessert du chef... une pure merveille ! #patisserie #gourmand #foodporn',
    'Ambiance parfaite, service irreprochable, cuisine sublime #restaurant #experience',
    'Weekend gastronomique a Paris. Chaque repas est une decouverte #foodtrip #paris',
    'Ce plat est une oeuvre d art. La gastronomie francaise a son meilleur #michelin #chef',
    'Diner romantique avec une vue imprenable sur la ville #romantic #paris #dinner',
    'Les produits de saison sublimes par un chef talentueux #local #seasonal #fresh',
    'Reservez absolument cette adresse incontournable ! #edprecommendation #restaurant',
  ];
  const estArr = Object.values(estIds);
  for (let i = 0; i < 30; i++) {
    const uid = userArr[i % userArr.length];
    const estId = estArr[i % estArr.length];
    const caption = captions[i % captions.length];
    const hashtags = (caption.match(/#\w+/g) || []).map(h => h.slice(1));
    const media = JSON.stringify([{ url: imgUrls[i % imgUrls.length], type: 'image' }]);
    await client.query(
      "INSERT INTO posts (author_id,author_type,establishment_id,type,caption,media,hashtags,likes_count,comments_count,views_count) VALUES ($1,'USER',$2,'PHOTO',$3,$4,$5,$6,$7,$8)",
      [uid, estId, caption, media, JSON.stringify(hashtags),
       Math.floor(Math.random()*500+10), Math.floor(Math.random()*30), Math.floor(Math.random()*5000+100)]
    );
    process.stdout.write('P');
  }
  console.log('\n  Posts: 30');

  await client.query("UPDATE users SET posts_count = (SELECT COUNT(*) FROM posts WHERE author_id = users.id)");
  await client.query("UPDATE establishments SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE establishment_id = establishments.id) WHERE id IN (SELECT DISTINCT establishment_id FROM reviews)");

  await client.end();
  console.log('\nSeed complet !');
}

run().catch(e => { console.error('ERREUR:', e.message, e.stack); process.exit(1); });
