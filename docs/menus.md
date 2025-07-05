# Menus Helpers

The `useMenus` hook in `src/hooks/useMenus.js` deals with menu planning and associations with recipes.

## getMenus

```js
const list = await getMenus({ search: 'pasta', date: '2025-05-01' });
```

Retrieves menus filtered by name and date with pagination support.

## createMenu

```js
await createMenu({ nom: 'Menu 1', date: '2025-05-01', fiches: ['id1', 'id2'] });
```

Inserts a new menu and links the provided recipe ids in `menu_fiches`.

## updateMenu

```js
await updateMenu(id, { nom: 'Updated', fiches: [] });
```

Updates a menu header and resets its associated recipes.

## getMenuById

```js
const menu = await getMenuById(id);
```

Returns a single menu with all linked recipes.

## deleteMenu

```js
await deleteMenu(id);
```

Soft deletes the menu by setting `actif` to `false`.

## toggleMenuActive

```js
await toggleMenuActive(id, true);
```

Enables or disables the menu.

## exportMenusToExcel

```js
exportMenusToExcel();
```

Downloads the current list of menus to an Excel file.

## importMenusFromExcel

```js
const rows = await importMenusFromExcel(file);
```

Parses the `Menus` sheet from the Excel file or falls back to the first sheet.
Returns the raw rows so callers can decide how to create menus.

## subscribeToMenus

```js
const unsubscribe = subscribeToMenus((menu) => {
  console.log('new menu', menu);
});
```

Registers a realtime listener for new menus of the current `mama_id`.
Call the returned function to unsubscribe when done.
