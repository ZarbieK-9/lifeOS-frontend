#!/usr/bin/env node
/**
 * OAuth redirect server for Google Sign-In.
 * Google redirects here with ?code=...&state=...; we redirect to lifeos:// so the app can complete sign-in.
 *
 * Run: node scripts/oauth-redirect-server.js
 * For device testing, expose localhost with a tunnel (e.g. cloudflared tunnel --url http://localhost:3090).
 * Add in Google Console: https://YOUR_PUBLIC_URL/oauth/google/callback
 * In .env: EXPO_PUBLIC_GOOGLE_REDIRECT_URI=https://YOUR_PUBLIC_URL/oauth/google/callback
 */

const http = require('http');
const PORT = 3090;
const CALLBACK_PATH = '/oauth/google/callback';

const server = http.createServer((req, res) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`);
  if (req.method === 'GET' && url.pathname === CALLBACK_PATH) {
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const params = new URLSearchParams();
    if (code) params.set('code', code);
    if (state) params.set('state', state);
    if (error) params.set('error', error);
    const target = `lifeos://oauth?${params.toString()}`;
    res.writeHead(302, { Location: target });
    res.end();
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`OAuth redirect server: http://localhost:${PORT}`);
  console.log(`  Add in Google Console: http://localhost:${PORT}${CALLBACK_PATH}`);
  console.log(`  For device testing, tunnel this port (e.g. cloudflared) and use that HTTPS URL in Google + .env`);
});
