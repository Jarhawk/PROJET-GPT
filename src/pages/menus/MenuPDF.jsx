import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MenuPDF({ id }) {
  const [menu, setMenu] = useState(null);
  const [fiches, setFiches] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data: menuData } = await supabase
        .from("menus")
        .select("*")
        .eq("id", id)
        .single();

      if (menuData) {
        setMenu(menuData);
        const { data: fichesData } = await supabase
          .from("fiches")
          .select("*")
          .in("id", menuData.fiches || []);
        setFiches(fichesData || []);
      }
    };

    fetchMenu();
  }, [id]);

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
      className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
    >
      📄 Exporter ce menu
    </button>
  );
}
