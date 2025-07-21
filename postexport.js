const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
const indexPath = path.join(distDir, "index.html");

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, "utf8");

  // Injection uniquement des balises nécessaires pour la PWA
  if (!html.includes('rel="manifest"')) {
    html = html.replace(
      /<head>/,
      `<head>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#ffffff" />
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(reg => console.log('✅ Service Worker registered:', reg.scope))
          .catch(err => console.error('❌ SW registration failed:', err));
      });
    }
  </script>`
    );
    fs.writeFileSync(indexPath, html, "utf8");
    console.log("✅ Injected PWA tags into dist/index.html");
  }
} else {
  console.warn("⚠️ dist/index.html not found");
}
