-- Suggested RLS policies for missing tables
-- Ensure each policy is created in the database if not already present.

CREATE POLICY "select_fiches_techniques_mama" ON public.fiches_techniques
FOR SELECT USING (mama_id = request.jwt.claims->>'mama_id');

CREATE POLICY "select_fiche_lignes_mama" ON public.fiche_lignes
FOR SELECT USING (mama_id = request.jwt.claims->>'mama_id');

CREATE POLICY "select_menus_mama" ON public.menus
FOR SELECT USING (mama_id = request.jwt.claims->>'mama_id');

CREATE POLICY "select_menu_fiches_mama" ON public.menu_fiches
FOR SELECT USING (mama_id = request.jwt.claims->>'mama_id');

CREATE POLICY "select_menus_jour_mama" ON public.menus_jour
FOR SELECT USING (mama_id = request.jwt.claims->>'mama_id');

CREATE POLICY "select_menus_jour_fiches_mama" ON public.menus_jour_fiches
FOR SELECT USING (mama_id = request.jwt.claims->>'mama_id');
