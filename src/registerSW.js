// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) await reg.unregister();
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.info('SW registered', registration);
    } catch (registrationError) {
      console.error('SW registration failed', registrationError);
    }
  });
}
