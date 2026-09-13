import { providers, catalogCheckedAt } from './providers.js';
const $ = id => document.getElementById(id);
const toneLabels = { natural: '自然得体', professional: '得体专业', linkedin: '领英浓度拉满' };
const toneHelp = { natural: '简洁、友好，像日常说话一样自然。', professional: '专业、克制，适合日常工作沟通。', linkedin: '更积极的职业叙事，带一点恰到好处的夸张。' };
const examples = { colleague: '我同事是傻逼', resign: '这破工作谁爱干谁干，我不干了', meeting: '这个会真的有必要开吗？', boundary: '下班了，别再找我了' };
let testController;
let connectionTested = false;
let tone = 'professional';
let config = null;
let busy = false;
let revision = 0;
let activeController;
let previewController;
let resultText = $('result').textContent;
let resultLanguage = $('language').value;

function notify(message = '', error = false) { $('status').textContent = message; $('status').classList.toggle('error', error); }
async function requestJSON(path, payload, signal) {
  let response;
  try { response = await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal}); }
  catch (error) { if (error.name === 'AbortError') throw error; throw new Error('无法连接本地服务，请确认服务仍在运行。'); }
  let data;
  try { data = await response.json(); } catch { throw new Error('服务返回格式异常，请重试。'); }
  if (!response.ok) throw new Error(typeof data?.error === 'string' ? data.error : '请求失败，请检查配置后重试。');
  return data;
}
function updateCount() { $('counter').textContent = `${$('source').value.length.toLocaleString()} / 2,000`; $('generate').disabled = busy || !$('source').value.trim(); }
function stopSpeech() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); $('speak').textContent = '朗读'; $('speak').setAttribute('aria-label', '朗读结果'); }
function invalidate() {
  revision++;
  if (activeController) activeController.abort();
  previewController?.abort();
  stopSpeech();
  resultText = '';
  $('result').textContent = '换个说法，意思不变。';
  $('output-tag').textContent = '等待转换';
  $('copy').disabled = true; $('speak').disabled = true;
  notify(); updateCount();
}
function selectTone(value) { tone = value; document.querySelectorAll('[data-tone]').forEach(button => { const selected = button.dataset.tone === tone; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); }); $('tone-help').textContent = toneHelp[tone]; }
function setBusy(value) { busy = value; $('generate-label').textContent = value ? '正在改写…' : '得体一下'; $('generate').classList.toggle('loading', value); document.querySelector('.workspace').classList.toggle('busy', value); $('output').setAttribute('aria-busy', String(value)); updateCount(); }

async function refreshPreview() {
  const currentRevision = revision;
  const controller = new AbortController();
  previewController = controller;
  const language = $('language').value;
  const selectedTone = tone;
  let reference = false;
  try {
    const input = {text:$('source').value.trim() || examples.colleague,tone:selectedTone,language};
    reference = !$('source').value.trim();
    let response = await fetch('/api/rewrite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:controller.signal});
    if (response.status === 422) {
      reference = true;
      response = await fetch('/api/rewrite',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...input,text:examples.colleague}),signal:controller.signal});
    }
    if (!response.ok) throw new Error('示例暂时无法加载，请重试。');
    const data = await response.json();
    if (currentRevision !== revision || controller.signal.aborted) return;
    resultText = data.text; resultLanguage = language;
    $('result').textContent = resultText;
    $('output-tag').textContent = reference ? `风格参考 · ${toneLabels[selectedTone]} · 示例原句：${examples.colleague}` : `本地示例 · ${toneLabels[selectedTone]}`;
    $('result-caption').textContent = reference ? '这是风格示例，不是左侧内容的改写。' : '同一句话，试试不同的得体程度。';
    $('copy').disabled = reference;
    $('speak').disabled = !('speechSynthesis' in window);
  } catch (error) { if (currentRevision === revision && error.name !== 'AbortError') notify('示例暂时无法加载，请确认本地服务正在运行。',true); }
  finally { if (previewController === controller) previewController = null; }
}

async function generate() {
  if (busy || !$('source').value.trim()) return null;
  previewController?.abort();
  const currentRevision = revision;
  const text = $('source').value.trim();
  const language = $('language').value;
  const selectedTone = tone;
  if (text.length > 2000) { notify('输入不能超过 2,000 个字符。', true); return null; }
  activeController = new AbortController();
  setBusy(true); stopSpeech(); notify();
  try {
    const data = await requestJSON('/api/rewrite',{text,tone:selectedTone,language,...(config ? {config} : {})},activeController.signal);
    if (currentRevision !== revision) return null;
    if (typeof data?.text !== 'string' || !data.text.trim() || !['en','zh'].includes(data.language)) throw new Error('模型未返回有效文本，请重试。');
    resultText = data.text; resultLanguage = data.language;
    if (data.mode === 'ai') $('mode-badge').textContent = `${providers[config.provider]?.name || 'AI'} · 已连接`;
    $('result').textContent = resultText;
    $('result-caption').textContent = '有话直说，换个说法。';
    $('output-tag').textContent = `${data.mode === 'demo' ? '本地示例' : 'AI 改写'} · ${toneLabels[selectedTone]}`;
    $('copy').disabled = false; $('speak').disabled = !('speechSynthesis' in window);
    notify(data.mode === 'demo' ? '已展示该场景的预设表达。连接 AI 后可自由改写。' : '转换完成，请结合实际语境审阅后使用。');
    return {text: resultText, language: data.language, tone: selectedTone, mode: data.mode};
  } catch (error) {
    if (currentRevision === revision && error.name !== 'AbortError') { resultText = ''; $('result').textContent = '暂时没能完成转换。'; $('output-tag').textContent = '请查看下方提示'; $('copy').disabled = true; $('speak').disabled = true; notify(error.message || '本地服务连接失败，请确认服务仍在运行。', true); }
    return null;
  } finally { activeController = null; setBusy(false); }
}

$('source').addEventListener('input', invalidate);
$('clear').addEventListener('click', () => { $('source').value = ''; invalidate(); $('source').focus(); });
$('language').addEventListener('change', () => { invalidate(); refreshPreview(); });
document.querySelectorAll('[data-tone]').forEach(button => button.addEventListener('click', () => { if (tone !== button.dataset.tone) { selectTone(button.dataset.tone); invalidate(); refreshPreview(); } }));
document.querySelectorAll('[data-example]').forEach(button => button.addEventListener('click', () => { $('source').value = examples[button.dataset.example]; invalidate(); refreshPreview(); $('source').focus(); }));
$('generate').addEventListener('click', generate);
$('source').addEventListener('keydown', event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); generate(); } });
$('copy').addEventListener('click', async () => { if (!resultText) return; try { await navigator.clipboard.writeText(resultText); notify('已复制，可以粘贴到你的消息或动态中。'); } catch { notify('浏览器未允许访问剪贴板，请选中结果手动复制。', true); } });
$('speak').disabled = !('speechSynthesis' in window);
$('speak').addEventListener('click', () => {
  if (!resultText || !('speechSynthesis' in window)) return;
  if (speechSynthesis.speaking) { stopSpeech(); return; }
  const utterance = new SpeechSynthesisUtterance(resultText);
  utterance.lang = resultLanguage === 'zh' ? 'zh-CN' : 'en-US'; utterance.rate = .95;
  utterance.onend = stopSpeech;
  utterance.onerror = event => { stopSpeech(); if (!['interrupted','canceled'].includes(event.error)) notify('当前设备无法朗读此语言，请检查系统语音。', true); };
  $('speak').textContent = '■'; $('speak').setAttribute('aria-label', '停止朗读'); speechSynthesis.speak(utterance);
});
function modelChanged() {
  const custom = $('model-choice').value === 'custom';
  $('custom-model-field').hidden = !custom; $('model').required = custom;
  $('selected-model-id').textContent = custom ? '使用你在该厂商控制台看到的模型 ID 或推理接入点 ID。' : `API 模型 ID：${$('model-choice').value}`;
}
function applyProvider(id, saved) {
  const provider = providers[id];
  $('provider').value = id;
  $('endpoint').value = saved?.endpoint || provider.endpoint;
  const options = provider.models.map(model => new Option(`${model.label}${model.tag ? ` · ${model.tag}` : ''}`, model.id));
  options.push(new Option('自定义模型 ID…', 'custom'));
  $('model-choice').replaceChildren(...options);
  if (saved?.model) { $('model-choice').value = provider.models.some(model => model.id === saved.model) ? saved.model : 'custom'; $('model').value = saved.model; }
  else { $('model-choice').value = provider.models[0]?.id || 'custom'; $('model').value = ''; }
  $('endpoint-details').open = false;
  $('provider-docs').href = provider.docs;
  $('provider-key').href = provider.keyUrl;
  $('provider-key').setAttribute('aria-label',`获取 ${provider.name} API Key`);
  $('provider-catalog').href = provider.catalogUrl;
  $('provider-latest').textContent = `当前主推：${provider.latest}`;
  $('provider-note').textContent = provider.note;
  $('catalog-date').textContent = `官方资料核查：${catalogCheckedAt} · 非实时账户可用列表`;
  $('api-key').value = ''; $('api-key').type = 'password'; $('toggle-key').textContent = '显示'; $('toggle-key').setAttribute('aria-label', '显示密钥'); $('toggle-key').setAttribute('aria-pressed', 'false');
  modelChanged();
}
function readConfig() {
  let url;
  try { url = new URL($('endpoint').value.trim()); } catch { throw new Error('请填写有效的 API 地址。'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443')) throw new Error('请使用不含账号、查询参数的标准 HTTPS API 地址。');
  if (url.hostname === 'localhost' || url.hostname.endsWith('.localhost') || /^\[|^[\d.]+$/.test(url.hostname)) throw new Error('API 地址必须是公开服务的域名。');
  const model = $('model-choice').value === 'custom' ? $('model').value.trim() : $('model-choice').value;
  const key = $('api-key').value.trim();
  if (!model || !key || /[\u0000-\u001f\u007f]/.test(key) || key.length > 4096) throw new Error('请填写有效的模型名称与 API 密钥。');
  return {endpoint:url.href, model, key, provider:$('provider').value};
}
function resetTest() { connectionTested = false; testController?.abort(); $('settings-status').textContent = ''; }
function openSettings() { $('settings-status').textContent = ''; $('settings-dialog').showModal(); }
$('settings-open').addEventListener('click', openSettings);
for (const id of ['about-open', 'sources-open']) $(id).addEventListener('click', () => $('about-dialog').showModal());
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
$('provider').addEventListener('change', () => { applyProvider($('provider').value); resetTest(); });
$('model-choice').addEventListener('change', modelChanged);
for (const id of ['endpoint','model','model-choice','api-key']) $(id).addEventListener('input', resetTest);
$('toggle-key').addEventListener('click', () => { const show = $('api-key').type === 'password'; $('api-key').type = show ? 'text' : 'password'; $('toggle-key').textContent = show ? '隐藏' : '显示'; $('toggle-key').setAttribute('aria-label', show ? '隐藏密钥' : '显示密钥'); $('toggle-key').setAttribute('aria-pressed', String(show)); });
$('test-connection').addEventListener('click', async () => {
  let candidate;
  try { candidate = readConfig(); } catch (error) { $('settings-status').textContent = error.message; return; }
  testController = new AbortController();
  $('test-connection').disabled = true;
  $('save-config').disabled = true;
  $('settings-status').textContent = '正在验证接口、密钥和模型…';
  try {
    const data = await requestJSON('/api/test',{config:candidate},testController.signal);
    if (data?.ok !== true) throw new Error('模型服务未通过连接验证。');
    connectionTested = true;
    $('settings-status').textContent = `连接成功 · ${candidate.model} 已返回有效响应`;
  } catch (error) { if (error.name !== 'AbortError') $('settings-status').textContent = error.message || '无法连接本地服务。'; }
  finally { $('test-connection').disabled = false; $('save-config').disabled = false; testController = null; }
});
$('settings-dialog').addEventListener('close', () => { testController?.abort(); $('api-key').type = 'password'; $('toggle-key').textContent = '显示'; $('toggle-key').setAttribute('aria-label', '显示密钥'); $('toggle-key').setAttribute('aria-pressed', 'false'); });
$('settings-form').addEventListener('submit', event => {
  event.preventDefault();
  try { config = readConfig(); } catch (error) { $('settings-status').textContent = error.message; return; }
  try { localStorage.setItem('speak-preferences', JSON.stringify({provider:config.provider,endpoint:config.endpoint,model:config.model})); } catch { /* Storage is optional; the in-memory configuration still works. */ }
  $('mode-badge').textContent = `${providers[config.provider].name} · ${connectionTested ? '已连接' : '未验证'}`; $('mode-badge').classList.add('live');
  $('privacy-note').textContent = '◇ 文本仅发送至你配置的模型服务 · 密钥不写入磁盘';
  invalidate(); $('settings-dialog').close(); notify('模型配置已保存至本页内存，转换时将验证连接。');
});
function useDemo() { config = null; connectionTested = false; testController?.abort(); $('api-key').value = ''; $('mode-badge').textContent = '本地示例模式'; $('mode-badge').classList.remove('live'); $('privacy-note').textContent = '◇ 本地示例不上传文本 · 接入模型后支持自由改写'; invalidate(); }
$('use-demo').addEventListener('click', () => { useDemo(); $('settings-dialog').close(); notify('已切回本地示例模式，并清除密钥。'); });
window.addEventListener('pagehide', useDemo);
let savedPreferences;
try { const saved = JSON.parse(localStorage.getItem('speak-preferences')); if (saved && Object.hasOwn(providers,saved.provider) && typeof saved.endpoint === 'string' && typeof saved.model === 'string') savedPreferences = saved; } catch { /* Ignore unavailable or outdated preferences. */ }
$('provider').replaceChildren(...Object.entries(providers).map(([id,provider]) => new Option(provider.name,id)));
applyProvider(savedPreferences?.provider || 'deepseek', savedPreferences);
updateCount();

if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'rewrite_workplace_text', title: '转换职场表达',
      description: '将文本按指定风格改写，并更新可见工作台。配置 AI 时会将输入发送给用户配置的服务；否则只支持本地示例。',
      inputSchema: {type:'object',properties:{text:{type:'string',minLength:1,maxLength:2000},tone:{type:'string',enum:Object.keys(toneLabels)},language:{type:'string',enum:['en','zh']}},required:['text','tone','language'],additionalProperties:false},
      annotations:{readOnlyHint:false,untrustedContentHint:true},
      async execute(input) {
        if (!input || typeof input.text !== 'string' || !input.text.trim() || input.text.length > 2000 || !Object.hasOwn(toneLabels,input.tone) || !['en','zh'].includes(input.language)) throw new Error('输入参数无效。');
        if (busy) throw new Error('正在转换，请稍后再试。');
        $('source').value = input.text; $('language').value = input.language; selectTone(input.tone); invalidate();
        const result = await generate();
        if (!result) throw new Error($('status').textContent || '转换未完成。');
        return result;
      }
    }, {signal:lifecycle.signal})).catch(() => {});
  } catch { /* The optional browser capability does not affect ordinary use. */ }
  window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
}
