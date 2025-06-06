// ✅ src/hooks/useMenus.js
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export const useMenus = () => {
  const { mama_id } = useAuth();

  const getMenus = async () => {
    if (!mama_id) return [];
    const { data, error } = await supabase
      .from("menus")
      .select("*, menu_items(*, recipes(nom))")
      .eq("mama_id", mama_id)
      .order("date", { ascending: false });

    if (error) {
      console.error("❌ Erreur lors du chargement des menus :", error);
      return [];
    }

    return data || [];
  };

  const createMenu = async ({ nom, date, recettes }) => {
    const { data: menu, error } = await supabase
      .from("menus")
      .insert([{ nom, date, mama_id }])
      .select()
      .single();

    if (error) {
      console.error("❌ Erreur création menu :", error);
      throw error;
    }

    // Ajout des recettes liées au menu
    for (const id of recettes) {
      const { error: linkError } = await supabase
        .from("menu_items")
        .insert([{ menu_id: menu.id, recipe_id: id }]);

      if (linkError) {
        console.error("❌ Erreur liaison recette :", linkError);
        throw linkError;
      }
    }
  };

  return { getMenus, createMenu };
};

export default useMenus;
