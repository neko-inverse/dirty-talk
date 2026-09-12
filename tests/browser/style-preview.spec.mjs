import { test, expect } from '@playwright/test';

test('只切换风格即更新右侧示例，并同步输出语言', async ({page}) => {
  await page.goto('/');
  const outputs = [];
  for (const tone of ['natural','professional','linkedin']) {
    await page.locator(`[data-tone="${tone}"]`).click();
    await expect(page.locator('#output-tag')).toContainText('本地示例');
    const selectedLabel = await page.locator(`[data-tone="${tone}"]`).textContent();
    await expect(page.locator('#output-tag')).toContainText(selectedLabel);
    outputs.push(await page.locator('#result').textContent());
  }
  expect(new Set(outputs).size).toBe(3);
  await page.locator('#language').selectOption('en');
  await expect(page.locator('#result')).toContainText('diverse perspectives');
  await page.locator('#language').selectOption('zh');
  await expect(page.locator('#result')).toContainText('不同视角');
  await page.locator('[data-example="boundary"]').click();
  await expect(page.locator('#result')).toContainText('清晰的边界');
});

test('未知输入的风格参考明确区分，配置模型后切风格仍不发送密钥', async ({page}) => {
  await page.goto('/');
  await page.locator('#settings-open').click();
  await page.locator('#api-key').fill('test-key-not-real');
  await page.locator('#save-config').click();
  await page.locator('#source').fill('我需要你明天十点前提交报告');
  const requests = [];
  page.on('request', request => { if(request.url().endsWith('/api/rewrite')) requests.push(request.postDataJSON()); });
  await page.locator('[data-tone="natural"]').click();
  await expect(page.locator('#output-tag')).toContainText('风格参考');
  await expect(page.locator('#output-tag')).toContainText('示例原句：我同事是傻逼');
  await expect(page.locator('#result-caption')).toContainText('不是左侧内容的改写');
  await expect(page.locator('#source')).toHaveValue('我需要你明天十点前提交报告');
  await expect(page.locator('#copy')).toBeDisabled();
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.every(request => !Object.hasOwn(request,'config'))).toBe(true);
});

test('快速连续切风格，只显示最后选择的示例', async ({page}) => {
  await page.goto('/');
  await page.locator('[data-tone="natural"]').click();
  await page.locator('[data-tone="linkedin"]').click();
  await page.locator('[data-tone="professional"]').click();
  await expect(page.locator('#output-tag')).toContainText('得体专业');
  await expect(page.locator('#result')).toHaveText('我与同事在专业协作上有不同的工作思路。');
});
