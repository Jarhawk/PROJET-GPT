// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
export function FormActions({ onCancel, submitLabel = "Enregistrer", disabled }) {
  return (
    <div className="sm:col-span-2 mt-2 flex items-center justify-end gap-2">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-gray-600 hover:underline"
        >
          Annuler
        </button>
      )}
      <button
        type="submit"
        disabled={disabled}
        className="inline-flex items-center rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </div>
  );
}

export default FormActions;

