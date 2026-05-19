-- =========================================================
-- Campaign Codex
-- Region edit management
-- =========================================================
--
-- Run this in Supabase SQL Editor before testing Region Edit.

drop function if exists public.update_region_record(
  uuid,
  uuid,
  text
);

create or replace function public.update_region_record(
  target_campaign_id uuid,
  target_region_id uuid,
  region_lore text default null
)
returns public.regions
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_record public.regions;
begin
  if auth.uid() is null then
    raise exception 'not authorized';
  end if;

  if not public.can_edit_campaign(target_campaign_id) then
    raise exception 'not authorized';
  end if;

  update public.regions
  set lore = nullif(trim(region_lore), ''),
      updated_at = now()
  where campaign_id = target_campaign_id
    and id = target_region_id
  returning * into updated_record;

  if updated_record.id is null then
    raise exception 'Region not found.';
  end if;

  return updated_record;
end;
$$;

grant execute on function public.update_region_record(
  uuid,
  uuid,
  text
) to authenticated;
