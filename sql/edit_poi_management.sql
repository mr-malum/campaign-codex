-- =========================================================
-- Campaign Codex
-- POI / grouped POI edit management
-- =========================================================
--
-- Run this in Supabase SQL Editor before testing POI Edit.

drop function if exists public.update_poi_record(
  uuid,
  uuid,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text
);

drop function if exists public.update_poi_group_record(
  uuid,
  uuid,
  text,
  text,
  text
);

drop function if exists public.set_poi_group_parent(
  uuid,
  uuid,
  uuid
);

create or replace function public.update_poi_record(
  target_campaign_id uuid,
  target_poi_id uuid,
  poi_name text,
  new_poi_type text,
  poi_hex_id uuid,
  new_poi_group_id uuid default null,
  new_poi_notoriety_tier text default null,
  new_poi_population text default null,
  new_poi_lore text default null
)
returns public.pois
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_record public.pois;
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

  if nullif(trim(new_poi_type), '') is null then
    raise exception 'POI type is required.';
  end if;

  if nullif(trim(new_poi_notoriety_tier), '') is null then
    raise exception 'POI notoriety is required.';
  end if;

  if lower(trim(new_poi_type)) = 'settlement'
    and nullif(trim(new_poi_population), '') is null then
    raise exception 'Population is required for Settlements.';
  end if;

  if poi_hex_id is null then
    raise exception 'POI hex is required.';
  end if;

  if not exists (
    select 1
    from public.pois p
    where p.campaign_id = target_campaign_id
      and p.id = target_poi_id
  ) then
    raise exception 'POI not found.';
  end if;

  if not exists (
    select 1
    from public.hexes h
    where h.campaign_id = target_campaign_id
      and h.id = poi_hex_id
  ) then
    raise exception 'Selected hex does not belong to this campaign.';
  end if;

  if new_poi_group_id is not null and not exists (
    select 1
    from public.poi_groups pg
    where pg.campaign_id = target_campaign_id
      and pg.id = new_poi_group_id
  ) then
    raise exception 'Selected POI group does not belong to this campaign.';
  end if;

  update public.pois
  set name = trim(poi_name),
      poi_type = trim(new_poi_type),
      hex_id = poi_hex_id,
      poi_group_id = new_poi_group_id,
      notoriety_tier = nullif(trim(new_poi_notoriety_tier), ''),
      population = nullif(trim(new_poi_population), ''),
      lore = nullif(trim(new_poi_lore), ''),
      updated_at = now()
  where campaign_id = target_campaign_id
    and id = target_poi_id
  returning * into updated_record;

  return updated_record;
end;
$$;

grant execute on function public.update_poi_record(
  uuid,
  uuid,
  text,
  text,
  uuid,
  uuid,
  text,
  text,
  text
) to authenticated;


create or replace function public.update_poi_group_record(
  target_campaign_id uuid,
  target_poi_group_id uuid,
  group_name text,
  new_group_type text,
  new_group_lore text default null
)
returns public.poi_groups
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_record public.poi_groups;
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

  if nullif(trim(new_group_type), '') is null then
    raise exception 'Grouped POI type is required.';
  end if;

  update public.poi_groups
  set name = trim(group_name),
      group_type = trim(new_group_type),
      lore = nullif(trim(new_group_lore), ''),
      updated_at = now()
  where campaign_id = target_campaign_id
    and id = target_poi_group_id
  returning * into updated_record;

  if updated_record.id is null then
    raise exception 'Grouped POI not found.';
  end if;

  return updated_record;
end;
$$;

grant execute on function public.update_poi_group_record(
  uuid,
  uuid,
  text,
  text,
  text
) to authenticated;


create or replace function public.set_poi_group_parent(
  target_campaign_id uuid,
  target_poi_id uuid,
  target_poi_group_id uuid default null
)
returns public.pois
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_record public.pois;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if not public.can_edit_campaign(target_campaign_id) then
    raise exception 'not authorized';
  end if;

  if not exists (
    select 1
    from public.pois p
    where p.campaign_id = target_campaign_id
      and p.id = target_poi_id
  ) then
    raise exception 'POI not found.';
  end if;

  if target_poi_group_id is not null and not exists (
    select 1
    from public.poi_groups pg
    where pg.campaign_id = target_campaign_id
      and pg.id = target_poi_group_id
  ) then
    raise exception 'Selected POI group does not belong to this campaign.';
  end if;

  update public.pois
  set poi_group_id = target_poi_group_id,
      updated_at = now()
  where campaign_id = target_campaign_id
    and id = target_poi_id
  returning * into updated_record;

  return updated_record;
end;
$$;

grant execute on function public.set_poi_group_parent(uuid, uuid, uuid)
  to authenticated;
