import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Auto-load all route files in a given directory.
 * Each route file can optionally export:
 * - `method`: 'get' | 'post' | 'put' | 'delete'
 * - `path`: the actual route path
 * - default: the handler function
 */
export default async function loadRoutes(app, dirPath) {
  const absolutePath = path.resolve(__dirname, '..', dirPath);
  const files = fs.readdirSync(absolutePath);

  for (const file of files) {
    if (!file.endsWith('.js')) continue;

    const filePath = path.join(absolutePath, file);
    const routeModule = await import(filePath);
    const handler = routeModule.default || routeModule;

    const method = (routeModule.method || 'post').toLowerCase();
    const routePath =
      routeModule.path || `/api/${file.replace(/\.js$/, '')}`;

    if (typeof app[method] === 'function') {
      app[method](routePath, asyncHandler(handler));
      console.log(`✅ Registered [${method.toUpperCase()}] ${routePath}`);
    } else {
      console.warn(`⚠️ Skipped unknown method "${method}" in ${file}`);
    }
  }
}