-- VEYA — Enrichissement seed : follows, reservations, comments, loyalty
-- Idempotent (ON CONFLICT DO NOTHING)

-- ========== FOLLOWS : relations sociales ==========
-- Sophie suit Thomas, Claire, Marc, Léa
INSERT INTO follows (follower_id, followed_user_id, created_at) VALUES
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', 'b14caeb7-5316-43a5-914d-03f71954a57a', now()),
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', '83179bea-a9a1-41fa-801c-0bc95290c2f5', now()),
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', '8af55d9c-d460-4c24-8ff8-8f6d7e637141', now()),
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', '723ecd16-89f9-4f5d-9a07-8f563fd5f173', now()),
  -- Thomas suit Sophie, Marc
  ('b14caeb7-5316-43a5-914d-03f71954a57a', '2f7b67f3-cf32-468e-bfe2-0abff4264f7d', now()),
  ('b14caeb7-5316-43a5-914d-03f71954a57a', '8af55d9c-d460-4c24-8ff8-8f6d7e637141', now()),
  -- demo suit tous
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', '2f7b67f3-cf32-468e-bfe2-0abff4264f7d', now()),
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', 'b14caeb7-5316-43a5-914d-03f71954a57a', now()),
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', '83179bea-a9a1-41fa-801c-0bc95290c2f5', now()),
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', '8af55d9c-d460-4c24-8ff8-8f6d7e637141', now()),
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', '723ecd16-89f9-4f5d-9a07-8f563fd5f173', now()),
  -- test suit demo et sophie
  ('fe49550b-cd94-4442-ab72-1075c4fd69ca', '81e24e42-9415-4fca-aff8-4bf6b325c283', now()),
  ('fe49550b-cd94-4442-ab72-1075c4fd69ca', '2f7b67f3-cf32-468e-bfe2-0abff4264f7d', now())
ON CONFLICT DO NOTHING;

-- Mise à jour des compteurs followers/following
UPDATE users SET
  followers_count = (SELECT count(*) FROM follows WHERE followed_user_id = users.id),
  following_count = (SELECT count(*) FROM follows WHERE follower_id = users.id);

-- ========== RESERVATIONS ==========
-- Quelques réservations restaurant et hotel
INSERT INTO reservations (user_id, establishment_id, type, status, details, created_at) VALUES
  -- demo réserve Le Cinq (restaurant) → confirmé
  ('81e24e42-9415-4fca-aff8-4bf6b325c283',
   '265d48af-a6d6-4439-ab45-15edd9321c6f',
   'RESTAURANT', 'CONFIRMED',
   '{"date":"2026-06-10","time":"20:00","partySize":2,"specialRequests":"Fenêtre si possible"}',
   now() - interval '2 days'),
  -- sophie réserve Hôtel Plaza → confirmé
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d',
   '29dc98c2-f532-483a-b93d-35bb73b183a0',
   'HOTEL', 'CONFIRMED',
   '{"checkIn":"2026-07-15","checkOut":"2026-07-18","roomType":"Deluxe","guestCount":2}',
   now() - interval '5 days'),
  -- thomas réserve L Ami Jean → en attente
  ('b14caeb7-5316-43a5-914d-03f71954a57a',
   'a6845a2c-8294-49c8-9c96-1e4709b3fb6b',
   'RESTAURANT', 'PENDING',
   '{"date":"2026-06-20","time":"19:30","partySize":4}',
   now() - interval '1 day'),
  -- test réserve Hotel Costes → annulé
  ('fe49550b-cd94-4442-ab72-1075c4fd69ca',
   'b9689026-c8d8-40e0-af39-30de745de443',
   'HOTEL', 'CANCELLED',
   '{"checkIn":"2026-06-01","checkOut":"2026-06-03","roomType":"Standard","guestCount":1}',
   now() - interval '10 days'),
  -- marc réserve Tour Eiffel Brasserie → terminé
  ('8af55d9c-d460-4c24-8ff8-8f6d7e637141',
   'fc3d4ede-17da-483a-989e-0f3403cd8c16',
   'RESTAURANT', 'COMPLETED',
   '{"date":"2026-05-28","time":"21:00","partySize":3}',
   now() - interval '8 days'),
  -- demo réserve Hôtel Lumière → confirmé
  ('81e24e42-9415-4fca-aff8-4bf6b325c283',
   '29dc98c2-f532-483a-b93d-35bb73b183a0',
   'HOTEL', 'CONFIRMED',
   '{"checkIn":"2026-08-01","checkOut":"2026-08-05","roomType":"Suite","guestCount":2}',
   now())
ON CONFLICT DO NOTHING;

-- ========== COMMENTAIRES sur les posts ==========
-- Récupérer les premiers post IDs
DO $$
DECLARE
  post_ids UUID[];
BEGIN
  SELECT array_agg(id ORDER BY created_at) INTO post_ids FROM posts LIMIT 10;

  -- Commentaires sur post 1
  INSERT INTO comments (post_id, author_id, content, created_at)
  VALUES
    (post_ids[1], '81e24e42-9415-4fca-aff8-4bf6b325c283', 'Incroyable ! Je dois y aller absolument 😍', now() - interval '3 hours'),
    (post_ids[1], 'b14caeb7-5316-43a5-914d-03f71954a57a', 'Le service est top aussi, j''y étais la semaine dernière', now() - interval '2 hours'),
    (post_ids[2], '2f7b67f3-cf32-468e-bfe2-0abff4264f7d', 'Ce dessert... 🤤 Le chef est talentueux', now() - interval '5 hours'),
    (post_ids[2], '83179bea-a9a1-41fa-801c-0bc95290c2f5', 'J''ai hâte d''y retourner !', now() - interval '4 hours'),
    (post_ids[3], 'fe49550b-cd94-4442-ab72-1075c4fd69ca', 'Paris for the food wins every time 🇫🇷', now() - interval '6 hours'),
    (post_ids[4], '8af55d9c-d460-4c24-8ff8-8f6d7e637141', 'Un vrai chef-d''œuvre culinaire !', now() - interval '1 hour'),
    (post_ids[5], '723ecd16-89f9-4f5d-9a07-8f563fd5f173', 'Soirée magique, je recommande vivement 🌹', now() - interval '2 hours'),
    (post_ids[5], '81e24e42-9415-4fca-aff8-4bf6b325c283', 'La vue est spectaculaire depuis là-haut', now() - interval '1 hour'),
    (post_ids[6], 'b14caeb7-5316-43a5-914d-03f71954a57a', 'Le meilleur sushi de Lyon, sans hésitation', now() - interval '3 hours'),
    (post_ids[7], '2f7b67f3-cf32-468e-bfe2-0abff4264f7d', 'Adresse secrète révélée ! Merci 🙏', now() - interval '4 hours')
  ON CONFLICT DO NOTHING;
END $$;

-- Mise à jour du compteur de commentaires
UPDATE posts SET comments_count = (
  SELECT count(*) FROM comments WHERE comments.post_id = posts.id
);

-- ========== LIKES sur les posts ==========
-- Likes croisés entre utilisateurs
DO $$
DECLARE
  post_ids UUID[];
  user_ids UUID[] := ARRAY[
    '81e24e42-9415-4fca-aff8-4bf6b325c283',
    '2f7b67f3-cf32-468e-bfe2-0abff4264f7d',
    'b14caeb7-5316-43a5-914d-03f71954a57a',
    '83179bea-a9a1-41fa-801c-0bc95290c2f5',
    '8af55d9c-d460-4c24-8ff8-8f6d7e637141',
    '723ecd16-89f9-4f5d-9a07-8f563fd5f173',
    'fe49550b-cd94-4442-ab72-1075c4fd69ca'
  ];
  uid UUID;
  pid UUID;
BEGIN
  SELECT array_agg(id ORDER BY created_at) INTO post_ids FROM posts LIMIT 15;
  FOREACH pid IN ARRAY post_ids[1:10] LOOP
    FOREACH uid IN ARRAY user_ids LOOP
      INSERT INTO post_likes (user_id, post_id, created_at)
      VALUES (uid, pid, now() - (random() * interval '7 days'))
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ========== LOYALTY TRANSACTIONS ==========
INSERT INTO loyalty_transactions (user_id, action_type, points, entity_id, created_at) VALUES
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', 'PHOTO_POST', 10, gen_random_uuid(), now() - interval '6 days'),
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', 'PHOTO_POST', 10, gen_random_uuid(), now() - interval '5 days'),
  ('81e24e42-9415-4fca-aff8-4bf6b325c283', 'RESERVATION', 25, gen_random_uuid(), now() - interval '2 days'),
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', 'PHOTO_POST', 10, gen_random_uuid(), now() - interval '4 days'),
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', 'REVIEW', 15, gen_random_uuid(), now() - interval '3 days'),
  ('2f7b67f3-cf32-468e-bfe2-0abff4264f7d', 'RESERVATION', 25, gen_random_uuid(), now() - interval '5 days'),
  ('b14caeb7-5316-43a5-914d-03f71954a57a', 'PHOTO_POST', 10, gen_random_uuid(), now() - interval '2 days'),
  ('b14caeb7-5316-43a5-914d-03f71954a57a', 'REVIEW', 15, gen_random_uuid(), now() - interval '1 day'),
  ('fe49550b-cd94-4442-ab72-1075c4fd69ca', 'PHOTO_POST', 10, gen_random_uuid(), now() - interval '3 days'),
  ('8af55d9c-d460-4c24-8ff8-8f6d7e637141', 'RESERVATION', 25, gen_random_uuid(), now() - interval '8 days'),
  ('723ecd16-89f9-4f5d-9a07-8f563fd5f173', 'REVIEW', 15, gen_random_uuid(), now() - interval '2 days')
ON CONFLICT DO NOTHING;

-- Mise à jour des points de fidélité
UPDATE users SET loyalty_points = (
  SELECT COALESCE(sum(points), 0) FROM loyalty_transactions WHERE loyalty_transactions.user_id = users.id
);

-- Mise à jour des grades fidélité
UPDATE users SET loyalty_grade = CASE
  WHEN loyalty_points >= 50000 THEN 'DIAMOND'
  WHEN loyalty_points >= 10000 THEN 'PLATINUM'
  WHEN loyalty_points >= 2000  THEN 'GOLD'
  WHEN loyalty_points >= 500   THEN 'SILVER'
  ELSE 'BRONZE'
END;

-- Vérification finale
SELECT
  (SELECT count(*) FROM follows) as follows,
  (SELECT count(*) FROM reservations) as reservations,
  (SELECT count(*) FROM comments) as comments,
  (SELECT count(*) FROM post_likes) as likes,
  (SELECT count(*) FROM loyalty_transactions) as loyalty_tx;
