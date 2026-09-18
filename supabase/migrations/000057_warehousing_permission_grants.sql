-- Migration 000048 granted warehousing.* to director/manager/team_leader role
-- keys, but roles are org-scoped — orgs whose roles were seeded after (or
-- independently of) that migration never received the grants. Re-apply the
-- intended grants across every org's roles by key.

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key in ('director', 'manager')
  and p.key in ('warehousing.manage', 'warehousing.view', 'warehousing.transfer')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
cross join public.permissions p
where r.key = 'team_leader'
  and p.key in ('warehousing.view', 'warehousing.transfer')
on conflict do nothing;
