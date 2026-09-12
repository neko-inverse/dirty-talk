import { test, expect } from '@playwright/test';

test.beforeEach(async ({page}) => { await page.goto('/'); });
const openSettings = page => page.getByRole('button',{name:'模型设置'}).click();
async function configure(page, provider = 'deepseek') {
  await openSettings(page);
  await page.getByLabel('模型服务商').selectOption(provider);
  await page.getByLabel('API Key',{exact:true}).fill('test-only-not-a-real-key');
}

test('首页无脚本错误且静态资源均可用', async ({page}) => {
  const errors = []; page.on('pageerror',error => errors.push(error.message));
  const bad = []; page.on('response',response => { if(response.status()>=400) bad.push(response.url()); });
  await page.reload();
  await expect(page).toHaveTitle('得体 Talk · Dirty talk, 得体说');
  await expect(page.locator('h1')).toContainText('Dirty talk');
  await expect(page.locator('#language')).toHaveValue('zh');
  await expect(page.locator('#result')).toHaveText('我与同事在专业协作上有不同的工作思路。');
  expect(errors).toEqual([]); expect(bad).toEqual([]);
});

test('所有示例、风格和语言走真实本地服务（24 个组合）', async ({page}) => {
  for (const example of ['colleague','resign','meeting','boundary']) {
    await page.locator(`[data-example="${example}"]`).click();
    for (const tone of ['natural','professional','linkedin']) {
      await page.locator(`[data-tone="${tone}"]`).click();
      for (const language of ['en','zh']) {
        await page.getByLabel('输出语言',{exact:true}).selectOption(language);
        await page.locator('#generate').click();
        await expect(page.locator('#output-tag')).toContainText('本地示例');
        await expect(page.locator('#copy')).toBeEnabled();
        const result = await page.locator('#result').textContent();
        expect(result.length).toBeGreaterThan(10);
        if (language==='zh') expect(result).toMatch(/[\u4e00-\u9fff]/);
        else expect(result).toMatch(/[A-Za-z]/);
      }
    }
  }
});

test('空输入禁用转换，修改清除旧结果；Ctrl+Enter 和字数正常', async ({page}) => {
  await page.getByRole('button',{name:'清空输入'}).click();
  await expect(page.locator('#generate')).toBeDisabled();
  await expect(page.locator('#counter')).toHaveText('0 / 2,000');
  await expect(page.locator('#copy')).toBeDisabled();
  await page.locator('#source').fill('下班了，别再找我了');
  await expect(page.locator('#counter')).toHaveText('9 / 2,000');
  await page.locator('#source').press('Control+Enter');
  await expect(page.locator('#output-tag')).toContainText('本地示例');
  await page.locator('#source').fill('新内容');
  await expect(page.locator('#output-tag')).toHaveText('等待转换');
  await expect(page.locator('#copy')).toBeDisabled();
});

test('未知输入明确报错，不能冒充 AI', async ({page}) => {
  await page.locator('#source').fill('请帮我给2026年10月12日的产品会议写一段开场白');
  await page.locator('#generate').click();
  await expect(page.locator('#status')).toContainText('不在本地示例');
  await expect(page.locator('#copy')).toBeDisabled();
});

test('复制结果与显示文本一致', async ({page,context}) => {
  await context.grantPermissions(['clipboard-read','clipboard-write']);
  await page.getByRole('button',{name:'复制结果'}).click();
  await expect(page.locator('#status')).toContainText('已复制');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(await page.locator('#result').textContent());
});

test('服务商预设、自定义模型、显示密钥与切换清密钥', async ({page}) => {
  await configure(page);
  await expect(page.locator('#endpoint')).toHaveValue('https://api.deepseek.com');
  await expect(page.locator('#model-choice')).toHaveValue('deepseek-flash');
  await page.getByRole('button',{name:'显示密钥'}).click();
  await expect(page.locator('#api-key')).toHaveAttribute('type','text');
  await page.getByRole('button',{name:'隐藏密钥'}).click();
  for (const [provider,endpoint] of [['qwen','https://dashscope.aliyuncs.com/compatible-mode/v1'],['deepseek','https://api.deepseek.com']]) {
    await page.getByLabel('模型服务商').selectOption(provider);
    await expect(page.locator('#api-key')).toHaveValue('');
    await expect(page.locator('#endpoint')).toHaveValue(endpoint);
  }
  await page.getByLabel('选择模型').selectOption('custom');
  await page.locator('#endpoint-details summary').click();
  await expect(page.getByLabel('自定义模型 ID')).toBeVisible();
  await expect(page.getByLabel('API 地址',{exact:true})).toBeVisible();
});

test('保存后密钥不落盘，刷新仅恢复偏好', async ({page}) => {
  await configure(page,'qwen');
  await page.getByRole('button',{name:'保存并使用'}).click();
  await expect(page.locator('#mode-badge')).toContainText('通义千问');
  const storage = await page.evaluate(() => ({local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage)}));
  expect(JSON.stringify(storage)).not.toContain('test-only-not-a-real-key');
  await page.reload();
  await expect(page.locator('#mode-badge')).toHaveText('本地示例模式');
  await openSettings(page);
  await expect(page.getByLabel('模型服务商')).toHaveValue('qwen');
  await expect(page.locator('#api-key')).toHaveValue('');
});

test('连接测试和 AI 改写完整流程（受控模拟响应），不执行返回 HTML', async ({page}) => {
  await page.route('**/api/test',route => route.fulfill({json:{ok:true}}));
  let payload;
  await page.route('**/api/rewrite',route => { payload = route.request().postDataJSON(); return route.fulfill({json:{text:'<img src=x onerror=alert(1)> Please respect my working hours.',mode:'ai',language:'en',tone:'professional'}}); });
  await configure(page);
  await page.getByRole('button',{name:'测试连接'}).click();
  await expect(page.locator('#settings-status')).toContainText('连接成功');
  await page.getByRole('button',{name:'保存并使用'}).click();
  await expect(page.locator('#mode-badge')).toContainText('已连接');
  await page.locator('#source').fill('下班以后不要找我，我明天9点回复');
  await page.locator('#generate').click();
  await expect(page.locator('#output-tag')).toContainText('AI 改写');
  expect(payload.config.model).toBe('deepseek-flash');
  expect(payload.text).toContain('明天9点');
  expect(await page.locator('#result img').count()).toBe(0);
  await expect(page.locator('#result')).toContainText('<img');
});

test('测试连接后修改字段必须重新验证，关闭弹窗支持 Esc 并恢复焦点', async ({page}) => {
  await page.route('**/api/test',route => route.fulfill({json:{ok:true}}));
  await configure(page);
  await page.getByRole('button',{name:'测试连接'}).click();
  await expect(page.locator('#settings-status')).toContainText('连接成功');
  await page.getByLabel('API Key',{exact:true}).fill('another-test-key');
  await page.getByRole('button',{name:'保存并使用'}).click();
  await expect(page.locator('#mode-badge')).toContainText('未验证');
  await openSettings(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog',{name:'模型设置'})).not.toBeVisible();
  await expect(page.getByRole('button',{name:'模型设置'})).toBeFocused();
});

test('请求期间更改输入，旧响应不覆盖新状态', async ({page}) => {
  let release;
  const gate = new Promise(resolve => {release = resolve;});
  await page.route('**/api/rewrite',async route => { await gate; await route.fulfill({json:{text:'OLD STALE RESPONSE',mode:'demo',language:'en',tone:'professional'}}).catch(()=>{}); });
  await page.locator('#generate').click();
  await expect(page.locator('#generate')).toBeDisabled();
  await page.locator('#source').fill('新的想法');
  release();
  await expect(page.locator('#generate')).toBeEnabled();
  await expect(page.locator('#result')).not.toContainText('OLD STALE');
  await expect(page.locator('#output-tag')).toHaveText('等待转换');
});

for (const kind of ['network','json','auth']) test(`错误反馈：${kind}`, async ({page}) => {
  await page.route('**/api/rewrite',route => kind==='network' ? route.abort() : kind==='json' ? route.fulfill({status:200,contentType:'text/html',body:'<h1>Error</h1>'}) : route.fulfill({status:502,json:{error:'模型服务拒绝访问，请检查密钥和模型权限。'}}));
  await page.locator('#generate').click();
  await expect(page.locator('#status')).toContainText(kind==='network'?'无法连接本地服务':kind==='json'?'格式异常':'拒绝访问');
  await expect(page.locator('#generate')).toBeEnabled();
  await expect(page.locator('#copy')).toBeDisabled();
});

for (const width of [320,390,768,1440]) test(`布局 ${width}px：工作台与模型弹窗无横向溢出`, async ({page},testInfo) => {
  await page.setViewportSize({width,height:width<700?844:1000});
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`workspace-${width}.png`),fullPage:true});
  await openSettings(page);
  await page.getByLabel('选择模型').selectOption('custom');
  await page.locator('#endpoint-details summary').click();
  expect(await page.locator('#settings-dialog').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.screenshot({path:testInfo.outputPath(`settings-${width}.png`),fullPage:true});
});

test('可选 WebMCP 契约使用同一可见状态（模拟注册上下文）', async ({page}) => {
  await page.addInitScript(() => { Object.defineProperty(document,'modelContext',{value:{registerTool(tool){window.testTool=tool;}}}); });
  await page.reload();
  const schema = await page.evaluate(() => ({name:window.testTool.name,schema:window.testTool.inputSchema,annotations:window.testTool.annotations}));
  expect(schema.name).toBe('rewrite_workplace_text');
  expect(schema.annotations.readOnlyHint).toBe(false);
  const result = await page.evaluate(() => window.testTool.execute({text:'我同事是傻逼',tone:'natural',language:'zh'}));
  expect(result.mode).toBe('demo');
  await expect(page.locator('#result')).toHaveText(result.text);
  const invalid = await page.evaluate(() => window.testTool.execute({text:'',tone:'natural',language:'zh'}).then(()=>false,()=>true));
  expect(invalid).toBe(true);
});

test('无效配置有中文提示；清除密钥返回示例模式', async ({page}) => {
  await configure(page,'deepseek');
  await page.getByLabel('选择模型').selectOption('custom');
  await page.locator('#endpoint-details summary').click();
  await page.getByLabel('自定义模型 ID').fill('test-model');
  await page.getByLabel('API 地址',{exact:true}).fill('not-a-url');
  await page.getByRole('button',{name:'测试连接'}).click();
  await expect(page.locator('#settings-status')).toContainText('请填写有效的 API 地址');
  await page.getByLabel('API 地址',{exact:true}).fill('http://example.com');
  await page.getByRole('button',{name:'测试连接'}).click();
  await expect(page.locator('#settings-status')).toContainText('HTTPS');
  await page.getByRole('button',{name:'使用本地示例'}).click();
  await expect(page.locator('#mode-badge')).toHaveText('本地示例模式');
  await openSettings(page);
  await expect(page.locator('#api-key')).toHaveValue('');
});
