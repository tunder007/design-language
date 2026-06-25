// preview.mjs — zero-dep live-reload preview server. Serves design.html and reloads the browser
// whenever the file changes on disk, so the terminal agent edits on one half of the screen and the
// browser updates on the other. No dependencies; uses Server-Sent Events.
import http from 'node:http';
import { fs, path } from './lib/util.mjs';

const RELOAD_CLIENT = "<script>const es=new EventSource('/__reload');es.onmessage=()=>location.reload();</script>";

// Returns a Promise<{ server, url, port }>. Pass { port: 0 } for an ephemeral port (tests).
export function startPreview(file, { port = 4321 } = {}) {
  const abs = path.resolve(file);
  const clients = new Set();

  const server = http.createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    let html;
    try { html = fs.readFileSync(abs, 'utf8'); }
    catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('design.html not found at ' + abs); return; }
    html = html.includes('</body>') ? html.replace('</body>', RELOAD_CLIENT + '</body>') : html + RELOAD_CLIENT;
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  });

  let timer = null;
  try {
    fs.watch(abs, () => {
      clearTimeout(timer);
      timer = setTimeout(() => { for (const c of clients) c.write('data: reload\n\n'); }, 80);
    });
  } catch { /* file may not exist yet; server still serves once it does */ }

  return new Promise((resolve) => {
    server.listen(port, () => resolve({ server, port: server.address().port, url: `http://localhost:${server.address().port}` }));
  });
}
