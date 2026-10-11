import http from 'node:http';

const PORT = Number(process.env.PORT || 3000);
const NAME = process.env.APP_NAME || 'api';
const orders = [{ id: 1, item: 'Latte', qty: 2 }, { id: 2, item: 'Espresso', qty: 1 }];

const json = (res, code, body, extra = {}) => {
    res.writeHead(code, { 'Content-Type': 'application/json', 'X-Backend': NAME, ...extra });
    res.end(JSON.stringify(body));
};

http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/health' || url.pathname === '/api/health')
        return json(res, 200, { ok: true, name: NAME });
    if (url.pathname === '/api/whoami') {
        return json(res, 200, {
            name: NAME, method: req.method, url: req.url, remote: req.socket.remoteAddress, headers: req.headers
        });
    }
    if (url.pathname === '/api/slow') {
        const ms = Number(url.searchParams.get('ms') || 1000);
        return setTimeout(() => json(res, 200, { name: NAME, waited: ms }), ms);
    }
    if (url.pathname === '/api/flaky') {
        return Math.random() < 0.5 ? json(res, 503, { name: NAME, error: 'flaky' }) : json(res, 200, { name: NAME, ok: true });
    }
    if (url.pathname === '/api/orders' && req.method === 'GET')
        return json(res, 200, { name: NAME, orders });
    if (url.pathname === '/api/orders' && req.method === 'POST') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => json(res, 201, { name: NAME, received: body.length }));
        return;
    }
    if (url.pathname === '/api/events') {                // Server-Sent Events
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Backend': NAME });
        let n = 0;
        const t = setInterval(() => res.write(`data: tick ${++n}\n\n`), 500);
        req.on('close', () => clearInterval(t));
        return;
    }
    json(res, 404, { name: NAME, error: 'not found', path: url.pathname });
}).listen(PORT, () => console.log(`${NAME} listening on :${PORT}`));