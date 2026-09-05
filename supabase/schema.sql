-- Chowly schema — matches the original Excel data model, with two additions
-- flagged and explained in the project report:
--   1) orders.is_paid          -> payment must explicitly mark the order paid
--   2) (no new table) customers are created on the fly from the Customer view
--      the first time someone orders, since there is no login

create table restaurants (
  restaurant_id text primary key,
  restaurant_name text not null,
  address text,
  contact_number text,
  email text
);

create table customers (
  customer_id text primary key,
  first_name text not null,
  last_name text,
  phone_number text,
  email text
);

create table waiters (
  waiter_id text primary key,
  first_name text not null,
  last_name text,
  phone_number text,
  email text,
  status text default 'On Duty',
  restaurant_id text references restaurants(restaurant_id)
);

create table chefs (
  chef_id text primary key,
  first_name text not null,
  last_name text,
  phone_number text,
  restaurant_id text references restaurants(restaurant_id)
);

create table bartenders (
  bartender_id text primary key,
  first_name text not null,
  last_name text,
  phone_number text,
  restaurant_id text references restaurants(restaurant_id)
);

create table menus (
  menu_id text primary key,
  menu_name text not null,
  description text,
  status text default 'In Circulation',
  restaurant_id text references restaurants(restaurant_id)
);

create table menu_items (
  menu_item_id text primary key,
  item_name text not null,
  description text,
  category text,             -- 'food' | 'drink' — drives chef vs bartender assignment
  price numeric not null,
  availability_status text default 'Available',
  expected_preparation_time integer not null,  -- minutes, kept numeric so we can calculate wait times
  menu_id text references menus(menu_id)
);

create table orders (
  order_id text primary key,
  order_time time default current_time,
  order_date date default current_date,
  status text default 'Pending',              -- Pending | Served
  estimated_waiting_time integer,              -- minutes
  actual_preparation_duration integer,
  total_order_amount numeric,
  is_paid boolean default false,               -- ADDED: explicit paid flag (see note above)
  customer_id text references customers(customer_id),
  restaurant_id text references restaurants(restaurant_id),
  waiter_id text references waiters(waiter_id)
);

create table order_items (
  order_item_id text primary key,
  quantity integer not null default 1,
  unit_price numeric not null,
  subtotal numeric not null,
  special_instructions text,
  order_id text references orders(order_id),
  menu_item_id text references menu_items(menu_item_id),
  chef_id text references chefs(chef_id),
  bartender_id text references bartenders(bartender_id)
);

create table payments (
  payment_id text primary key,
  amount numeric not null,
  payment_method text default 'Pretend Payment',
  payment_status text default 'Successful',
  transaction_reference text,
  payment_date date default current_date,
  payment_time time default current_time,
  order_id text references orders(order_id)
);

create table complaints (
  complaint_id text primary key,
  complaint_type text,
  description text,
  complaint_date date default current_date,
  resolution_status text default 'Open',
  order_id text references orders(order_id),
  customer_id text references customers(customer_id)
);

create table ratings (
  rating_id text primary key,
  rating_score integer check (rating_score between 1 and 5),
  comments text,
  rating_date date default current_date,
  order_id text references orders(order_id)
);

-- Seed data --------------------------------------------------------------

insert into restaurants values ('RES001','The Bear','Lagos, Nigeria','0800-000-0000','hello@thebear.rest');

insert into menus values
 ('MEN001','Food Menu','Mains, sides and desserts','In Circulation','RES001'),
 ('MEN002','Drinks Menu','Cocktails and mocktails','In Circulation','RES001');

insert into menu_items values
 ('MIT001','Jollof Rice','Smoky party-style jollof with plantain','food',14700,'Available',20,'MEN001'),
 ('MIT002','Suya Platter','Grilled beef skewers, spiced onions','food',32500,'Available',40,'MEN001'),
 ('MIT003','Cheesecake','Baked vanilla cheesecake, berry compote','food',17500,'Available',5,'MEN001'),
 ('MIT004','Safe Sex on the Beach','Peach, cranberry, orange, no alcohol','drink',13000,'Available',12,'MEN002'),
 ('MIT005','Virgin Pina Colada','Pineapple, coconut cream','drink',17000,'Available',17,'MEN002');

insert into waiters values ('WAI001','Bella','Zoey','0701-234-5678',null,'On Duty','RES001');
insert into chefs values ('CHF001','Hilda','Baci','0701-234-5679','RES001');
insert into bartenders values ('BTD001','Graham','Norton','0701-234-5680','RES001');
