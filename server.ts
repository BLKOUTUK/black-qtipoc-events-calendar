import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// Dynamically import and register API routes, then start server
const apiDir = path.join(__dirname, 'api');

async function startServer() {
  // Load all API routes first
  const apiFiles = fs.readdirSync(apiDir);
  for (const file of apiFiles) {
    // Support both .js and .ts files (tsx runs .ts directly)
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const routeName = file.slice(0, -3);
      try {
        const module = await import(path.join(apiDir, file));
        if (module.default) {
          app.all(`/api/${routeName}`, module.default);
          console.log(`✅ Registered route: /api/${routeName}`);
        }
      } catch (error) {
        console.error(`❌ Failed to load route /api/${routeName}:`, error);
      }
    }
  }
  console.log(`🚀 All API routes registered`);

  // SPA fallback: serve index.html for any request that doesn't match an API route or a static file
  app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  // Start server AFTER all routes are registered
  app.listen(port, () => {
    console.log(`🏴‍☠️ Events Calendar server running on port ${port}`);
    console.log(`📅 API endpoints ready at /api/*`);
  });
}

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
