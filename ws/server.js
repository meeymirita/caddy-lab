import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT || 3100);
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const server = http.createServer((req, res) => { res.writeHead(426); res.end('Upgrade Required'); });

server.on('upgrade', (req, socket) => {
    const accept = crypto.createHash('sha1').update(req.headers['sec-websocket-key'] + GUID).digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n' +
        `Sec-WebSocket-Accept: ${accept}\r\n\r\n`);
    socket.on('data', (buf) => {
        if ((buf[0] & 0x0f) === 0x8) { socket.write(Buffer.from([0x88, 0x00])); return socket.end(); }                 // close
        let len = buf[1] & 0x7f, off = 2;
        if (len === 126) { len = buf.readUInt16BE(2); off = 4; }
        const mask = buf.subarray(off, off + 4); off += 4;               // клиентские кадры маскированы
        const data = Buffer.from(buf.subarray(off, off + len).map((b, i) => b ^ mask[i % 4]));
        const out = Buffer.from('echo: ' + data.toString());
        socket.write(Buffer.concat([Buffer.from([0x81, out.length]), out]));   // текст до 125 байт
    });
});
server.listen(PORT, () => console.log(`ws echo on :${PORT}`));