-- Row Level Security only *restricts* an existing SQL privilege — it does
-- not grant one. Every RLS policy above is meaningless without the base
-- table-level GRANT to the `authenticated` role, which Postgres does not
-- provide by default for tables created by migrations. SECURITY DEFINER
-- RPCs (create_organization, invite_org_member, ...) never hit this because
-- they execute as their owner, not as `authenticated` — but ordinary direct
-- table access from the app (every Server Component/Action query) does.
--
-- `service_role` needs the same base GRANT even though it bypasses RLS
-- (BYPASSRLS only skips policy evaluation — the underlying SQL privilege
-- check happens first regardless). Every backoffice query in
-- services/platform.ts uses the service-role client, so this covers it too.
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated, service_role;

-- Keep this true for every future migration's tables too.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
