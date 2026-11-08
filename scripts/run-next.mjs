import { createServer } from 'node:http';
import next from 'next';
const dev = process.argv.includes('--dev');
const port = Number(process.env.PORT || 3000);
const app = next({ dev, hostname: '0.0.0.0', port });
await app.prepare();
const handler = app.getRequestHandler();
createServer((req, res) => handler(req, res)).listen(port, '0.0.0.0', () => {
  console.log(`Amigos platform ready at http://localhost:${port}`);
});
