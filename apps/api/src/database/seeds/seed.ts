import { AppDataSource } from '../data-source';
import * as bcrypt from 'bcryptjs';

async function seed() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();

  console.log('Seeding database...');

  // Admin user
  const adminPass = await bcrypt.hash('Admin@EDP2024!', 12);
  await queryRunner.query(`
    INSERT INTO users (email, username, first_name, last_name, password, role, email_verified)
    VALUES ('admin@edp.app', 'admin_edp', 'Admin', 'EDP', $1, 'ADMIN', true)
    ON CONFLICT (email) DO NOTHING
  `, [adminPass]);

  // Test user
  const userPass = await bcrypt.hash('User@EDP2024!', 12);
  await queryRunner.query(`
    INSERT INTO users (email, username, first_name, last_name, password, role, email_verified, bio, city, country)
    VALUES ('test@edp.app', 'foodlover_paris', 'Sophie', 'Martin', $1, 'USER', true, 'Passionnée de gastronomie 🍽️', 'Paris', 'France')
    ON CONFLICT (email) DO NOTHING
  `, [userPass]);

  // Sample establishments
  const establishments = [
    {
      name: 'Le Grand Bistrot', type: 'RESTAURANT', city: 'Paris', country: 'France',
      address: '15 Rue de la Paix', lat: 48.8698, lng: 2.3296,
      description: 'Un bistrot parisien authentique au cœur de Paris.',
      cuisine: ['Française', 'Bistronomie'], priceRange: 'MODERATE',
    },
    {
      name: 'Hôtel Lumière', type: 'HOTEL', city: 'Paris', country: 'France',
      address: '8 Boulevard Haussmann', lat: 48.8730, lng: 2.3312,
      description: 'Un hôtel boutique élégant à deux pas des Grands Boulevards.',
      amenities: ['WiFi', 'Spa', 'Piscine', 'Restaurant', 'Bar'], priceRange: 'LUXURY',
    },
    {
      name: 'Bar Negroni', type: 'BAR', city: 'Paris', country: 'France',
      address: '22 Rue Saint-Denis', lat: 48.8615, lng: 2.3526,
      description: 'Le meilleur bar à cocktails de Paris.',
      priceRange: 'MODERATE',
    },
    {
      name: 'Sushi Masaki', type: 'RESTAURANT', city: 'Lyon', country: 'France',
      address: '5 Rue de la République', lat: 45.7640, lng: 4.8357,
      description: 'Sushis et cuisine japonaise raffinés.',
      cuisine: ['Japonaise', 'Sushi'], priceRange: 'EXPENSIVE',
    },
    {
      name: 'Villa Azur', type: 'HOTEL', city: 'Nice', country: 'France',
      address: '12 Promenade des Anglais', lat: 43.6960, lng: 7.2690,
      description: 'Hôtel 5 étoiles face à la Méditerranée.',
      amenities: ['Piscine', 'Spa', 'Plage privée', 'Restaurant'], priceRange: 'LUXURY',
    },
  ];

  const estUser = await queryRunner.query(`SELECT id FROM users WHERE email = 'admin@edp.app' LIMIT 1`);
  const userId = estUser[0]?.id;

  for (const est of establishments) {
    const slug = est.name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    await queryRunner.query(`
      INSERT INTO establishments
        (user_id, name, slug, type, description, address, city, country, latitude, longitude,
         cuisine, amenities, price_range, is_verified, average_rating, reviews_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, $14, $15)
      ON CONFLICT (slug) DO NOTHING
    `, [
      userId, est.name, slug, est.type, est.description,
      est.address, est.city, est.country, est.lat, est.lng,
      JSON.stringify(est.cuisine || []),
      JSON.stringify(est.amenities || []),
      est.priceRange,
      (Math.random() * 2 + 3).toFixed(1),
      Math.floor(Math.random() * 200 + 10),
    ]);
  }

  await queryRunner.release();
  await AppDataSource.destroy();
  console.log('Seeding complete!');
}

seed().catch((e) => {
  console.error('Seeding failed:', e);
  process.exit(1);
});
