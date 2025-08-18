-- RPC fn_facture_save: transactional save of invoice and lines

-- Utility tables
create table if not exists public.mouvements_stock (
  id uuid primary key default gen_random_uuid(),
  mama_id uuid not null,
  produit_id uuid not null,
  facture_id uuid,
  facture_ligne_id uuid,
  sens text not null check (sens in ('IN','OUT')),
  quantite numeric not null,
  pu_ht numeric not null,
  total_ht numeric not null,
  fait_le timestamptz not null default now()
);

create table if not exists public.fournisseur_achats_mois (
  mama_id uuid not null,
  fournisseur_id uuid not null,
  mois date not null,
  montant_ht numeric not null default 0,
  primary key (mama_id, fournisseur_id, mois)
);

-- Helper: apply IN stock movement and update stock & PMP
create or replace function public.fn_stock_in(
  p_mama_id uuid,
  p_produit_id uuid,
  p_facture_id uuid,
  p_facture_ligne_id uuid,
  p_quantite numeric,
  p_pu_ht numeric
) returns void
language plpgsql
as $$
declare
  v_stock numeric;
  v_pmp numeric;
  v_new_pmp numeric;
begin
  select coalesce(stock_reel,0), coalesce(pmp,0)
    into v_stock, v_pmp
  from produits
  where id = p_produit_id and mama_id = p_mama_id
  for update;

  if (coalesce(v_stock,0) + p_quantite) = 0 then
    v_new_pmp := 0;
  else
    v_new_pmp := round((v_stock*v_pmp + p_quantite*p_pu_ht) / nullif(v_stock + p_quantite,0), 4);
  end if;

  update produits
     set stock_reel = coalesce(stock_reel,0) + p_quantite,
         pmp        = v_new_pmp
   where id = p_produit_id and mama_id = p_mama_id;

  insert into mouvements_stock(mama_id, produit_id, facture_id, facture_ligne_id, sens, quantite, pu_ht, total_ht)
  values (p_mama_id, p_produit_id, p_facture_id, p_facture_ligne_id, 'IN', p_quantite, p_pu_ht, p_quantite*p_pu_ht);
end
$$;

-- Main RPC
create or replace function public.fn_facture_save(
  p_mama_id uuid,
  p_payload jsonb,
  p_apply_stock boolean default false
) returns jsonb
security definer
language plpgsql
as $$
declare
  v_id uuid;
  v_numero text;
  v_date date;
  v_fournisseur uuid;
  v_etat text;
  v_total_ht numeric := 0;
  v_total_ttc numeric := 0;
  v_lignes jsonb := coalesce(p_payload->'lignes','[]'::jsonb);
  v_apply boolean := coalesce(p_payload->>'apply_stock','false')::boolean or p_apply_stock;
  v_row jsonb;
  v_ligne_id uuid;
  v_qte numeric;
  v_pu numeric;
  v_tva numeric;
  v_produit uuid;
  v_mois date;
begin
  v_id          := coalesce((p_payload->'facture'->>'id')::uuid, gen_random_uuid());
  v_numero      := (p_payload->'facture'->>'numero');
  v_date        := (p_payload->'facture'->>'date_facture')::date;
  v_fournisseur := (p_payload->'facture'->>'fournisseur_id')::uuid;
  v_etat        := coalesce((p_payload->'facture'->>'etat'),'Brouillon');

  insert into factures as f (id, mama_id, numero, date_facture, fournisseur_id, etat, actif)
  values (v_id, p_mama_id, v_numero, v_date, v_fournisseur, v_etat, true)
  on conflict (id) do update
    set numero = excluded.numero,
        date_facture = excluded.date_facture,
        fournisseur_id = excluded.fournisseur_id,
        etat = excluded.etat,
        actif = true;

  delete from facture_lignes where facture_id = v_id and mama_id = p_mama_id;

  for v_row in select * from jsonb_array_elements(v_lignes)
  loop
    v_ligne_id := coalesce((v_row->>'id')::uuid, gen_random_uuid());
    v_produit  := (v_row->>'produit_id')::uuid;
    v_qte      := coalesce((v_row->>'quantite')::numeric,0);
    v_pu       := coalesce((v_row->>'pu_ht')::numeric,0);
    v_tva      := coalesce((v_row->>'tva')::numeric,0);

    insert into facture_lignes(id, mama_id, facture_id, produit_id, quantite, pu_ht, tva, total_ht)
    values (v_ligne_id, p_mama_id, v_id, v_produit, v_qte, v_pu, v_tva, v_qte*v_pu);

    v_total_ht  := v_total_ht + (v_qte*v_pu);
    v_total_ttc := v_total_ttc + (v_qte*v_pu*(1 + v_tva/100));

    if v_apply and v_qte > 0 then
      perform public.fn_stock_in(p_mama_id, v_produit, v_id, v_ligne_id, v_qte, v_pu);
    end if;
  end loop;

  update factures
     set total_ht = v_total_ht,
         total_ttc = v_total_ttc
   where id = v_id and mama_id = p_mama_id;

  v_mois := date_trunc('month', v_date)::date;
  insert into fournisseur_achats_mois(mama_id, fournisseur_id, mois, montant_ht)
  values (p_mama_id, v_fournisseur, v_mois, v_total_ht)
  on conflict (mama_id, fournisseur_id, mois)
  do update set montant_ht = fournisseur_achats_mois.montant_ht + excluded.montant_ht;

  return (
    select jsonb_build_object(
      'facture', to_jsonb(f),
      'lignes', coalesce(jsonb_agg(l order by l.id), '[]'::jsonb)
    )
    from factures f
    left join facture_lignes l on l.facture_id = f.id and l.mama_id = f.mama_id
    where f.id = v_id and f.mama_id = p_mama_id
    group by f.*
  );
exception
  when others then
    raise exception 'FN_FACTURE_SAVE_FAILED: %', SQLERRM using hint = 'payload='||p_payload::text;
end
$$;

revoke all on function public.fn_facture_save(uuid, jsonb, boolean) from public;
grant execute on function public.fn_facture_save(uuid, jsonb, boolean) to authenticated, service_role;
