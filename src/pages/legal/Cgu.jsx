// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import LegalLayout from '@/layout/LegalLayout';

export default function Cgu() {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch('/legal/CGU.md').then((r) => r.text()).then(setText);
  }, []);
  return (
    <LegalLayout title="Conditions d'utilisation" description="CGU MamaStock">
      <div className="p-8 max-w-3xl mx-auto whitespace-pre-wrap">{text}</div>
    </LegalLayout>
  );
}
