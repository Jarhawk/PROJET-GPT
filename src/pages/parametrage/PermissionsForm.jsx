// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import supabase from '@/lib/supabase';
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { MODULES as MODULE_LIST } from '@/config/modules';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const MODULES = MODULE_LIST.map((m) => ({ nom: m.label, cle: m.key }));

const DROITS = [
{ nom: 'Lecture', cle: 'read' },
{ nom: 'Création', cle: 'create' },
{ nom: 'Modification', cle: 'update' },
{ nom: 'Suppression', cle: 'delete' }];


export default function PermissionsForm({ role, onClose, onSaved }) {
  const { mama_id, role: myRole, loading: authLoading } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPermissions();
  }, [role]);

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  const fetchPermissions = async () => {
    try {
      let query = supabase.
      from('permissions').
      select('*').
      eq('role_id', role.id);
      if (myRole !== 'superadmin') query = query.eq('mama_id', mama_id);
      const { data, error } = await query;
      if (error) throw error;
      setPermissions(data || []);
    } catch (err) {
      toast.error(err.message || 'Erreur chargement permissions');
    }
  };

  const hasPermission = (module_cle, droit_cle) => {
    return permissions.some(
      (p) => p.module === module_cle && p.droit === droit_cle
    );
  };

  const togglePermission = async (module_cle, droit_cle) => {
    if (saving) return;
    try {
      setSaving(true);
      const exists = hasPermission(module_cle, droit_cle);
      let error = null;
      if (exists) {
        let query = supabase.
        from('permissions').
        delete().
        eq('role_id', role.id).
        eq('module', module_cle).
        eq('droit', droit_cle);
        if (myRole !== 'superadmin') query = query.eq('mama_id', mama_id);
        const { error: err } = await query;
        error = err;
      } else {
        const { error: err } = await supabase.from('permissions').insert([
        {
          role_id: role.id,
          module: module_cle,
          droit: droit_cle,
          mama_id
        }]
        );
        error = err;
      }
      if (error) throw error;
      fetchPermissions();
      toast.success('Permission modifiée');
      onSaved?.();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la modification.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard title={`Permissions pour : ${role.nom}`}>
            <div className="overflow-x-auto mb-4">
        <table className="min-w-full table-auto text-center">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left">Module</th>
              {DROITS.map((droit) =>
              <th key={droit.cle} className="px-2 py-1">
                  {droit.nom}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {MODULES.map((module) =>
            <tr key={module.cle}>
                <td className="px-2 py-1 text-left">{module.nom}</td>
                {DROITS.map((droit) =>
              <td key={droit.cle} className="px-2 py-1">
                    <input
                  type="checkbox"
                  checked={hasPermission(module.cle, droit.cle)}
                  disabled={saving}
                  onChange={() => togglePermission(module.cle, droit.cle)} />

                  </td>
              )}
              </tr>
            )}
          </tbody>
        </table>
        {permissions.length === 0 &&
        <div className="text-gray-400 py-4">
            Aucune permission attribuée à ce rôle.
          </div>
        }
      </div>
      <div className="flex gap-4 mt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={saving}>

          Fermer
        </Button>
      </div>
    </GlassCard>);

}