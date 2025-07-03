// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useMenus } from "@/hooks/useMenus";

export function useMenuDuJour() {
  const {
    menus,
    total,
    loading,
    error,
    getMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    toggleMenuActive,
    exportMenusToExcel,
    importMenusFromExcel,
  } = useMenus();

  return {
    menusDuJour: menus,
    total,
    loading,
    error,
    fetchMenusDuJour: getMenus,
    addMenuDuJour: createMenu,
    editMenuDuJour: updateMenu,
    deleteMenuDuJour: deleteMenu,
    toggleMenuDuJourActive: toggleMenuActive,
    exportMenusDuJourToExcel: exportMenusToExcel,
    importMenusDuJourFromExcel: importMenusFromExcel,
  };
}
