// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from '@/hooks/useAuth';

export default function MenuPDF({ id }) {
  const { mama_id } = useAuth();
  const [menu, setMenu] = useState(null);
  const [fiches, setFiches] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!mama_id) return;
      const { data: menuData } = await supabase
        .from("menus")
        .select(
          "*, fiches:menu_fiches(fiche_id, fiche:fiches(id, nom, type, categorie))"
        )
        .eq("id", id)
        .eq("mama_id", mama_id)
        .single();

      if (menuData) {
        setMenu(menuData);
        setFiches(menuData.fiches?.map(f => f.fiche) || []);
      }
    };

    fetchMenu();
  }, [id, mama_id]);

  const exportPDF = () => {
    const content = `
      <html>
        <head>
          <title>${menu.nom}</title>
          <style>
            body { font-family: Arial; padding: 30px; }
            h1 { color: #bfa14d; }
            .fiche { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
            .type { font-size: 14px; color: #555; }
            .logo { max-width: 140px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <img src="/logo-mamastock.png" class="logo" />
          <h1>Menu du jour : ${menu.nom}</h1>
          <p><strong>Date :</strong> ${menu.date}</p>
          ${fiches
            .map(
              (f) => `
            <div class="fiche">
              <div><strong>${f.nom}</strong></div>
              <div class="type">Type : ${f.type} | Catégorie : ${f.categorie}</div>
            </div>
          `
            )
            .join("")}
        </body>
      </html>
    `;
    const win = window.open("", "_blank");
    win.document.write(content);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  if (!menu) return null;

  return (
    <button
      onClick={exportPDF}
      className="bg-mamastock-gold hover:bg-mamastock-gold-hover text-white px-3 py-1 rounded text-sm"
    >
      📄 Exporter ce menu
    </button>
  );
}
