import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMultiMama } from "@/context/MultiMamaContext";

function useProductSearch(term, excludeIds = []) {
  const { currentMamaId } = useMultiMama();
  return useQuery({
    queryKey: ["product-search", currentMamaId, term, excludeIds],
    enabled: !!currentMamaId && typeof term === "string",
    queryFn: async () => {
      let q = supabase
        .from("produits")
        .select("id, nom, pmp, unite, tva")
        .eq("mama_id", currentMamaId)
        .eq("actif", true);
      if (term && term.trim()) {
        q = q.ilike("nom", `%${term.trim()}%`);
      }
      if (excludeIds?.length) {
        q = q.not("id", "in", `(${excludeIds.join(",")})`);
      }
      const { data, error } = await q.order("nom", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export default function ProductPickerModal({ open, onOpenChange, onSelect, excludeIds = [] }) {
  const [term, setTerm] = useState("");
  const { data: products = [] } = useProductSearch(term, excludeIds);

  useEffect(() => {
    if (!open) setTerm("");
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[#0B1220]/60 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(900px,95vw)] max-h-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <Dialog.Title className="text-sm font-semibold">Rechercher un produit</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-2 rounded-md hover:bg-muted">
                <X size={18} />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Tapez un nom de produit…"
              autoComplete="off"
            />
            <div className="border border-border rounded-lg max-h-60 overflow-y-auto">
              {products.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">Aucun résultat</div>
              ) : (
                products.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelect?.(p);
                      onOpenChange(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-accent"
                  >
                    <div className="font-medium">{p.nom}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.unite ? `Unité: ${p.unite} • ` : ""}PMP: {Number(p.pmp ?? 0).toFixed(2)}
                      {typeof p.tva === "number" ? ` • TVA: ${p.tva}%` : ""}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

  <div className="px-4 py-3 border-t border-border bg-muted/40 flex justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

