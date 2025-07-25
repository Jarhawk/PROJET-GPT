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

Recherche des fournisseurs par nom ou ville. Les résultats sont filtrés par `mama_id`.

```
const { results, searchFournisseurs } = useFournisseursAutocomplete();
```

## useFacturesAutocomplete

Retourne les factures filtrées par numéro avec le nom du fournisseur associé.

```
const { results, searchFactures } = useFacturesAutocomplete();
```
