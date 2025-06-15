if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      registration => {
        console.info('SW registered', registration);
      },
      registrationError => {
        console.error('SW registration failed', registrationError);
      }
    );
  });
}
