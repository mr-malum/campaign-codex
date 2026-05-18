-- =========================================================
-- Campaign Codex
-- Create POI with next readable ref code
-- =========================================================
--
-- Run this in Supabase SQL Editor before testing POI creation.

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

create or replace function public.create_poi_with_next_ref_code(
  target_campaign_id uuid,
  poi_name text,
  poi_type text,
  poi_hex_id uuid,
  poi_notoriety_tier text default null,
  poi_population text default null,
  poi_lore text default null,
  poi_visibility public.content_visibility default 'shared'
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

  if poi_hex_id is null then
    raise exception 'POI hex is required.';
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
  public.content_visibility
) to authenticated;
