-- RPC get_facture_complete: returns invoice header and lines with product details
create or replace function public.get_facture_complete(p_id uuid)
returns jsonb
language plpgsql
stable
security definer
as $$
declare
  v_header jsonb;
  v_lignes jsonb;
begin
  select to_jsonb(f.*)
    into v_header
  from public.factures f
  where f.id = p_id
    and f.mama_id = current_user_mama_id()
  limit 1;

  select coalesce(
      jsonb_agg(to_jsonb(l.*) || jsonb_build_object('produit', to_jsonb(p.*))),
      '[]'::jsonb
    )
    into v_lignes
  from public.facture_lignes l
  left join public.produits p on p.id = l.produit_id
  where l.facture_id = p_id
    and l.mama_id = current_user_mama_id()
  order by l.position asc;

  return jsonb_build_object('header', v_header, 'lignes', v_lignes);
end;
$$;

grant execute on function public.get_facture_complete(uuid) to authenticated;
