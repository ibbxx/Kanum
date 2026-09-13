const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
const rewrites = vercelConfig.rewrites || [];

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webp': 'image/webp',
  '.gif': 'image/gif'
};

/**
 * Find the rewrite destination for a given URL path.
 * Returns the destination path, or the original path if no rewrite matches.
 */
function resolvePath(reqUrl) {
  const urlPath = reqUrl.split('?')[0];

  for (const r of rewrites) {
    if (r.source === urlPath) {
      return r.destination;
    }
    if (r.source.includes(':') && urlPath.startsWith(r.source.split('/:')[0] + '/')) {
      return r.destination;
    }
  }
  return urlPath;
}

/**
 * Given a Referer URL, figure out what directory the referring HTML file
 * actually lives in. This is needed because URL rewrites make the browser
 * think relative assets live at the rewrite source path, not the destination.
 *
 * Example: Referer is /login → rewrite destination is /Login/Masuk.html
 *          → return "Login" (the directory)
 */
function getRefererDirectory(refererHeader) {
  if (!refererHeader) return null;
  try {
    const refUrl = new URL(refererHeader);
    const refPath = decodeURIComponent(refUrl.pathname);
    const rewrittenPath = resolvePath(refPath);
    if (rewrittenPath !== refPath) {
      // The referer was a rewritten URL — return the actual file's directory
      return path.dirname(rewrittenPath);
    }
  } catch (_) {}
  return null;
}

const server = http.createServer((req, res) => {
  const decodedUrl = decodeURIComponent(req.url);
  let targetPath = resolvePath(decodedUrl);
  let filePath = path.join(__dirname, targetPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // --- Fallback: resolve relative asset paths via the Referer header ---
  // When a page like /login (rewritten to /Login/Masuk.html) requests
  // ./masuk.js, the browser asks for /masuk.js which doesn't exist at root.
  // We use the Referer to figure out the real directory and try there.
  if (!fs.existsSync(filePath)) {
    const refDir = getRefererDirectory(req.headers.referer);
    if (refDir) {
      const basename = path.basename(decodedUrl.split('?')[0]);
      const altPath = path.join(__dirname, refDir, basename);
      if (fs.existsSync(altPath) && fs.statSync(altPath).isFile()) {
        filePath = altPath;
      }
    }
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404 Not Found</h1><p>Halaman tidak ditemukan: ' + req.url + '</p>');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server Error: ' + err.message);
      return;
    }

    if (ext === '.html') {
      let html = data.toString('utf8');
      const reactGrabScript = '<script src="/node_modules/react-grab/dist/index.global.js" onerror="this.onerror=null;this.src=\'https://unpkg.com/react-grab/dist/index.global.js\'"></script>';
      if (!html.includes('react-grab') && !html.includes('index.global.js')) {
        if (html.includes('</body>')) {
          html = html.replace('</body>', `  ${reactGrabScript}\n</body>`);
        } else {
          html += `\n${reactGrabScript}`;
        }
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(html);
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n   KANUM Local Server berjalan di:\n   http://localhost:${PORT}\n`);
});
