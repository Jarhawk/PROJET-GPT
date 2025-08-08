// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.

export default function UtilisateurRow({ utilisateur, onEdit, onToggleActive, canEdit }) {
  return (
    <tr className={utilisateur.actif ? "" : "opacity-60"}>
      <td>{utilisateur.nom}</td>
      <td>{utilisateur.email}</td>
      <td>{utilisateur.role}</td>
      <td>{utilisateur.actif ? "Actif" : "Inactif"}</td>
      {canEdit && (
        <td>
          <button className="btn btn-sm mr-2" onClick={() => onEdit(utilisateur)}>Éditer</button>
          <button className="btn btn-sm" onClick={() => onToggleActive(utilisateur)}>
            {utilisateur.actif ? "Désactiver" : "Activer"}
          </button>
        </td>
      )}
    </tr>
  );
}
