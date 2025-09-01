import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useMamaSettings } from '@/hooks/useMamaSettings';
import { useFamilles } from '@/hooks/data/useFamilles';
import useSousFamilles from '@/hooks/data/useSousFamilles';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SousFamilles() {
  const { mamaId } = useMamaSettings();
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const [familleId, setFamilleId] = useState('');
  const [statut, setStatut] = useState('all'); // all | actifs | inactifs

  useMemo(() => {
    const id = setTimeout(() => setSearch(searchRaw), 250);
    return () => clearTimeout(id);
  }, [searchRaw]);

  const { data: familles = [] } = useFamilles();
  const {
    data: sousFamillesData = [],
    refetch,
    isLoading,
  } = useSousFamilles();

  const famillesList = useMemo(
    () => (Array.isArray(familles) ? familles : []),
    [familles]
  );

  const sousFamilles = useMemo(() => {
    const list = Array.isArray(sousFamillesData) ? sousFamillesData : [];
    return list
      .filter(sf =>
        search ? sf.nom.toLowerCase().includes(search.toLowerCase()) : true,
      )
      .filter(sf => (familleId ? sf.famille_id === familleId : true))
      .filter(sf => {
        if (statut === 'actifs') return sf.actif === true;
        if (statut === 'inactifs') return sf.actif === false;
        return true;
      });
  }, [sousFamillesData, search, familleId, statut]);

  const sousFamillesList = Array.isArray(sousFamilles) ? sousFamilles : [];

  // Helpers
  const famillesById = useMemo(() => {
    const map = new Map();
    for (const f of famillesList) {
      map.set(f.id, f);
    }
    return map;
  }, [famillesList]);

  async function createOrUpdate(sf) {
    const payload = {
      id: sf.id ?? undefined,
      nom: sf.nom?.trim(),
      famille_id: sf.famille_id || null,
      actif: sf.actif ?? true,
      mama_id: mamaId,
    };
    const q = sf.id
      ? supabase
          .from('sous_familles')
          .update(payload)
          .eq('id', sf.id)
          .eq('mama_id', mamaId)
          .select('id, nom, famille_id, mama_id, actif')
          .single()
      : supabase
          .from('sous_familles')
          .insert(payload)
          .eq('mama_id', mamaId)
          .select('id, nom, famille_id, mama_id, actif')
          .single();

    const { error } = await q;
    if (error) throw error;
    await refetch();
  }

  async function toggleActif(row) {
    const { error } = await supabase
      .from('sous_familles')
      .update({ actif: !row.actif })
      .eq('id', row.id)
      .eq('mama_id', mamaId);
    if (!error) refetch();
  }

  // Soft delete -> on passe actif à false (évite FK)
  async function archive(row) {
    const { error } = await supabase
      .from('sous_familles')
      .update({ actif: false })
      .eq('id', row.id)
      .eq('mama_id', mamaId);
    if (!error) refetch();
  }

  // UI minimal d'édition inline
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nom: '', famille_id: '', actif: true });

  function startNew() {
    setEditing(null);
    setForm({ nom: '', famille_id: familleId || '', actif: true });
  }
  function startEdit(row) {
    setEditing(row.id);
    setForm({ nom: row.nom, famille_id: row.famille_id || '', actif: !!row.actif });
  }
  async function save() {
    await createOrUpdate({
      id: editing ?? undefined,
      nom: form.nom,
      famille_id: form.famille_id || null,
      actif: form.actif,
    });
    startNew(); // reset
  }

  const familleOptions = [];
  for (const f of famillesList) {
    familleOptions.push(
      <option key={f.id} value={f.id}>
        {f.nom}
      </option>,
    );
  }

  const sousFamilleRows = [];
  for (const row of sousFamillesList) {
    sousFamilleRows.push(
      <tr key={row.id} className="border-t border-white/10">
        <td className="p-3">{row.nom}</td>
        <td className="p-3">{famillesById.get(row.famille_id)?.nom ?? '—'}</td>
        <td className="p-3">{row.actif ? 'Actif' : 'Inactif'}</td>
        <td className="p-3">
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => startEdit(row)}>Modifier</Button>
            <Button size="sm" variant="secondary" onClick={() => toggleActif(row)}>
              {row.actif ? 'Désactiver' : 'Activer'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => archive(row)}>Archiver</Button>
          </div>
        </td>
      </tr>,
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres en une ligne */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Recherche nom"
          value={searchRaw}
          onChange={(e) => setSearchRaw(e.target.value)}
          className="min-w-[220px]"
        />

        <select
          value={familleId}
          onChange={(e) => setFamilleId(e.target.value)}
          className="h-9 rounded-xl px-3 bg-black/20 border border-white/10"
        >
          <option value="">Toutes les familles</option>
          {familleOptions}
        </select>

        <select
          value={statut}
          onChange={(e) => setStatut(e.target.value)}
          className="h-9 rounded-xl px-3 bg-black/20 border border-white/10"
        >
          <option value="all">Tous</option>
          <option value="actifs">Actifs</option>
          <option value="inactifs">Inactifs</option>
        </select>

        <div className="ml-auto flex gap-2">
          <Button onClick={startNew}>Nouvelle sous-famille</Button>
        </div>
      </div>

      {/* Formulaire inline */}
      <div className="rounded-2xl border border-white/10 p-3 bg-white/5">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="Nom de la sous-famille"
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            className="min-w-[240px]"
          />
          <select
            value={form.famille_id}
            onChange={(e) => setForm((f) => ({ ...f, famille_id: e.target.value }))}
            className="h-9 rounded-xl px-3 bg-black/20 border border-white/10"
          >
            <option value="">— Choisir une famille —</option>
            {familleOptions}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!form.actif}
              onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
            />
            Actif
          </label>

          <Button onClick={save}>{editing ? 'Enregistrer' : 'Ajouter'}</Button>
          {editing && <Button variant="secondary" onClick={startNew}>Annuler</Button>}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="text-left p-3">Nom</th>
              <th className="text-left p-3">Famille</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="p-4">Chargement…</td></tr>
            )}
            {!isLoading && sousFamillesList.length === 0 && (
              <tr><td colSpan={4} className="p-4">Aucune sous-famille.</td></tr>
            )}
            {sousFamilleRows}
          </tbody>
        </table>
      </div>
    </div>
  );
}
