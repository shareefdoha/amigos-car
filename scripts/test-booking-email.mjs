import assert from 'node:assert/strict';
import net from 'node:net';

// A disposable amigos_test_* database is required by the shared HTTP test.
// Messages are handled entirely on localhost and are never forwarded.
const messages = [];
const sockets = new Set();
const server = net.createServer(socket => {
  sockets.add(socket);
  socket.on('close', () => sockets.delete(socket));
  socket.setTimeout(15000, () => socket.destroy());
  socket.write('220 localhost test SMTP\r\n');
  let buffer = '', inData = false, recipients = [], lines = [];
  socket.on('data', chunk => {
    buffer += chunk.toString();
    let index;
    while ((index = buffer.indexOf('\r\n')) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 2);
      if (inData) {
        if (line === '.') {
          messages.push({ recipients: [...recipients], body: lines.join('\n') });
          inData = false; lines = [];
          socket.write('250 accepted\r\n');
        } else lines.push(line);
      } else if (/^EHLO|^HELO/.test(line)) socket.write('250-localhost\r\n250 AUTH PLAIN\r\n');
      else if (/^AUTH PLAIN/.test(line)) socket.write('235 authenticated\r\n');
      else if (/^MAIL FROM:/.test(line)) { recipients = []; socket.write('250 sender ok\r\n'); }
      else if (/^RCPT TO:/.test(line)) { recipients.push(line.slice(8).trim()); socket.write('250 recipient ok\r\n'); }
      else if (line === 'DATA') { inData = true; socket.write('354 send data\r\n'); }
      else if (line === 'QUIT') socket.end('221 bye\r\n');
      else socket.write('250 ok\r\n');
    }
  });
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  process.env.TEST_SMTP_PORT = String(server.address().port);
  await import('./test-mysql-http.mjs');
  assert.equal(messages.length, 3);
  assert.deepEqual(messages[0].recipients, ['<appointments@example.test>']);
  assert.match(messages[0].body, /Website booking enquiry/);
  assert.deepEqual(messages[1].recipients, ['<info@amigoscarcare.com>']);
  console.log('Booking recipient and persisted SMTP status verified; no external emails sent.');
} finally {
  for (const socket of sockets) socket.destroy();
  await new Promise(resolve => server.close(resolve));
}
