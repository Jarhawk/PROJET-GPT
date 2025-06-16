import { useState, useEffect } from 'react';

export function useFavorites(key = 'favorites_products') {
  const [favorites, setFavorites] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(favorites));
    } catch {
      // ignore write errors
    }
  }, [favorites, key]);

  const isFavorite = id => favorites.includes(id);
  const toggleFavorite = id => {
    setFavorites(favs =>
      favs.includes(id) ? favs.filter(f => f !== id) : [...favs, id]
    );
  };

  return { favorites, isFavorite, toggleFavorite };
}
