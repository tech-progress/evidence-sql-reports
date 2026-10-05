import http from 'node:http';
import { spawn } from 'node:child_process';
import { readConfig, readinessSql, roleIsSafe } from './config.mjs';

let config;
try { config = readConfig(); } catch (error) { console.error(error.message); process.exit(1); }
const evidence = spawn('evidence', ['serve', '--host', '127.0.0.1', '--no-open', '--port', '3001'], {
  stdio: 'inherit', env: { ...process.env, EVIDENCE_TELEMETRY_DISABLED: 'true' },
});
let closing = false;
let verified = false;

async function warehouseReady() {
  try {
    const response = await fetch('http://127.0.0.1:3001/api/query', {
      method: 'POST', headers: { authorization: config.authorization, 'content-type': 'application/json' },
      body: JSON.stringify({ sql: readinessSql }), signal: AbortSignal.timeout(3500),
    });
    if (!response.ok) return false;
    return roleIsSafe((await response.json()).rows?.[0]);
  } catch { return false; }
}

const server = http.createServer(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (request.url === '/readyz' && ['GET', 'HEAD'].includes(request.method)) {
    const ready = await warehouseReady();
    verified = ready;
    response.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: ready ? 'ready' : 'unavailable' }));
    return;
  }
  if (!verified) {
    response.writeHead(503);
    response.end('Unavailable');
    return;
  }
  const headers = { ...request.headers, host: '127.0.0.1:3001' };
  delete headers['x-forwarded-authorization'];
  const upstream = http.request({ hostname: '127.0.0.1', port: 3001,
    path: request.url, method: request.method, headers, timeout: 15000 }, (reply) => {
    response.writeHead(reply.statusCode, { ...reply.headers, 'cache-control': 'no-store' });
    reply.pipe(response);
  });
  upstream.on('timeout', () => upstream.destroy());
  upstream.on('error', () => {
    if (!response.headersSent) response.writeHead(502);
    response.end('Upstream unavailable');
  });
  request.on('aborted', () => upstream.destroy());
  request.pipe(upstream);
});
server.requestTimeout = 20000;
server.headersTimeout = 10000;
server.listen(config.port, '0.0.0.0', () => console.log(`Report gateway listening on ${config.port}`));

async function shutdown(code) {
  if (closing) return;
  closing = true;
  server.close();
  evidence.kill('SIGTERM');
  setTimeout(() => { evidence.kill('SIGKILL'); process.exit(code); }, 5000).unref();
  if (evidence.exitCode !== null) process.exit(code);
}
evidence.on('error', () => { console.error('Evidence executable unavailable'); shutdown(1); });
evidence.on('exit', (code) => { if (closing) process.exit(0); else shutdown(code || 1); });
server.on('error', () => { console.error('Gateway listener failed'); shutdown(1); });
process.on('SIGTERM', () => shutdown(0));
process.on('SIGINT', () => shutdown(0));
