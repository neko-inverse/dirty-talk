import http from 'node:http';
import https from 'node:https';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { AppError, demoRewrite, buildMessages, validateInput } from './engine.mjs';
import { providers } from './dist/providers.js';

const assets = { '/': ['index.html', 'text/html; charset=utf-8'], '/style.css': ['style.css', 'text/css; charset=utf-8'], '/settings.css': ['settings.css', 'text/css; charset=utf-8'], '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/providers.js': ['providers.js', 'text/javascript; charset=utf-8'], '/favicon.svg': ['favicon.svg', 'image/svg+xml'] };

export function buildModelPayload(input, rawConfig) {
  const {url,model} = validateConfig(rawConfig);
  const provider = Object.hasOwn(providers,rawConfig.provider) ? providers[rawConfig.provider] : null;
  const officialURL = provider ? new URL(provider.endpoint.replace(/\/$/,'')+'/chat/completions') : null;
  const preset = officialURL?.href === url.href ? provider.models.find(item => item.id === model) : null;
  return {model, messages:buildMessages(input), stream:false, ...preset?.request};
}

export function validateConfig(config) {
  if (!config || typeof config.endpoint !== 'string') throw new AppError('请填写模型 API 地址。');
  let url;
  try { url = new URL(config.endpoint); } catch { throw new AppError('API 地址格式不正确。'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443')) throw new AppError('请使用不含账号、查询参数的标准 HTTPS API 地址。');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || isIP(url.hostname.replace(/[\[\]]/g, ''))) throw new AppError('API 地址必须是公开服务的域名。');
  if (typeof config.key !== 'string' || !config.key.trim() || config.key.length > 4096 || /[\u0000-\u001f\u007f]/.test(config.key)) throw new AppError('请填写有效的 API 密钥。');
  if (typeof config.model !== 'string' || !config.model.trim() || config.model.length > 150) throw new AppError('请填写有效的模型名称。');
  const pathname = url.pathname.replace(/\/+$/, '');
  url.pathname = pathname.endsWith('/chat/completions') ? pathname : pathname + '/chat/completions';
  return { url, key: config.key.trim(), model: config.model.trim() };
}

export function isPublicIPv4(address) {
  if (isIP(address) !== 4) return false;
  const [a,b,c] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
}

export async function callModel(input, rawConfig, signal) {
  const {url, key} = validateConfig(rawConfig);
  let resolved;
  try { resolved = await lookup(url.hostname, { family: 4 }); } catch { throw new AppError('无法解析模型服务地址，请检查 API 地址。', 502); }
  if (!isPublicIPv4(resolved.address)) throw new AppError('不能连接本机或私有网络地址。');
  const payload = JSON.stringify(buildModelPayload(input,rawConfig));
  return new Promise((resolveResult, reject) => {
    const request = https.request(url, {
      method: 'POST',
      lookup: (_hostname, options, cb) => options.all ? cb(null, [resolved]) : cb(null, resolved.address, 4),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'Content-Length': Buffer.byteLength(payload) },
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(45000)]) : AbortSignal.timeout(45000)
    }, response => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        response.resume();
        const message = [401,403].includes(response.statusCode) ? '模型服务拒绝访问，请检查密钥和模型权限。' : response.statusCode === 429 ? '模型服务额度不足或请求过于频繁，请稍后再试。' : '模型服务返回错误，请检查 API 地址与模型名称后重试。';
        reject(new AppError(message, 502)); return;
      }
      let size = 0; const chunks = [];
      response.on('data', chunk => { size += chunk.length; if (size > 1024 * 1024) { response.destroy(); reject(new AppError('模型返回内容过大，请缩短输入后重试。', 502)); } else chunks.push(chunk); });
      response.on('error', () => reject(new AppError('模型连接中断，请重试。', 502)));
      response.on('end', () => {
        try {
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const text = body.choices?.[0]?.message?.content;
          if (typeof text !== 'string' || !text.trim() || text.length > 20000) throw new Error();
          resolveResult({text: text.trim(), mode: 'ai', tone: input.tone, language: input.language});
        } catch { reject(new AppError('模型未返回有效文本，请检查接口是否兼容 Chat Completions。', 502)); }
      });
    });
    request.on('error', error => reject(new AppError(error.name === 'AbortError' ? '模型响应超时，请稍后重试。' : '无法连接模型服务，请检查网络或 API 地址。', 502)));
    request.end(payload);
  });
}

async function readJSON(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 20000) throw new AppError('请求内容过大。', 413); chunks.push(chunk); }
  try { return JSON.parse(Buffer.concat(chunks).toString()); } catch { throw new AppError('请求 JSON 格式不正确。'); }
}

export function createApp({ modelCall = callModel } = {}) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(data)); };
    try {
      const host = req.headers.host;
      if (!host || !/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new AppError('不允许的访问地址。', 403);
      const path = new URL(req.url, `http://${host}`).pathname;
      if (req.method === 'GET' && path === '/api/health') { json(200, {ok: true}); return; }
      if (req.method === 'POST' && ['/api/rewrite', '/api/test'].includes(path)) {
        const controller = new AbortController();
        res.on('close', () => { if (!res.writableEnded) controller.abort(); });
        if (req.headers.origin && req.headers.origin !== `http://${host}`) throw new AppError('不允许跨站请求。', 403);
        if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('不允许跨站请求。', 403);
        if (String(req.headers['content-type']).split(';',1)[0].trim().toLowerCase() !== 'application/json') throw new AppError('请求必须使用 JSON。', 415);
        const body = await readJSON(req);
        if (path === '/api/test') {
          validateConfig(body?.config);
          await modelCall({text:'Please reply during working hours.',tone:'natural',language:'en'},body.config,controller.signal);
          json(200,{ok:true}); return;
        }
        const input = validateInput(body);
        const useModel = Object.hasOwn(body,'config');
        if (useModel) validateConfig(body.config);
        json(200, useModel ? await modelCall(input, body.config,controller.signal) : demoRewrite(input)); return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) { json(405, {error:'不支持的请求方式。'}); return; }
      const asset = Object.hasOwn(assets, path) ? assets[path] : null;
      if (!asset) { json(404, {error:'页面不存在。'}); return; }
      const content = await readFile(new URL(`./dist/${asset[0]}`, import.meta.url));
      res.writeHead(200, {'Content-Type': asset[1]}); res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) { if (!res.headersSent && !res.destroyed) json(error instanceof AppError ? error.status : 500, {error: error instanceof AppError ? error.message : '服务暂时不可用，请重试。'}); }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4317);
  const server = createApp();
  server.requestTimeout = 60000;
  server.on('error', error => { console.error(error.code === 'EADDRINUSE' ? `端口 ${port} 已被占用，请设置 PORT 后重试。` : '本地服务启动失败。'); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => console.log(`LinkedIn Speak ready at http://127.0.0.1:${port}`));
}
