// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/SmartDialog';
import { useHelp } from '@/context/HelpProvider';

export default function DocumentationPanel({ open, onOpenChange }) {
  const { docs, fetchDocs } = useHelp();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) fetchDocs({ search });
  }, [open, search, fetchDocs]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed right-0 top-0 bottom-0 w-96 bg-white/10 border border-white/20 backdrop-blur-xl p-4 overflow-y-auto">
        <DialogTitle className="font-bold mb-2">Documentation</DialogTitle>
        <DialogDescription className="sr-only">
          Documentation interne
        </DialogDescription>
        <input
          className="form-input w-full mb-4"
          placeholder="Recherche..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ul className="space-y-4">
          {docs.map((d) => (
            <li key={d.id} className="text-sm">
              <h4 className="font-semibold mb-1">{d.titre}</h4>
              <div dangerouslySetInnerHTML={{ __html: d.contenu }} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
