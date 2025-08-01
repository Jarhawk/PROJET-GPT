// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// src/components/produits/ProduitFormModal.jsx
import ModalGlass from "@/components/ui/ModalGlass";
import ProduitForm from "./ProduitForm";
import { useEffect } from "react";

export default function ProduitFormModal({ open, produit, onClose, onSuccess }) {
  // Fermer avec ESC
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <ModalGlass open={open} onClose={onClose}>
      <ProduitForm produit={produit} onSuccess={onSuccess} onClose={onClose} />
    </ModalGlass>
  );
}
