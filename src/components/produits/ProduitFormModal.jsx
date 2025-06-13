// src/components/produits/ProduitFormModal.jsx
import { motion as Motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import ProduitForm from "./ProduitForm";
import { useEffect } from "react";

export default function ProduitFormModal({ open, produit, familles, unites, onClose, onSuccess }) {
  // Fermer avec ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <Motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Motion.div
            className="relative bg-white/80 dark:bg-[#181f31]/90 rounded-2xl shadow-2xl border border-mamastockGold/30 p-0 overflow-hidden min-w-[350px] max-w-lg w-full backdrop-blur-[8px]"
            initial={{ y: 80, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", duration: 0.37 }}
            style={{
              boxShadow: "0 8px 42px 0 #bfa14d33, 0 2px 16px 0 #0f1c2e22",
            }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-2 bg-white/40 rounded-full shadow hover:bg-mamastockGold/70 transition"
              title="Fermer"
            >
              <X size={18} />
            </button>
            <ProduitForm
              produit={produit}
              familles={familles}
              unites={unites}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Motion.div>
        </Motion.div>
      )}
    </AnimatePresence>
  );
}
