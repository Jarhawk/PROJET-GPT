import { useEffect, useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import toast from "react-hot-toast";

export default function Documents() {
  const { docs, loading, error, fetchDocs, addDoc } = useDocuments();
  const { mama_id, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchDocs({ search });
    }
  }, [authLoading, mama_id, search, fetchDocs]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toast.error("Titre et URL requis");
      return;
    }
    try {
      await addDoc({ title, file_url: url });
      toast.success("Document ajouté");
      await fetchDocs({ search });
      setTitle("");
      setUrl("");
    } catch (err) {
      console.error("Erreur ajout document:", err);
      toast.error("Erreur lors de l'enregistrement.");
    }
  };


  if (loading) return <div className="p-8">Chargement...</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8 container mx-auto">
      <h1 className="text-2xl font-bold mb-4">Documents</h1>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4 items-end">
        <input
          className="input"
          placeholder="Titre"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="input flex-1"
          placeholder="URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <Button type="submit">Ajouter</Button>
      </form>
      <div className="relative w-64 mb-4">
        <input
          type="search"
          className="input w-full pl-8"
          placeholder="Recherche document"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Search className="absolute left-2 top-2.5 text-white" size={18} />
      </div>
      <ul className="list-disc pl-6">
        {docs.map((d) => (
          <li key={d.id} className="mb-1">
            <a
              href={d.file_url}
              target="_blank"
              rel="noreferrer"
              className="text-mamastock-gold underline"
            >
              {d.title}
            </a>
          </li>
        ))}
        {docs.length === 0 && (
          <li className="text-gray-400">Aucun résultat trouvé.</li>
        )}
      </ul>
    </div>
  );
}
