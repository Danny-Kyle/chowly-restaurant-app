-- Apply after schema.sql, including for existing installations. No data is deleted.
-- Functions execute with the caller's rights; only the server role can invoke them.
begin;

create or replace function chowly_place_order(p_customer text, p_restaurant text, p_cart jsonb)
returns jsonb language plpgsql set search_path = public as $$
declare
  line jsonb; item record; qty integer; price numeric; food_time integer := 0;
  drink_time integer := 0; total numeric := 0; created orders; rows_json jsonb;
  order_key text := 'ORD' || replace(gen_random_uuid()::text, '-', '');
begin
  if jsonb_typeof(p_cart) is distinct from 'array' or jsonb_array_length(p_cart) = 0 then
    raise exception using errcode = '22023', message = 'Select at least one menu item';
  end if;
  if not exists(select 1 from customers where customer_id = p_customer) then
    raise exception using errcode = 'P0002', message = 'Customer not found';
  end if;
  if not exists(select 1 from restaurants where restaurant_id = p_restaurant) then
    raise exception using errcode = 'P0002', message = 'Restaurant not found';
  end if;
  -- Any later failure rolls this row back together with every line item.
  insert into orders(order_id, customer_id, restaurant_id, status, is_paid)
    values(order_key, p_customer, p_restaurant, 'Pending', false);
  for line in select value from jsonb_array_elements(p_cart) loop
    if jsonb_typeof(line->'quantity') is distinct from 'number' or
       (line->>'quantity')::numeric < 1 or
       (line->>'quantity')::numeric <> trunc((line->>'quantity')::numeric) or
       (line->>'quantity')::numeric > 2147483647 then
      raise exception using errcode = '22023', message = 'Quantity must be a positive whole number';
    end if;
    qty := (line->>'quantity')::integer;
    select mi.* into item from menu_items mi join menus m using(menu_id)
      where mi.menu_item_id = line->>'menuItemId' and m.restaurant_id = p_restaurant
        and m.status = 'In Circulation' and mi.availability_status = 'Available'
      for share of mi, m;
    if not found then
      raise exception using errcode = '22023', message = 'A selected menu item is unavailable at this restaurant';
    end if;
    if item.category not in ('food', 'drink') or item.category is null or
       item.price < 0 or item.expected_preparation_time < 0 then
      raise exception using errcode = '22023', message = 'Invalid menu item configuration';
    end if;
    price := item.price * qty;
    total := total + price;
    if item.category = 'drink' then
      drink_time := drink_time + item.expected_preparation_time * qty;
    else
      food_time := food_time + item.expected_preparation_time * qty;
    end if;
    insert into order_items(order_item_id, order_id, menu_item_id, quantity, unit_price, subtotal)
      values('OIT' || replace(gen_random_uuid()::text, '-', ''), order_key,
        item.menu_item_id, qty, item.price, price);
  end loop;
  update orders set total_order_amount = total, estimated_waiting_time = greatest(food_time, drink_time)
    where order_id = order_key returning * into created;
  select coalesce(jsonb_agg(to_jsonb(oi)), '[]'::jsonb) into rows_json
    from order_items oi where order_id = order_key;
  return jsonb_build_object('order', to_jsonb(created), 'items', rows_json);
end $$;

create or replace function chowly_assign_preparer(p_order text, p_item text, p_staff text)
returns jsonb language plpgsql set search_path = public as $$
declare current_order orders; current_item order_items; category text;
begin
  select * into current_order from orders where order_id = p_order for update;
  if not found then raise exception using errcode = 'P0002', message = 'Order not found'; end if;
  if current_order.status is distinct from 'Pending' then
    raise exception using errcode = 'P0001', message = 'Only pending orders can be assigned';
  end if;
  select * into current_item from order_items where order_item_id = p_item and order_id = p_order;
  if not found then raise exception using errcode = 'P0002', message = 'Item does not belong to this order'; end if;
  select mi.category into category from menu_items mi where menu_item_id = current_item.menu_item_id;
  if category = 'drink' then
    if not exists(select 1 from bartenders where bartender_id = p_staff and restaurant_id = current_order.restaurant_id) then
      raise exception using errcode = '22023', message = 'Select a bartender from this restaurant';
    end if;
  elsif category = 'food' then
    if not exists(select 1 from chefs where chef_id = p_staff and restaurant_id = current_order.restaurant_id) then
      raise exception using errcode = '22023', message = 'Select a chef from this restaurant';
    end if;
  else
    raise exception using errcode = '22023', message = 'Invalid menu item category';
  end if;
  update order_items set chef_id = case when category = 'food' then p_staff end,
    bartender_id = case when category = 'drink' then p_staff end
    where order_item_id = p_item returning * into current_item;
  return to_jsonb(current_item);
end $$;

create or replace function chowly_serve_order(p_order text, p_waiter text)
returns jsonb language plpgsql set search_path = public as $$
declare current_order orders;
begin
  select * into current_order from orders where order_id = p_order for update;
  if not found then raise exception using errcode = 'P0002', message = 'Order not found'; end if;
  if not exists(select 1 from waiters where waiter_id = p_waiter and restaurant_id = current_order.restaurant_id and status = 'On Duty') then
    raise exception using errcode = '22023', message = 'Waiter must be on duty at this restaurant';
  end if;
  if current_order.status = 'Served' then return to_jsonb(current_order); end if;
  if current_order.status is distinct from 'Pending' then
    raise exception using errcode = 'P0001', message = 'Only pending orders can be served';
  end if;
  if not exists(select 1 from order_items where order_id = p_order) or exists(
    select 1 from order_items oi join menu_items mi using(menu_item_id)
    where oi.order_id = p_order and (
      (mi.category = 'food' and not exists(select 1 from chefs c where c.chef_id = oi.chef_id and c.restaurant_id = current_order.restaurant_id)) or
      (mi.category = 'drink' and not exists(select 1 from bartenders b where b.bartender_id = oi.bartender_id and b.restaurant_id = current_order.restaurant_id)) or
      mi.category is null or mi.category not in ('food','drink'))
  ) then
    raise exception using errcode = 'P0001', message = 'Assign a suitable preparer to every item before serving';
  end if;
  update orders set status = 'Served', waiter_id = p_waiter, served_at = clock_timestamp()
    where order_id = p_order returning * into current_order;
  return to_jsonb(current_order);
end $$;

create or replace function chowly_cancel_order(p_order text, p_actor text)
returns jsonb language plpgsql set search_path = public as $$
declare current_order orders;
begin
  if p_actor is null or p_actor not in ('customer','waiter') then
    raise exception using errcode = '22023', message = 'Cancellation role must be customer or waiter';
  end if;
  select * into current_order from orders where order_id = p_order for update;
  if not found then raise exception using errcode = 'P0002', message = 'Order not found'; end if;
  if current_order.status = 'Cancelled' then return to_jsonb(current_order); end if;
  if current_order.status is distinct from 'Pending' or current_order.is_paid then
    raise exception using errcode = 'P0001', message = 'Only unpaid pending orders can be cancelled';
  end if;
  update orders set status = 'Cancelled', cancelled_by = p_actor where order_id = p_order returning * into current_order;
  return to_jsonb(current_order);
end $$;

create or replace function chowly_pay_order(p_order text, p_amount numeric)
returns jsonb language plpgsql set search_path = public as $$
declare current_order orders; recorded payments;
begin
  select * into current_order from orders where order_id = p_order for update;
  if not found then raise exception using errcode = 'P0002', message = 'Order not found'; end if;
  if current_order.status is distinct from 'Served' then
    raise exception using errcode = 'P0001', message = 'Only served orders can be paid';
  end if;
  if p_amount is null or p_amount <> current_order.total_order_amount or p_amount < 0 or
     p_amount::text in ('NaN','Infinity','-Infinity') then
    raise exception using errcode = '22023', message = 'Payment amount must match the order total';
  end if;
  select * into recorded from payments where order_id = p_order and payment_status = 'Successful' order by payment_id limit 1;
  if not found then
    if current_order.is_paid then
      raise exception using errcode = 'P0001', message = 'Paid order has no payment record; contact the restaurant';
    end if;
    insert into payments(payment_id, order_id, amount, payment_method, payment_status, transaction_reference)
      values('PAY' || replace(gen_random_uuid()::text, '-', ''), p_order, current_order.total_order_amount,
        'Pretend Payment', 'Successful', 'PRETEND-' || gen_random_uuid()::text) returning * into recorded;
  end if;
  update orders set is_paid = true where order_id = p_order returning * into current_order;
  return jsonb_build_object('payment', to_jsonb(recorded), 'order', to_jsonb(current_order));
end $$;

create or replace function chowly_submit_feedback(p_order text, p_customer text, p_type text, p_description text, p_score integer, p_comments text)
returns jsonb language plpgsql set search_path = public as $$
declare current_order orders; complaint complaints; rating ratings;
begin
  select * into current_order from orders where order_id = p_order for update;
  if not found then raise exception using errcode = 'P0002', message = 'Order not found'; end if;
  if current_order.customer_id is distinct from p_customer then
    raise exception using errcode = '22023', message = 'Customer does not match this order';
  end if;
  if current_order.status = 'Cancelled' then
    raise exception using errcode = 'P0001', message = 'Cannot submit feedback for a cancelled order';
  end if;
  if p_type is null or p_type not in ('Delay','Quality','Other') or nullif(trim(p_description),'') is null or p_score is null or p_score not between 1 and 5 then
    raise exception using errcode = '22023', message = 'Provide a complaint type, description and rating from 1 to 5';
  end if;
  insert into complaints(complaint_id, order_id, customer_id, complaint_type, description, resolution_status)
    values('CMP' || replace(gen_random_uuid()::text, '-', ''), p_order, p_customer, p_type, trim(p_description), 'Open') returning * into complaint;
  insert into ratings(rating_id, order_id, rating_score, comments)
    values('RAT' || replace(gen_random_uuid()::text, '-', ''), p_order, p_score, nullif(trim(p_comments),'')) returning * into rating;
  return jsonb_build_object('complaint', to_jsonb(complaint), 'rating', to_jsonb(rating));
end $$;

-- A server secret key is required. Visitors still share the deliberately public demo.
-- Block direct database access via public keys; the Next.js API is the entry point.
do $$ declare name text; fn record;
begin
  foreach name in array array['restaurants','customers','waiters','chefs','bartenders','menus','menu_items','orders','order_items','payments','complaints','ratings'] loop
    execute format('alter table %I enable row level security', name);
    if exists(select 1 from pg_roles where rolname = 'service_role') then execute format('grant all on table %I to service_role', name); end if;
    if exists(select 1 from pg_roles where rolname = 'anon') then
      execute format('revoke all on table %I from anon', name);
    end if;
    if exists(select 1 from pg_roles where rolname = 'authenticated') then
      execute format('revoke all on table %I from authenticated', name);
    end if;
  end loop;
  for fn in select oid::regprocedure signature from pg_proc where pronamespace = 'public'::regnamespace and proname like 'chowly\_%' escape '\' loop
    execute format('revoke execute on function %s from public', fn.signature);
    if exists(select 1 from pg_roles where rolname = 'anon') then execute format('revoke execute on function %s from anon', fn.signature); end if;
    if exists(select 1 from pg_roles where rolname = 'authenticated') then execute format('revoke execute on function %s from authenticated', fn.signature); end if;
    if exists(select 1 from pg_roles where rolname = 'service_role') then execute format('grant execute on function %s to service_role', fn.signature); end if;
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
