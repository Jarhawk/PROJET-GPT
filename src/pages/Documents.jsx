import { useEffect, useState } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export default function Documents() {
  const { docs, loading, error, fetchDocs, addDoc } = useDocuments();
  const { mama_id, loading: authLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!authLoading && mama_id) {
      fetchDocs();
    }
  }, [authLoading, mama_id, fetchDocs]);

  const handleAdd = async (e) => {
    e.preventDefault();
    await addDoc({ title, file_url: url });
    setTitle("");
    setUrl("");
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
      </ul>
    </div>
  );
}
