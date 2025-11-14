-- ENUMY
create type if not exists customer_status as enum ('lead', 'customer');
create type if not exists unit_status as enum ('in_stock', 'sold', 'reserved', 'demo', 'scrapped');
create type if not exists unit_location_type as enum ('warehouse', 'customer');
create type if not exists sale_payment_method as enum ('cash', 'transfer', 'card', 'other');
create type if not exists sale_item_type as enum ('dumper', 'part');

-- CUSTOMERS (včetně leadů)
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  street text,
  city text,
  zip text,
  country text default 'CZ',
  status customer_status not null default 'lead',
  source text,
  next_action_at date,
  is_hot boolean default false,
  note text,
  created_at timestamptz default now()
);

-- MODELY PRODUKTŮ (např. EH50)
create table if not exists product_models (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  default_sale_price numeric,
  type text default 'dumper',
  created_at timestamptz default now(),
  unique (code)
);

-- KONKRÉTNÍ KUSY VOZÍKŮ
create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  product_model_id uuid not null references product_models(id) on delete restrict,
  serial_number text not null unique,
  status unit_status not null default 'in_stock',
  location_type unit_location_type not null default 'warehouse',
  location_customer_id uuid references customers(id) on delete set null,
  warehouse_location text,
  purchase_price numeric,
  purchase_currency text default 'CZK',
  purchase_date date,
  sale_id uuid,
  note text,
  created_at timestamptz default now()
);

-- PRODEJE (HLAVIČKA)
create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete restrict,
  sale_date date not null default current_date,
  total_price numeric,
  currency text default 'CZK',
  payment_method sale_payment_method default 'transfer',
  invoice_number text,
  note text,
  created_at timestamptz default now()
);

alter table units
  add constraint if not exists units_sale_fk
  foreign key (sale_id) references sales(id) on delete set null;

-- PRODEJNÍ POLOŽKY
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  item_type sale_item_type not null,
  unit_id uuid references units(id) on delete set null,
  quantity numeric not null default 1,
  unit_price numeric not null,
  discount numeric default 0,
  note text
);

-- INDEXY
create index if not exists idx_customers_status on customers(status);
create index if not exists idx_units_status on units(status);
create index if not exists idx_units_product_model on units(product_model_id);
create index if not exists idx_sales_customer on sales(customer_id);
create index if not exists idx_sales_date on sales(sale_date);
