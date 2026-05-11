begin;

create or replace view public.admin_job_offer_mapping_v1 as
select
  jo.id,
  jo.job_title,
  jo.business_id,
  jo.city,
  jo.salary_min,
  jo.salary_max,
  jo.created_at,
  jo.company_name,
  jo.submitted_at
from public.job_offers jo
where jo.status = 'approved'
  and jo.company_id is null
  and jo.business_id is null
  and jo.visibility in ('public', 'aggregate_only');

comment on view public.admin_job_offer_mapping_v1 is
  'Admin queue of approved Avisine job offers that still need employer mapping. submitted_at is exposed for the admin job-offer queue.';

commit;
