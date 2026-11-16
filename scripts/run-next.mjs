import { createServer } from 'node:http';
import next from 'next';
const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname: '0.0.0.0', port });
await app.prepare();
const handler = app.getRequestHandler();
const server = createServer((req, res) => handler(req, res));
server.listen(port, '0.0.0.0', () => {
  console.log(`Amigos platform ready at http://localhost:${port}`);
});
let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  try {
    server.close();
    await app.close();
    server.closeAllConnections();
    const connections = globalThis[Symbol.for('amigos.databaseConnections')] || [];
    await Promise.all([...connections].map(close => close()));
    clearTimeout(timeout);
    process.exit(0);
  } catch (error) { console.error('Server shutdown failed', error); process.exit(1); }
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
