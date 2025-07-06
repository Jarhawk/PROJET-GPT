# Inventaire Avancé

The advanced inventory module handles monthly stock counts, optionally by zone declared in the inventory header. Products are filtered by family and search term. Quantities are entered for each product and differences are calculated on the fly.

For beverage zones the form displays the monthly requisition and the difference with the calculated consumption. Values for the previous two months can be shown for quick comparison.

`useProduitsInventaire` fetches active products of the current establishment:

```js
const { produits, fetchProduits } = useProduitsInventaire();
await fetchProduits({ famille: 'Viande', search: 'steak' });

// Le paramètre de zone n'est plus transmis
```

`InventaireForm.jsx` lists the products with theoretical stock, price, calculated gap and requisition columns. `InventaireDetail.jsx` exports the full table to Excel with columns for value and historical consumption.

Row Level Security ensures only the establishment owning the inventory (matching `mama_id`) can modify lines when `cloture` is false.
