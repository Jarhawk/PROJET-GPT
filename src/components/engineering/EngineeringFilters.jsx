// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export default function EngineeringFilters({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        type="month"
        value={filters.periode.slice(0, 7)}
        onChange={e => update('periode', e.target.value + '-01')}
        className="form-input"
      />
      <input
        className="form-input"
        placeholder="Famille"
        value={filters.famille}
        onChange={e => update('famille', e.target.value)}
      />
      <select
        className="form-input"
        value={filters.actif}
        onChange={e => update('actif', e.target.value)}
      >
        <option value="">Tous</option>
        <option value="actif">Actifs</option>
        <option value="inactif">Inactifs</option>
      </select>
    </div>
  )
}
