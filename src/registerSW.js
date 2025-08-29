// MamaStock © 2025 - Licence commerciale obligatoire - Toute reproduction interdite sans autorisation.
// SW disabled in DEV
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        const regs = Array.isArray(registrations) ? registrations : [];
        for (const reg of regs) await reg.unregister();
        if ('caches' in window) {
          const keyList = await caches.keys();
          const keys = Array.isArray(keyList) ? keyList : [];
          for (const k of keys) {
            await caches.delete(k);
          }
        }

      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.info('SW registered', registration);
    } catch (registrationError) {
      console.error('SW registration failed', registrationError);
    }
  });
}
