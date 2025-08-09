# Front Patches

Apply patches using:

```bash
patch -p0 < patches/useMouvementCostCenters.patch
```

This patch replaces legacy access to `mouvements_centres_cout` with `requisition_lignes` to align with the modern schema.
