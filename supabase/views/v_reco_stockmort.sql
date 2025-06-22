create or replace view v_reco_stockmort as
select * from v_reco_rotation
where jours_inactif > 30;

grant select on v_reco_stockmort to authenticated;
