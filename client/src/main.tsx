import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <App />
);

// Global error handlers — catch crashes outside React error boundaries
window.addEventListener('unhandledrejection', (e) => {
	if (import.meta.env.DEV) console.error('Unhandled rejection:', e.reason);
});

// Service worker: register + detect updates so users get fresh builds
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(swPath, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        // Check for updates every 30 minutes
        setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing;
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            // New SW activated + old one existed = app updated, reload silently
            if (newSW.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      })
      .catch(() => {});
  });
}
