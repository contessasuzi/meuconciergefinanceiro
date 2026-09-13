-- Meu Concierge Financeiro | MVP v0.1 | PostgreSQL/Supabase
create extension if not exists pgcrypto;

create table if not exists public.companies (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 name text not null, business_model text not null check (business_model in ('commerce','service','industry','professional','hybrid','other')),
 segment text, status text not null default 'active', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.financial_periods (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 reference_month date not null, gross_revenue numeric(14,2), transactions integer,
 revenue_quality text default 'confirmed' check (revenue_quality in ('confirmed','estimated','unknown')),
 status text not null default 'draft', created_at timestamptz not null default now(), unique(company_id,reference_month)
);
create table if not exists public.expense_items (
 id uuid primary key default gen_random_uuid(), period_id uuid not null references public.financial_periods(id) on delete cascade,
 category text not null, behavior text not null check (behavior in ('fixed','variable')), amount numeric(14,2),
 data_quality text not null default 'confirmed' check (data_quality in ('confirmed','estimated','unknown')),
 source text not null default 'user_input', created_at timestamptz not null default now()
);
create table if not exists public.owner_compensation (
 period_id uuid primary key references public.financial_periods(id) on delete cascade,
 current_amount numeric(14,2), desired_amount numeric(14,2), data_quality text not null default 'confirmed'
);
create table if not exists public.capacity (
 period_id uuid primary key references public.financial_periods(id) on delete cascade,
 monthly_work_hours numeric(10,2), billable_hours numeric(10,2),
 constraint billable_not_above_work check (billable_hours is null or monthly_work_hours is null or billable_hours <= monthly_work_hours)
);
create table if not exists public.goals (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 period_id uuid references public.financial_periods(id) on delete set null, desired_profit numeric(14,2), desired_reserve numeric(14,2), created_at timestamptz default now()
);
create table if not exists public.products_services (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 type text not null check(type in ('product','service')), name text not null, unit text, active boolean not null default true, created_at timestamptz default now()
);
create table if not exists public.pricing_versions (
 id uuid primary key default gen_random_uuid(), item_id uuid not null references public.products_services(id) on delete cascade,
 direct_cost numeric(14,4), sales_rates numeric(9,6), target_type text, target_value numeric(14,6), current_price numeric(14,2), recommended_price numeric(14,2), created_at timestamptz default now()
);
create table if not exists public.scenarios (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 base_period_id uuid references public.financial_periods(id) on delete set null, name text not null,
 assumptions_json jsonb not null default '{}'::jsonb, result_json jsonb not null default '{}'::jsonb, status text not null default 'simulation', created_at timestamptz default now()
);
create table if not exists public.insights (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 period_id uuid references public.financial_periods(id) on delete cascade, rule_id text not null, severity text not null,
 confidence text not null, message text not null, recommendation text, rule_version text not null default '1.0', created_at timestamptz default now()
);

alter table public.companies enable row level security;
alter table public.financial_periods enable row level security;
alter table public.expense_items enable row level security;
alter table public.owner_compensation enable row level security;
alter table public.capacity enable row level security;
alter table public.goals enable row level security;
alter table public.products_services enable row level security;
alter table public.pricing_versions enable row level security;
alter table public.scenarios enable row level security;
alter table public.insights enable row level security;

create policy companies_owner_all on public.companies for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy periods_owner_all on public.financial_periods for all using (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid()));
create policy expenses_owner_all on public.expense_items for all using (exists(select 1 from public.financial_periods p join public.companies c on c.id=p.company_id where p.id=period_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.financial_periods p join public.companies c on c.id=p.company_id where p.id=period_id and c.owner_user_id=auth.uid()));
create policy ownercomp_owner_all on public.owner_compensation for all using (exists(select 1 from public.financial_periods p join public.companies c on c.id=p.company_id where p.id=period_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.financial_periods p join public.companies c on c.id=p.company_id where p.id=period_id and c.owner_user_id=auth.uid()));
create policy capacity_owner_all on public.capacity for all using (exists(select 1 from public.financial_periods p join public.companies c on c.id=p.company_id where p.id=period_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.financial_periods p join public.companies c on c.id=p.company_id where p.id=period_id and c.owner_user_id=auth.uid()));
create policy goals_owner_all on public.goals for all using (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid()));
create policy items_owner_all on public.products_services for all using (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid()));
create policy pricing_owner_all on public.pricing_versions for all using (exists(select 1 from public.products_services i join public.companies c on c.id=i.company_id where i.id=item_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.products_services i join public.companies c on c.id=i.company_id where i.id=item_id and c.owner_user_id=auth.uid()));
create policy scenarios_owner_all on public.scenarios for all using (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid()));
create policy insights_owner_all on public.insights for all using (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid())) with check (exists(select 1 from public.companies c where c.id=company_id and c.owner_user_id=auth.uid()));
