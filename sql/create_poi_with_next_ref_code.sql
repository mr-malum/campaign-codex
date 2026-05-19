-- =========================================================
-- Campaign Codex
-- Create POI with next readable ref code
-- =========================================================
--
-- Run this in Supabase SQL Editor before testing POI creation.

alter table public.pois
  add column if not exists created_by uuid references auth.users(id) on delete set null;

alter table public.poi_groups
  add column if not exists created_by uuid references auth.users(id) on delete set null;

drop function if exists public.create_poi_with_next_ref_code(
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  public.content_visibility
);

drop function if exists public.create_poi_with_next_ref_code(
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  public.content_visibility,
  uuid
);

drop function if exists public.create_poi_group_with_slug(
  uuid,
  text,
  text,
  text,
  text,
  public.content_visibility
);

drop function if exists public.create_poi_group_with_slug(
  uuid,
  text,
  text,
  uuid,
  text,
  public.content_visibility
);

create or replace function public.create_poi_with_next_ref_code(
  target_campaign_id uuid,
  poi_name text,
  poi_type text,
  poi_hex_id uuid,
  poi_notoriety_tier text default null,
  poi_population text default null,
  poi_lore text default null,
  poi_visibility public.content_visibility default 'shared',
  poi_group_id uuid default null
)
returns public.pois
language plpgsql
security definer
set search_path = public
as $$
declare
  next_number integer;
  next_ref_code text;
  created_record public.pois;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if not public.can_edit_campaign(target_campaign_id) then
    raise exception 'not authorized';
  end if;

  if nullif(trim(poi_name), '') is null then
    raise exception 'POI name is required.';
  end if;

  if nullif(trim(poi_type), '') is null then
    raise exception 'POI type is required.';
  end if;

  if nullif(trim(poi_notoriety_tier), '') is null then
    raise exception 'POI notoriety is required.';
  end if;

  if lower(trim(poi_type)) = 'settlement'
    and nullif(trim(poi_population), '') is null then
    raise exception 'Population is required for Settlements.';
  end if;

  if poi_hex_id is null then
    raise exception 'POI hex is required.';
  end if;

  if poi_group_id is not null and not exists (
    select 1
    from public.poi_groups pg
    where pg.campaign_id = target_campaign_id
      and pg.id = poi_group_id
  ) then
    raise exception 'Selected POI group does not belong to this campaign.';
  end if;

  if not exists (
    select 1
    from public.hexes h
    where h.campaign_id = target_campaign_id
      and h.id = poi_hex_id
  ) then
    raise exception 'Selected hex does not belong to this campaign.';
  end if;

  select coalesce(max(substring(ref_code from '^POI-([0-9]+)$')::integer), 0) + 1
    into next_number
  from public.pois
  where campaign_id = target_campaign_id
    and ref_code ~ '^POI-[0-9]+$';

  next_ref_code := 'POI-' || lpad(next_number::text, 4, '0');

  insert into public.pois (
    campaign_id,
    ref_code,
    name,
    hex_id,
    poi_group_id,
    poi_type,
    notoriety_tier,
    population,
    lore,
    visibility,
    created_by
  )
  values (
    target_campaign_id,
    next_ref_code,
    trim(poi_name),
    poi_hex_id,
    poi_group_id,
    trim(poi_type),
    nullif(trim(poi_notoriety_tier), ''),
    nullif(trim(poi_population), ''),
    nullif(trim(poi_lore), ''),
    poi_visibility,
    auth.uid()
  )
  returning * into created_record;

  return created_record;
end;
$$;

grant execute on function public.create_poi_with_next_ref_code(
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  public.content_visibility,
  uuid
) to authenticated;


-- ---------------------------------------------------------
-- Create grouped POI parent
-- ---------------------------------------------------------

create or replace function public.create_poi_group_with_slug(
  target_campaign_id uuid,
  group_name text,
  group_type text,
  initial_child_poi_id uuid,
  group_lore text default null,
  group_visibility public.content_visibility default 'shared'
)
returns public.poi_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  base_slug text;
  candidate_slug text;
  suffix integer := 1;
  created_record public.poi_groups;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if not public.can_edit_campaign(target_campaign_id) then
    raise exception 'not authorized';
  end if;

  if nullif(trim(group_name), '') is null then
    raise exception 'Grouped POI name is required.';
  end if;

  if nullif(trim(group_type), '') is null then
    raise exception 'Grouped POI type is required.';
  end if;

  if initial_child_poi_id is null then
    raise exception 'Initial child Area is required.';
  end if;

  if not exists (
    select 1
    from public.pois p
    where p.campaign_id = target_campaign_id
      and p.id = initial_child_poi_id
      and p.poi_group_id is null
  ) then
    raise exception 'Selected child Area does not belong to this campaign or is already grouped.';
  end if;

  base_slug := regexp_replace(upper(trim(group_name)), '[^A-Z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  if base_slug = '' then
    base_slug := 'POI-GROUP';
  end if;

  candidate_slug := base_slug;

  while exists (
    select 1
    from public.poi_groups pg
    where pg.campaign_id = target_campaign_id
      and pg.slug = candidate_slug
  ) loop
    suffix := suffix + 1;
    candidate_slug := base_slug || '-' || suffix::text;
  end loop;

  insert into public.poi_groups (
    campaign_id,
    slug,
    name,
    group_type,
    lore,
    visibility,
    created_by
  )
  values (
    target_campaign_id,
    candidate_slug,
    trim(group_name),
    trim(group_type),
    nullif(trim(group_lore), ''),
    group_visibility,
    auth.uid()
  )
  returning * into created_record;

  update public.pois
  set poi_group_id = created_record.id,
      updated_at = now()
  where campaign_id = target_campaign_id
    and id = initial_child_poi_id;

  return created_record;
end;
$$;

grant execute on function public.create_poi_group_with_slug(
  uuid,
  text,
  text,
  uuid,
  text,
  public.content_visibility
) to authenticated;
