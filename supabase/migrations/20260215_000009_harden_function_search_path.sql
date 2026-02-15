-- Security hardening: make trigger function search_path explicit and immutable.
-- Addresses Supabase linter warning: function_search_path_mutable.

do $$
begin
  if to_regprocedure('public.set_updated_at()') is not null then
    execute 'alter function public.set_updated_at() set search_path = public';
  end if;

  if to_regprocedure('public.set_admin_users_updated_at()') is not null then
    execute 'alter function public.set_admin_users_updated_at() set search_path = public';
  end if;

  if to_regprocedure('public.set_app_settings_updated_at()') is not null then
    execute 'alter function public.set_app_settings_updated_at() set search_path = public';
  end if;
end $$;
