import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createApp, validateConfig, isPublicIPv4 } from '../server.mjs';
import { AppError } from '../engine.mjs';

const validConfig = {endpoint:'https://example.com/v1',key:'test-only-not-a-real-key',model:'test-model'};
async function withServer(run, options) {
  const server = createApp(options);
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try { await run(url); } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}
const post = (url, body, extra = {}) => fetch(url, {method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body)});

test('服务器支持指定 IP 和 HTTPS 域名，同时拒绝错误 Host 与跨站来源', async () => {
  const request = (url, headers, body) => new Promise((resolve, reject) => {
    const req = http.request(url, {method:body ? 'POST':'GET',headers:{'Content-Type':'application/json',...headers}}, res => { res.resume(); res.on('end',()=>resolve(res.statusCode)); });
    req.on('error',reject); req.end(body ? JSON.stringify(body) : undefined);
  });
  for (const publicOrigin of ['http://203.0.113.10:4317','https://talk.example.com']) {
    const host = new URL(publicOrigin).host;
    await withServer(async url => {
      assert.equal(await request(url,{Host:host}),200);
      const input = {text:'我同事是傻逼',tone:'professional',language:'zh'};
      assert.equal(await request(url+'/api/rewrite',{Host:host,Origin:publicOrigin},input),200);
      assert.equal(await request(url+'/api/rewrite',{Host:host,Origin:'https://evil.example'},input),403);
      assert.equal(await request(url,{Host:'evil.example'}),403);
      assert.equal(await request(url+'/api/rewrite',{Host:host,Origin:'null'},input),403);
    }, {publicOrigin});
  }
  for (const publicOrigin of ['ftp://example.com','https://user:pass@example.com','https://example.com/path','https://example.com?x=1']) assert.throws(()=>createApp({publicOrigin}));
});

test('API 地址规范化支持 Base URL 和完整路径', () => {
  assert.equal(validateConfig({...validConfig,endpoint:'https://api.deepseek.com'}).url.href,'https://api.deepseek.com/chat/completions');
  for (const endpoint of ['https://example.com/v1','https://example.com/v1/','https://example.com/v1/chat/completions']) assert.equal(validateConfig({...validConfig,endpoint}).url.href,'https://example.com/v1/chat/completions');
});
test('密钥、协议、主机与凭据校验', () => {
  for (const endpoint of ['http://example.com','https://localhost','https://127.0.0.1','https://[::1]','https://u:p@example.com','https://example.com?key=secret','https://example.com/#fragment','https://example.com:444/v1']) assert.throws(() => validateConfig({...validConfig,endpoint}));
  for (const config of [null,{}, {...validConfig,key:' '},{...validConfig,key:'x\r\nAuthorization: other'},{...validConfig,model:''}]) assert.throws(() => validateConfig(config));
});
test('内网、链路本地、保留及 IPv6 地址不可转发', () => {
  for (const ip of ['0.1.2.3','10.0.0.1','127.0.0.1','169.254.169.254','172.16.0.1','192.168.1.1','100.64.0.1','198.19.0.1','192.0.2.1','203.0.113.1','224.0.0.1','::1','::ffff:127.0.0.1']) assert.equal(isPublicIPv4(ip),false,ip);
  for (const ip of ['1.1.1.1','8.8.8.8','172.32.0.1']) assert.equal(isPublicIPv4(ip),true,ip);
});
test('页面、静态资源、健康状态可用；原始图片与服务端源码不对外提供', async () => withServer(async url => {
  for (const path of ['/','/style.css','/settings.css','/app.js','/favicon.svg','/api/health']) { const res = await fetch(url+path); assert.equal(res.status,200,path); assert.ok(res.headers.get('content-security-policy')); }
  for (const path of ['/server.mjs','/engine.mjs','/11252.jpg','/.env','/../package.json','/constructor']) assert.equal((await fetch(url+path)).status,404,path);
  const head = await fetch(url,{method:'HEAD'}); assert.equal(head.status,200); assert.equal(await head.text(),'');
}));
test('真实 HTTP 示例改写与未知输入错误', async () => withServer(async url => {
  const result = await post(url+'/api/rewrite',{text:'我同事是傻逼',tone:'professional',language:'en'}); assert.equal(result.status,200); assert.match((await result.json()).text,/different approaches/);
  const unknown = await post(url+'/api/rewrite',{text:'完全不同的输入',tone:'natural',language:'zh'}); assert.equal(unknown.status,422);
}));
test('拒绝跨站请求、坏 JSON、无效类型与过大请求', async () => withServer(async url => {
  assert.equal((await post(url+'/api/rewrite',{}, {Origin:'https://evil.example'})).status,403);
  assert.equal((await post(url+'/api/rewrite',{}, {'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await fetch(url+'/api/rewrite',{method:'POST',body:'{}'})).status,415);
  assert.equal((await fetch(url+'/api/rewrite',{method:'POST',headers:{'Content-Type':'application/json'},body:'{broken'})).status,400);
  assert.equal((await post(url+'/api/rewrite',{text:'x'.repeat(21000)})).status,413);
  assert.equal((await post(url+'/api/rewrite',null)).status,400);
  assert.equal((await post(url+'/api/test',null)).status,400);
}));
test('AI 转发正确传递文本与配置，连接测试不发送编辑器文本（模拟服务）', async () => {
  const calls = [];
  await withServer(async url => {
    const res = await post(url+'/api/rewrite',{text:'请保留我的休息时间',tone:'professional',language:'en',config:validConfig}); assert.equal(res.status,200); assert.equal((await res.json()).mode,'ai');
    const probe = await post(url+'/api/test',{config:validConfig}); assert.equal(probe.status,200); assert.deepEqual(await probe.json(),{ok:true});
    assert.equal(calls.length,2); assert.equal(calls[0].input.text,'请保留我的休息时间'); assert.equal(calls[0].config.key,validConfig.key); assert.equal(calls[1].input.text,'Please reply during working hours.');
  }, {modelCall:async (input,config) => { calls.push({input,config}); return {text:'Please respect my time outside work.',mode:'ai',language:input.language,tone:input.tone}; }});
});
test('错误不包含密钥或上游内部细节，不静默回退成示例', async () => withServer(async url => {
  const res = await post(url+'/api/rewrite',{text:'hello',tone:'natural',language:'en',config:validConfig}); assert.equal(res.status,500); const body = await res.text(); assert.doesNotMatch(body,/test-only|internal-secret|demo/);
}, {modelCall:async () => { throw new Error('internal-secret '+validConfig.key); }}));
test('上游超时等可恢复错误保留安全提示', async () => withServer(async url => {
  const res = await post(url+'/api/test',{config:validConfig}); assert.equal(res.status,502); assert.match((await res.json()).error,/超时/);
}, {modelCall:async () => { throw new AppError('模型响应超时，请稍后重试。',502); }}));

test('取消客户端请求会中止服务端的模型请求', async () => {
  let started;
  const start = new Promise(resolve => { started = resolve; });
  let stopped;
  const stop = new Promise(resolve => { stopped = resolve; });
  await withServer(async url => {
    const controller = new AbortController();
    const request = fetch(url+'/api/rewrite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'hello',tone:'natural',language:'en',config:validConfig}),signal:controller.signal}).catch(error => error);
    await start; controller.abort();
    await Promise.race([stop,new Promise((_,reject) => { const timer = setTimeout(() => reject(new Error('upstream not aborted')),1500); timer.unref(); })]);
    assert.equal((await request).name,'AbortError');
  }, {modelCall:async (_input,_config,signal) => { started(); return new Promise((_,reject) => { signal.addEventListener('abort',() => { stopped(); reject(new AppError('已取消',499)); },{once:true}); }); }});
});
