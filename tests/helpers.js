import { createApp } from '../src/app.js';

export function startServer() {
  const server = createApp().listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    close: () => server.close(),
    async get(path) {
      const res = await fetch(base + path);
      return { status: res.status, body: await res.json() };
    },
    async patch(path, payload) {
      const res = await fetch(base + path, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: res.status, body: await res.json() };
    },
    async post(path, payload) {
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return { status: res.status, body: await res.json() };
    }
  };
}
