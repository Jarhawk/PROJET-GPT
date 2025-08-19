// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useState, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import ProductPickerModal from '@/components/forms/ProductPickerModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const parseNum = (v) => parseFloat(String(v).replace(',', '.')) || 0;

export default function FactureLigne({ index, onRemove, onProduitFocus }) {
  const { watch, setValue } = useFormContext();
  const ligne = watch(`lignes.${index}`) || {};
  const [pickerOpen, setPickerOpen] = useState(false);
  const quantiteRef = useRef(null);

  const handleProduitSelection = (p) => {
    if (!p?.id) return;
    const q = parseNum(ligne.quantite);
    const pu = parseNum(ligne.prix_unitaire_ht);
    setValue(`lignes.${index}.produit_id`, p.id);
    setValue(`lignes.${index}.designation`, p.nom);
    setValue(`lignes.${index}.pmp`, p.pmp ?? 0);
    setValue(`lignes.${index}.montant_ht`, (q * pu).toFixed(2));
    setTimeout(() => quantiteRef.current?.focus(), 0);
  };

  const handleQuantite = (val) => {
    const q = parseNum(val);
    const pu = parseNum(ligne.prix_unitaire_ht);
    setValue(`lignes.${index}.quantite`, val);
    setValue(`lignes.${index}.montant_ht`, (q * pu).toFixed(2));
  };

  const handlePu = (val) => {
    const q = parseNum(ligne.quantite);
    const pu = parseNum(val);
    setValue(`lignes.${index}.prix_unitaire_ht`, val);
    setValue(`lignes.${index}.montant_ht`, (q * pu).toFixed(2));
  };

  return (
    <div className="flex w-full items-center gap-2">
      <div className="flex-1 min-w-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setPickerOpen(true);
            onProduitFocus?.(index);
          }}
          className="h-10 w-full justify-start truncate"
        >
          {ligne.designation || 'Choisir...'}
        </Button>
        <ProductPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={handleProduitSelection}
        />
      </div>
      <div className="w-24 shrink-0">
        <Input
          type="number"
          step="any"
          ref={quantiteRef}
          className="h-10 w-full text-right rounded-xl"
          value={ligne.quantite}
          onChange={(e) => handleQuantite(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
      </div>
      <div className="w-24 shrink-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full text-right rounded-xl"
          value={ligne.prix_unitaire_ht}
          onChange={(e) => handlePu(e.target.value)}
          onBlur={() => handlePu(parseNum(ligne.prix_unitaire_ht).toFixed(2))}
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        />
      </div>
      <div className="w-24 shrink-0">
        <Input
          type="number"
          step="any"
          className="h-10 w-full text-right rounded-xl"
          value={ligne.tva}
          onChange={(e) => setValue(`lignes.${index}.tva`, e.target.value)}
        />
      </div>
      <div className="w-32 shrink-0">
        <Input
          type="text"
          readOnly
          tabIndex={-1}
          value={ligne.montant_ht}
          className="h-10 w-full text-right rounded-xl pointer-events-none select-none"
          aria-readonly="true"
        />
      </div>
      <div className="w-10 shrink-0 flex justify-center">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onRemove?.(index)}
          className="h-10 px-2"
        >
          ❌
        </Button>
      </div>
    </div>
  );
}
