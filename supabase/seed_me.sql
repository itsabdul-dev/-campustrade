-- Attaches demo content to YOUR account.
--
-- The main seed gives its orders and conversation to the demo members, and row
-- level security scopes those to their owner — so your own Orders and Inbox
-- look empty even though the seed worked. This gives your account its own
-- orders, a conversation with a demo seller, and a few notifications.
--
-- Replace the email on the next line with the one you signed up with, then run
-- this in the SQL editor. Re-running it replaces what it created before.

do $$
declare
  my_email constant text := 'you@youruniversity.ac.za';  -- <<< CHANGE THIS
  v_me      uuid;
  v_seller  uuid;
  v_vendor  uuid;
  v_order   uuid;
  v_convo   uuid;
begin
  select id into v_me from auth.users where email = my_email;

  if v_me is null then
    raise exception
      'No account found for %. Use the email you signed up with in the app.', my_email;
  end if;

  select id into v_seller from auth.users where email = 'thabo@demo.mycput.ac.za';
  select id into v_vendor from auth.users where email = 'corner@demo.mycput.ac.za';

  if v_seller is null then
    raise exception 'Demo members are missing. Run seed.sql first.';
  end if;

  -- Clear anything a previous run of this file created.
  delete from orders where buyer_id = v_me;
  delete from notifications where profile_id = v_me;
  delete from conversations where id in (
    select cp.conversation_id
      from conversation_participants cp
     where cp.profile_id = v_me
  );

  -- Orders, with you as the buyer -----------------------------------------
  insert into orders
    (buyer_id, seller_id, listing_title, image_url, amount, status,
     meetup_label, meetup_address, placed_at)
  values
    (v_me, v_seller, 'Sony Alpha a7 IV Mirrorless Camera',
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
    (v_me, v_vendor, 'DJI Mini 3 Pro Drone Combo',
     'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=240&q=70',
     929, 'in_transit', now() - interval '4 days'),
    (v_me, v_seller, 'Introduction to Psychology (11th Ed)',
     'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=240&q=70',
     45, 'completed', now() - interval '3 weeks');

  -- A conversation you are part of ----------------------------------------
  insert into conversations default values returning id into v_convo;

  insert into conversation_participants (conversation_id, profile_id) values
    (v_convo, v_me),
    (v_convo, v_seller);

  insert into messages (conversation_id, sender_id, body, sent_at) values
    (v_convo, v_seller, 'Hi! Thanks for the interest — the textbook is still available.', now() - interval '30 min'),
    (v_convo, v_me,     'Great. Would you take R40 for it?', now() - interval '25 min'),
    (v_convo, v_seller, 'I think R45 is fair given the condition, but I can throw in the solutions manual for free.', now() - interval '22 min'),
    (v_convo, v_me,     'Deal. Does 3 PM near the library work?', now() - interval '20 min'),
    (v_convo, v_seller, 'Perfect. See you then! I''ll be wearing a red jacket.', now() - interval '18 min');

  -- Notifications ----------------------------------------------------------
  insert into notifications (profile_id, kind, title, body, link, read, created_at)
  values
    (v_me, 'message', 'Thabo Mokoena replied',
     'Perfect. See you then! I''ll be wearing a red jacket.', '/inbox', false,
     now() - interval '18 min'),
    (v_me, 'escrow', 'Payment secured in escrow',
     'Your funds for the Sony Alpha a7 IV are held until you confirm the item.',
     '/orders', false, now() - interval '2 days'),
    (v_me, 'order', 'Order completed',
     'Introduction to Psychology (11th Ed) was delivered and funds released.',
     '/orders', true, now() - interval '3 weeks');

  raise notice 'Linked demo content to %.', my_email;
end $$;
