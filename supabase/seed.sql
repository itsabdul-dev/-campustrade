-- CampusTrade demo seed.
--
-- Creates five demo members and fills the marketplace, feed, orders and inbox
-- so every screen has something real to show. Safe to run more than once: it
-- clears its own demo rows first and leaves accounts you signed up yourself
-- untouched.
--
-- Run it in the Supabase SQL editor after migrations 0001-0003.
--
-- The demo accounts sign in with the password below. They are for development
-- only — do not run this against a production project.

do $$
declare
  demo_password constant text := 'campustrade-demo';
  v_seller  uuid;
  v_buyer   uuid;
  v_club    uuid;
  v_green   uuid;
  v_vendor  uuid;
  v_order   uuid;
  v_convo   uuid;
  v_user      uuid;
  person     record;
  demo_people constant jsonb := '[
    {"email": "thabo@demo.mycput.ac.za",  "name": "Thabo Mokoena",       "role": "student",  "badge": "Student",      "avatar": "1500648767791-00dcc994a43e", "rating": 4.8, "reviews": 128},
    {"email": "alex@demo.mycput.ac.za",   "name": "Alex Rivera",         "role": "student",  "badge": "Student",      "avatar": "1507003211169-0a1dd7228f2d", "rating": 4.9, "reviews": 64},
    {"email": "club@demo.mycput.ac.za",   "name": "Outdoor Adventure Club", "role": "student", "badge": "Student Club", "avatar": "1533105079780-92b9be482077", "rating": 4.7, "reviews": 31},
    {"email": "green@demo.mycput.ac.za",  "name": "Sustainable Campus",  "role": "resident", "badge": "Green Team",   "avatar": "1466692476868-aef1dfb1e735", "rating": 4.6, "reviews": 18},
    {"email": "corner@demo.mycput.ac.za", "name": "The Corner Bookstore", "role": "vendor",  "badge": "Local Vendor", "avatar": "1481627834876-b7833e8f5570", "rating": 4.9, "reviews": 210}
  ]'::jsonb;
begin
  -- 1. Demo accounts -------------------------------------------------------
  for person in select * from jsonb_to_recordset(demo_people)
      as x(email text, name text, role text, badge text, avatar text,
           rating numeric, reviews int)
  loop
    if not exists (select 1 from auth.users where email = person.email) then
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data,
        confirmation_token, recovery_token, email_change,
        email_change_token_new
      )
      values (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
        'authenticated', 'authenticated', person.email,
        crypt(demo_password, gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', person.name, 'university', 'CPUT'),
        '', '', '', ''
      );
    end if;

    select id into v_user from auth.users where email = person.email;

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
    values (
      gen_random_uuid(), v_user, v_user::text,
      jsonb_build_object('sub', v_user::text, 'email', person.email),
      'email', now(), now()
    )
    on conflict do nothing;

    -- handle_new_user creates the profile; this fills in the display detail.
    update profiles set
      full_name = person.name,
      university = 'CPUT',
      verified = true,
      role = person.role::user_role,
      rating = person.rating,
      review_count = person.reviews,
      last_seen_at = now(),
      avatar_url =
        'https://images.unsplash.com/photo-' || person.avatar ||
        '?auto=format&fit=crop&w=200&q=70'
    where id = v_user;
  end loop;

  select id into v_seller from auth.users where email = 'thabo@demo.mycput.ac.za';
  select id into v_buyer  from auth.users where email = 'alex@demo.mycput.ac.za';
  select id into v_club   from auth.users where email = 'club@demo.mycput.ac.za';
  select id into v_green  from auth.users where email = 'green@demo.mycput.ac.za';
  select id into v_vendor from auth.users where email = 'corner@demo.mycput.ac.za';

  -- 2. Clear previous demo content ----------------------------------------
  delete from orders  where buyer_id  in (v_seller, v_buyer, v_club, v_green, v_vendor);
  delete from listings where seller_id in (v_seller, v_buyer, v_club, v_green, v_vendor);
  delete from posts   where author_id in (v_seller, v_buyer, v_club, v_green, v_vendor);
  delete from conversations where id in (
    select conversation_id from conversation_participants
     where profile_id in (v_seller, v_buyer)
  );

  -- 3. Listings ------------------------------------------------------------
  insert into listings
    (seller_id, title, description, price, category, condition, location, image_urls, rating)
  values
    (v_seller, 'Introduction to Psychology (11th Ed)',
     'Used for one semester and kept in a sleeve, so there is no highlighting or spine damage. Includes the printed study guide.',
     45, 'textbooks', 'like_new', 'Main Library / North Campus',
     array['https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=640&q=70'], 4.8),
    (v_vendor, 'Sony WH-1000XM4 Noise Cancelling',
     'Boxed with the charging cable and travel case. Battery health is excellent and the earcups were replaced last term.',
     180, 'electronics', 'excellent', 'Student Union',
     array['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=640&q=70'], 5.0),
    (v_buyer, 'Ergonomic Mesh Office Chair - Black',
     'Adjustable lumbar support and armrests. Some scuffing on the base, but the gas lift holds fine.',
     65, 'furniture', 'good', 'Graduate Housing',
     array['https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=640&q=70'], 4.5),
    (v_seller, 'Scientific Calculator TI-84 Plus CE',
     'Still sealed. Bought for a module I ended up dropping.',
     90, 'electronics', 'new', 'Science Building',
     array['https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=640&q=70'], 4.9),
    (v_buyer, 'Engineering Textbook - Statics',
     'Solutions manual included at no extra cost. A few pencil notes in chapter 3.',
     45, 'textbooks', 'good', 'Engineering Block',
     array['https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=640&q=70'], 4.7),
    (v_green, 'Private Maths Tutoring - 1hr',
     'First-year calculus and linear algebra. Online or on campus, evenings and weekends.',
     120, 'services', 'new', 'Online / Campus',
     array['https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=640&q=70'], 5.0),
    (v_vendor, 'Insulated Copper Water Bottle',
     'Keeps drinks cold for 24 hours. Ocean blue, 750ml, never used.',
     32.50, 'furniture', 'new', 'Res Dining Hall',
     array['https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=640&q=70'], 4.6),
    (v_seller, 'MacBook Pro M2 2023 - Space Gray',
     '16GB RAM, 512GB SSD. Under 200 charge cycles, AppleCare until next August. Selling to fund a desktop build.',
     2499, 'electronics', 'excellent', 'Main Quad',
     array['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=640&q=70'], 4.9),
    (v_club, 'Two-Person Hiking Tent',
     'Used on three trips, dried and stored properly each time. Poles and pegs all present.',
     420, 'furniture', 'good', 'Sports Complex',
     array['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=640&q=70'], 4.7),
    (v_green, 'Room Deposit Share - Observatory',
     'Looking for one housemate from June. Walking distance to the shuttle stop.',
     3200, 'housing', 'new', 'Observatory',
     array['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=640&q=70'], 4.4);

  -- 4. Orders --------------------------------------------------------------
  insert into orders
    (buyer_id, seller_id, listing_title, image_url, amount, status,
     meetup_label, meetup_address, placed_at)
  values
    (v_buyer, v_seller, 'Sony Alpha a7 IV Mirrorless Camera',
     'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=240&q=70',
     2499, 'in_escrow', 'University Library (Safe Zone)', 'Main Quad, Sector 4B',
     now() - interval '2 days')
  returning id into v_order;

  insert into order_events (order_id, status, title, body, created_at) values
    (v_order, 'placed', 'Order Placed',
     'Your request for the Sony Alpha a7 IV was sent to the seller.',
     now() - interval '2 days'),
    (v_order, 'in_escrow', 'Payment Secured in Escrow',
     'Funds are safely held by CampusTrade until you confirm the item.',
     now() - interval '2 days' + interval '4 min');

  insert into orders
    (buyer_id, seller_id, listing_title, image_url, amount, status, placed_at)
  values
    (v_buyer, v_vendor, 'DJI Mini 3 Pro Drone Combo',
     'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=240&q=70',
     929, 'in_transit', now() - interval '4 days'),
    (v_buyer, v_seller, 'Introduction to Psychology (11th Ed)',
     'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=240&q=70',
     45, 'completed', now() - interval '3 weeks'),
    (v_buyer, v_vendor, 'Ergonomic Mesh Office Chair',
     'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=240&q=70',
     65, 'completed', now() - interval '6 weeks');

  -- 5. Conversation --------------------------------------------------------
  insert into conversations default values returning id into v_convo;

  insert into conversation_participants (conversation_id, profile_id) values
    (v_convo, v_seller),
    (v_convo, v_buyer);

  insert into messages (conversation_id, sender_id, body, sent_at) values
    (v_convo, v_buyer,  'Hi! Is the textbook still available?', now() - interval '30 min'),
    (v_convo, v_seller, 'Hey! Yes, it''s still available. I used it for just one semester, so it''s practically new.', now() - interval '28 min'),
    (v_convo, v_buyer,  'That''s great! Would you be willing to do R40 for it? I can meet you on campus this afternoon.', now() - interval '25 min'),
    (v_convo, v_seller, 'I think R45 is fair given the condition, but I can throw in the solutions manual for free if you want it!', now() - interval '22 min'),
    (v_convo, v_buyer,  'Oh, that solutions manual would be super helpful! I''ll take it for R45. Does 3 PM work for you near the library?', now() - interval '20 min'),
    (v_convo, v_seller, 'Perfect. See you then! I''ll be wearing a red jacket.', now() - interval '18 min');

  -- 6. Campus feed ---------------------------------------------------------
  insert into posts
    (author_id, author_badge, category, title, body, image_url, created_at)
  values
    (v_club, 'Student Club', 'events', 'Sunrise Hike & Coffee: North Ridge Trail',
     'Kick off your weekend with us! We are meeting at the Trailhead at 5:45 AM this Saturday. Bring your own mug — we are providing locally roasted coffee for everyone at the peak.',
     'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=640&q=70',
     now() - interval '2 hours'),
    (v_green, 'Green Team', 'sustainability', 'Join the Annual Zero-Waste Challenge!',
     'Ready to reduce your footprint? Sign up for the 30-day challenge starting Monday. The winning floor gets a catered vegan dinner from Green Leaf Cafe.',
     null, now() - interval '5 hours'),
    (v_vendor, 'Local Vendor', 'general', 'Mid-Semester Textbook Sale',
     'All used textbooks are now an additional 25% off until Friday. Stock up on study guides and prep material before finals approach.',
     'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=640&q=70',
     now() - interval '1 day'),
    (v_seller, 'Official', 'events', 'Town Hall: New Campus Transit Routes',
     'Join us in the Main Hall to discuss proposed changes to the evening shuttle service. Your feedback is crucial for ensuring safe and efficient travel for all students.',
     null, now() - interval '2 days');

  -- Likes and comments so the counters are not all zero.
  insert into post_likes (post_id, profile_id)
  select p.id, u.id
    from posts p
    cross join (values (v_seller), (v_buyer), (v_club), (v_green)) as u(id)
   where p.author_id in (v_club, v_green, v_vendor, v_seller)
     and u.id <> p.author_id
  on conflict do nothing;

  insert into post_comments (post_id, author_id, body)
  select p.id, v_buyer, 'Count me in — I will bring a flask.'
    from posts p where p.author_id = v_club;

  insert into post_comments (post_id, author_id, body)
  select p.id, v_green, 'Is there space for one more?'
    from posts p where p.author_id = v_club;

  raise notice 'Seed complete. Demo accounts sign in with the password: %', demo_password;
end $$;
