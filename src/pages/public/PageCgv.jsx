// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import { useEffect, useState } from 'react';

export default function PageCgv() {
  const [text, setText] = useState('');
  useEffect(() => {
    fetch('/legal/CGV.md').then((r) => r.text()).then(setText);
  }, []);
  return <div className="p-8 max-w-3xl mx-auto whitespace-pre-wrap">{text}</div>;
}
