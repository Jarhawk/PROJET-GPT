# Requisitions Helpers

The `useRequisitions` hook in `src/hooks/useRequisitions.js` manages product requisition requests.

## getRequisitions
```js
const list = await getRequisitions({ produit: id, zone: zoneId, debut: '2025-01-01', fin: '2025-01-31' });
```
Returns all matching rows filtered by `mama_id` and optional parameters.

## createRequisition
```js
await createRequisition({ produit_id, zone_id, quantite, type, commentaire });
```
Automatically injects `mama_id` and `auteur_id`.

## updateRequisition
Update fields of an existing requisition (limited to the author for 24h).

## deleteRequisition
Delete a requisition row when permitted by RLS.
