// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function MenuPDF({ id }) {
  const { mama_id } = useAuth();
  const [menu, setMenu] = useState(null);
  const [fiches, setFiches] = useState([]);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!mama_id) return;
      const { data: menuData } = await supabase
        .from('menus')
        .select('id, nom, date')
        .eq('id', id)
        .eq('mama_id', mama_id)
        .single();
      if (!menuData) return;
      setMenu(menuData);

      const { data: mf } = await supabase
        .from('menu_fiches')
        .select('fiche_id')
        .eq('menu_id', id)
        .eq('mama_id', mama_id);
      const ficheIds = [];
      const mfList = Array.isArray(mf) ? mf : [];
      for (const r of mfList) {
        ficheIds.push(r.fiche_id);
      }
      if (ficheIds.length === 0) {
        setFiches([]);
        return;
      }
      const { data: ft } = await supabase
        .from('fiches_techniques')
        .select('id:fiche_id, nom, type:type_carte, categorie:sous_type_carte')
        .in('fiche_id', ficheIds)
        .eq('mama_id', mama_id);
      setFiches(Array.isArray(ft) ? ft : []);
    };

    fetchMenu();
  }, [id, mama_id]);

  const exportPDF = () => {
    const fichesList = Array.isArray(fiches) ? fiches : [];
    let fichesHtml = '';
    for (const f of fichesList) {
      fichesHtml += `
            <div class="fiche">
              <div><strong>${f.nom}</strong></div>
              <div class="type">Type : ${f.type} | Catégorie : ${f.categorie}</div>
            </div>`;
    }
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
          ${fichesHtml}
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
