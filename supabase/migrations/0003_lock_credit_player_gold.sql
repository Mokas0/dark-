-- credit_player_gold is invoked by Netlify functions using the service role key.
-- Strip EXECUTE from anon/authenticated so it can't be called from the browser
-- via /rpc/credit_player_gold (closes anon_security_definer_function_executable).

revoke execute on function public.credit_player_gold(uuid, int) from public;
revoke execute on function public.credit_player_gold(uuid, int) from anon;
revoke execute on function public.credit_player_gold(uuid, int) from authenticated;
grant  execute on function public.credit_player_gold(uuid, int) to service_role;
