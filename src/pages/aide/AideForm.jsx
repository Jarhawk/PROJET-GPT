// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState } from 'react';
import ModalGlass from '@/components/ui/ModalGlass';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/ui/GlassCard';
import { useAide } from '@/hooks/useAide';
import { Toaster, toast } from 'react-hot-toast';

export default function AideForm({ article, onClose, onSaved }) {
  const isEdit = !!article?.id;
  const { addArticle, updateArticle } = useAide();
  const [values, setValues] = useState({
    titre: article?.titre || '',
    contenu: article?.contenu || '',
    categorie: article?.categorie || '',
    lien_page: article?.lien_page || '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    let res;
    if (isEdit) {
      res = await updateArticle(article.id, values);
    } else {
      res = await addArticle(values);
    }
    if (res?.error) {
      toast.error(res.error.message || res.error);
    } else {
      toast.success('Article enregistré');
      onSaved?.(res.data);
      onClose?.();
    }
    setSaving(false);
  };

  return (
    <ModalGlass open={true} onClose={onClose}>
      <GlassCard title={isEdit ? "Modifier l'article" : 'Nouvel article'}>
        <form onSubmit={handleSubmit} className="space-y-2">
        <Toaster />
        <h3 className="text-lg font-semibold mb-2">
          {isEdit ? "Modifier l'article" : 'Nouvel article'}
        </h3>
        <Input
          className="w-full"
          name="titre"
          placeholder="Titre"
          value={values.titre}
          onChange={handleChange}
          required
        />
        <Input
          className="w-full"
          name="categorie"
          placeholder="Catégorie"
          value={values.categorie}
          onChange={handleChange}
        />
        <Input
          className="w-full"
          name="lien_page"
          placeholder="Page liée"
          value={values.lien_page}
          onChange={handleChange}
        />
        <textarea
          className="textarea h-32"
          name="contenu"
          placeholder="Contenu"
          value={values.contenu}
          onChange={handleChange}
          required
        />
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>Enregistrer</Button>
          <Button type="button" onClick={onClose} disabled={saving} className="bg-transparent border border-white">
            Annuler
          </Button>
        </div>
        </form>
      </GlassCard>
    </ModalGlass>
  );
}
