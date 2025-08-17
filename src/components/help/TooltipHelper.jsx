// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import { useHelp } from '@/context/HelpProvider';

export default function TooltipHelper({ field }) {
  const { tooltips, fetchTooltips } = useHelp();
  const [text, setText] = useState('');

  useEffect(() => {
    if (tooltips[field]) {
      setText(tooltips[field]);
    } else if (Object.keys(tooltips).length === 0) {
      fetchTooltips();
    }
  }, [tooltips, field, fetchTooltips]);

  if (!text) return null;

  return (
    <span className="ml-1 cursor-pointer text-mamastockGold" title={text}>
      ?
    </span>
  );
}
