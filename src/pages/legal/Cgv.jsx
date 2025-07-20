// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';
import LegalLayout from '@/layout/LegalLayout';

export default function Cgv() {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch('/legal/CGV.md').then((r) => r.text()).then(setText);
  }, []);
  return (
    <LegalLayout title="Conditions de vente" description="CGV MamaStock">
      <div className="p-8 max-w-3xl mx-auto whitespace-pre-wrap">{text}</div>
    </LegalLayout>
  );
}
