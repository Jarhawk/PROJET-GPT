import { useMenus } from "@/hooks/useMenus";

export function useMenuDuJour() {
  const {
    menus,
    loading,
    error,
    fetchMenus,
    addMenu,
    updateMenu,
    deleteMenu,
    toggleMenuActive,
    exportMenusToExcel,
    importMenusFromExcel,
  } = useMenus();

  return {
    menusDuJour: menus,
    loading,
    error,
    fetchMenusDuJour: fetchMenus,
    addMenuDuJour: addMenu,
    editMenuDuJour: updateMenu,
    deleteMenuDuJour: deleteMenu,
    toggleMenuDuJourActive: toggleMenuActive,
    exportMenusDuJourToExcel: exportMenusToExcel,
    importMenusDuJourFromExcel: importMenusFromExcel,
  };
}
