// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useDocuments } from "@/hooks/useDocuments";
import DocumentForm from "./DocumentForm.jsx";
import DocumentPreview from "@/components/documents/DocumentPreview";
import TableContainer from "@/components/ui/TableContainer";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";

export default function Documents() {
  const { mama_id, loading: authLoading } = useAuth();
  const { documents, listDocuments, uploadDocument, deleteDocument } = useDocuments();
  const [showUpload, setShowUpload] = useState(false);
  const [preview, setPreview] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) {
      listDocuments({
        search,
        type: typeFilter || undefined,
      });
    }
  }, [authLoading, mama_id, listDocuments, search, typeFilter]);

  const handleUploaded = async (file) => {
    await uploadDocument(file);
    await listDocuments();
    setShowUpload(false);
  };

  const handleDelete = async (id) => {
    await deleteDocument(id);
    await listDocuments();
  };

  if (authLoading) return <LoadingSpinner message="Chargement..." />;

  return (
    <div className="p-6 container mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Documents</h1>
        <Button onClick={() => setShowUpload(!showUpload)}>Ajouter un document</Button>
      </div>
      {showUpload && (
        <div className="mb-4">
          <DocumentForm onUploaded={handleUploaded} />
        </div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="form-input"
          placeholder="Recherche"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          className="form-input"
          placeholder="Type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>
      <TableContainer>
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="p-2">Nom</th>
              <th className="p-2">Type</th>
              <th className="p-2">Date</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const rows = [];
              const safeDocs = Array.isArray(documents) ? documents : [];
              for (let i = 0; i < safeDocs.length; i += 1) {
                const doc = safeDocs[i];
                const nom = doc.url?.split("/").pop() || "";
                rows.push(
                  <tr key={doc.id}>
                    <td className="p-2">{nom}</td>
                    <td className="p-2">{doc.type}</td>
                    <td className="p-2">{doc.created_at?.split("T")[0]}</td>
                    <td className="p-2 space-x-2">
                      <Button size="sm" variant="outline" onClick={() => setPreview(doc)}>
                        Prévisualiser
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(doc.id)}>
                        Supprimer
                      </Button>
                    </td>
                  </tr>
                );
              }
              return rows;
            })()}
          </tbody>
        </table>
      </TableContainer>
      {preview && (
        <DocumentPreview
          open={!!preview}
          url={preview.url}
          type={preview.type}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}
