# Autocomplete Hooks

These helpers provide server-side filtered suggestions for forms using Supabase.

## useProduitsAutocomplete

Searches products by name.

```
const { results, searchProduits } = useProduitsAutocomplete();
```

## useFichesAutocomplete

Suggests recipe sheets excluding inactive ones.

## useFournisseursAutocomplete

Fetches suppliers matching a name or city. Results are limited to the current `mama_id`.

```
const { results, searchFournisseurs } = useFournisseursAutocomplete();
```

## useFacturesAutocomplete

Returns invoices filtered by number with their supplier name.

```
const { results, searchFactures } = useFacturesAutocomplete();
```
