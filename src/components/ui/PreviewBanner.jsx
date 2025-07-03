// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PreviewBanner() {
  const { search } = useLocation();
  if (!new URLSearchParams(search).has('preview')) return null;
  const params = new URLSearchParams(search);
  const intensity = params.get('intensity');
  params.delete('preview');
  const exitUrl = `${window.location.pathname}?${params.toString()}`.replace(/\?$/, '');
  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 bg-glass backdrop-blur border border-borderGlass text-white px-4 py-1 rounded-xl z-50 text-sm shadow">
      Aperçu du thème actif
      {intensity && ` (intensité ${intensity})`} -{' '}
      <Link to={exitUrl} className="underline">Quitter</Link>
    </div>
  );
}
