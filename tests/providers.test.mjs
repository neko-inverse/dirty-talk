import test from 'node:test';
import assert from 'node:assert/strict';
import { providers, catalogCheckedAt } from '../dist/providers.js';
import { buildModelPayload } from '../server.mjs';

test('国内厂商目录具有有效密钥入口、官方资料、唯一模型 ID 与最新说明', () => {
  assert.equal(providers.openai,undefined); assert.equal(providers.siliconflow,undefined); assert.equal(providers.custom,undefined);
  assert.match(catalogCheckedAt,/^\d{4}-\d{2}-\d{2}$/);
  for (const provider of Object.values(providers)) {
    for (const field of ['keyUrl','docs','catalogUrl','endpoint']) assert.equal(new URL(provider[field]).protocol,'https:');
    assert.ok(provider.latest); assert.ok(provider.note);
    assert.ok(provider.models.length>0);
    assert.equal(new Set(provider.models.map(model=>model.id)).size,provider.models.length);
    for (const model of provider.models) { assert.ok(model.id); assert.ok(model.label); }
  }
});

test('只向已核实的官方模型和官方接口附加非思考参数', () => {
  const input = {text:'我同事是傻逼',tone:'professional',language:'en'};
  const config = {provider:'deepseek',endpoint:providers.deepseek.endpoint,key:'test-only',model:'deepseek-flash'};
  assert.deepEqual(buildModelPayload(input,config).thinking,{type:'disabled'});
  assert.equal(buildModelPayload(input,{...config,provider:'qwen',endpoint:providers.qwen.endpoint,model:'qwen3.8-flash'}).enable_thinking,false);
  assert.equal(buildModelPayload(input,{...config,endpoint:'https://example.com/v1'}).thinking,undefined);
  assert.equal(buildModelPayload(input,{...config,model:'user-private-model'}).thinking,undefined);
  assert.equal(buildModelPayload(input,config).messages[1].content,input.text);
});
