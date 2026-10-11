import http from 'node:http';
http.createServer((req, res) => {
    if (req.headers['authorization'] === 'Bearer secret-token') {
        res.writeHead(200, { 'X-User': 'alice', 'X-Role': 'admin' });
        return res.end('ok');
    }
    res.writeHead(401, { 'Content-Type': 'text/plain' });
    res.end('unauthorized');
}).listen(Number(process.env.PORT || 3200), () => console.log('auth on :3200'));