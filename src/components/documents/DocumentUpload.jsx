// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export default function DocumentUpload({
  onUploaded,
  entiteType = "",
  entiteId = null,
  categories = [],
}) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [categorie, setCategorie] = useState("");

  const handleFiles = (list) => {
    setFiles(Array.from(list || []));
  };

  const openDialog = () => {
    inputRef.current?.click();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const upload = async () => {
    for (const file of files) {
      await onUploaded?.(file, {
        categorie,
        entite_liee_type: entiteType,
        entite_liee_id: entiteId,
      });
    }
    setFiles([]);
    setCategorie("");
  };

  return (
    <div>
      <div
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer mb-2"
        onClick={openDialog}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p className="mb-2">Glissez-déposez vos fichiers ou cliquez pour sélectionner</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {files.length > 0 && (
          <p className="text-sm text-gray-300">{files.length} fichier(s) sélectionné(s)</p>
        )}
      </div>
      <select
        className="form-select w-full mb-2"
        value={categorie}
        onChange={(e) => setCategorie(e.target.value)}
      >
        <option value="">Catégorie</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      {files.length > 0 && (
        <Button onClick={upload}>Uploader</Button>
      )}
    </div>
  );
}
