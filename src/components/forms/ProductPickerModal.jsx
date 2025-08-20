import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import supabase from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ProductPickerModal({ open, onOpenChange, mamaId, onPick, excludeIds = [] }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
    else { setQ(""); setRows([]); setActive(0); }
  }, [open]);

  async function search(term) {
    if (!mamaId || !term) { setRows([]); return; }

    // 1/ Essaye la vue enrichie si disponible (unite, tva, default_zone_id)
    let data = [];
    let { data: vData, error: vErr } = await supabase
      .from("v_produits_actifs")
      .select("id, nom, unite, tva, default_zone_id, stock_reel, pmp")
      .eq("mama_id", mamaId)
      .ilike("nom", `%${term}%`)
      .order("nom", { ascending: true })
      .limit(50);

    if (!vErr && Array.isArray(vData)) data = vData;

    // 2/ Fallback minimal sur produits si la vue n’existe pas / colonnes manquantes
    if (!data.length) {
      const { data: pData, error: pErr } = await supabase
        .from("produits")
        .select("id, nom, stock_reel, pmp")
        .eq("mama_id", mamaId)
        .eq("actif", true)
        .ilike("nom", `%${term}%`)
        .order("nom", { ascending: true })
        .limit(50);
      if (!pErr && Array.isArray(pData)) {
        data = pData.map(p => ({
          ...p,
          unite: null,
          tva: null,
          default_zone_id: null,
        }));
      }
    }

    // Exclure les produits déjà présents
    if (excludeIds?.length) {
      const set = new Set(excludeIds);
      data = data.filter(r => !set.has(r.id));
    }
    setRows(data);
    setActive(0);
  }

  useEffect(() => {
    const term = (q || "").trim();
    if (!open) return;
    if (!term) { setRows([]); return; }
    let t = setTimeout(() => search(term), 120);
    return () => clearTimeout(t);
  }, [q, open, mamaId, excludeIds]);

  const scrollTo = (i) => {
    const c = listRef.current;
    const el = c?.querySelector(`[data-idx="${i}"]`);
    if (!c || !el) return;
    const top = el.offsetTop - c.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top < c.scrollTop) c.scrollTop = top;
    else if (bottom > c.scrollTop + c.clientHeight) c.scrollTop = bottom - c.clientHeight;
  };

  const onKey = (e) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); const i = Math.min(active + 1, rows.length - 1); setActive(i); scrollTo(i); }
    else if (e.key === "ArrowUp") { e.preventDefault(); const i = Math.max(active - 1, 0); setActive(i); scrollTo(i); }
    else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      if (rows[active]) { onPick(rows[active]); onOpenChange(false); }
    } else if (e.key === "Escape") onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* Overlay clair, dans le thème */}
        <Dialog.Overlay className="fixed inset-0 bg-background/45 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[min(760px,95vw)] max-h-[85vh] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
            <Dialog.Title className="text-sm font-semibold">Rechercher un produit</Dialog.Title>
            <Dialog.Close asChild><button className="p-2 rounded-md hover:bg-muted"><X size={18} /></button></Dialog.Close>
          </div>

          <div className="p-4">
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tapez un nom de produit…"
              onKeyDown={onKey}
              autoComplete="off"
              name="no-autofill"
            />
            <div ref={listRef} className="mt-3 max-h-[55vh] overflow-auto rounded-lg border border-border">
              {rows.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">Aucun résultat</div>
              ) : rows.map((p, i) => (
                <button
                  key={p.id}
                  data-idx={i}
                  onClick={() => { onPick(p); onOpenChange(false); }}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-2 text-left ${i === active ? "bg-accent" : "bg-card"} hover:bg-accent transition`}
                >
                  <div className="truncate">
                    <div className="font-medium truncate">{p.nom}</div>
                    <div className="text-xs text-muted-foreground">
                      {p.unite ? `Unité: ${p.unite} • ` : ""}Stock: {Number(p.stock_reel ?? 0)} • PMP: {Number(p.pmp ?? 0).toFixed(2)}{typeof p.tva === "number" ? ` • TVA par défaut: ${p.tva}%` : ""}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Entrée ↵ • Tab ↹</span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-border bg-muted/40 flex justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Fermer</Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

