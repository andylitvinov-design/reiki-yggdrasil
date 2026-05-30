alter table public.profile_cabinet_services
  add column if not exists delivery_auto_enabled boolean not null default true,
  add column if not exists delivery_master_enabled boolean not null default true,
  add column if not exists delivery_both_enabled boolean not null default true,
  add column if not exists price_auto_amount numeric null,
  add column if not exists price_master_amount numeric null,
  add column if not exists price_both_amount numeric null,
  add column if not exists template_image_url text not null default '',
  add column if not exists template_image_bucket text null,
  add column if not exists template_image_path text null;

alter table public.profile_cabinet_service_orders
  add column if not exists delivery_mode text not null default 'auto_template',
  add column if not exists auto_result_image_url text not null default '',
  add column if not exists auto_result_image_bucket text null,
  add column if not exists auto_result_image_path text null,
  add column if not exists master_result_image_url text not null default '',
  add column if not exists master_result_image_bucket text null,
  add column if not exists master_result_image_path text null,
  add column if not exists final_result_image_url text not null default '',
  add column if not exists final_result_image_bucket text null,
  add column if not exists final_result_image_path text null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profile_cabinet_service_orders_delivery_mode_check'
      and conrelid = 'public.profile_cabinet_service_orders'::regclass
  ) then
    alter table public.profile_cabinet_service_orders
      add constraint profile_cabinet_service_orders_delivery_mode_check
      check (delivery_mode in ('auto_template', 'master_finish', 'both'));
  end if;
end $$;

create index if not exists profile_cabinet_service_orders_delivery_mode_idx
  on public.profile_cabinet_service_orders(delivery_mode);

update public.profile_cabinet_services
set
  template_image_url = coalesce(nullif(template_image_url, ''), image_url, ''),
  template_image_bucket = coalesce(template_image_bucket, image_bucket),
  template_image_path = coalesce(template_image_path, image_path),
  price_auto_amount = coalesce(price_auto_amount, price_amount)
where
  template_image_url = ''
  or price_auto_amount is null;
