create or replace function public.prevent_dossier_update()
returns trigger
language plpgsql
as $$
begin
  raise exception 'dossiers are immutable once generated';
end;
$$;

drop trigger if exists prevent_dossier_update_trigger on public.dossiers;

create trigger prevent_dossier_update_trigger
  before update on public.dossiers
  for each row
  execute function public.prevent_dossier_update();
