import { test, expect } from '@playwright/test';
import { providers } from '../../dist/providers.js';

test('各国内厂商的名称、型号、API Key、最新说明和目录一一对应', async ({page}) => {
  await page.goto('/'); await page.locator('#settings-open').click();
  const options = await page.locator('#provider option').allTextContents();
  expect(options).toHaveLength(Object.keys(providers).length);
  expect(options.join(' ')).not.toMatch(/OpenAI|SiliconFlow|自定义/);
  for (const [id,provider] of Object.entries(providers)) {
    await page.locator('#provider').selectOption(id);
    await expect(page.locator('#provider-key')).toHaveAttribute('href',provider.keyUrl);
    await expect(page.locator('#provider-catalog')).toHaveAttribute('href',provider.catalogUrl);
    await expect(page.locator('#provider-latest')).toContainText(provider.latest);
    await expect(page.locator('#endpoint')).toHaveValue(provider.endpoint);
    await expect(page.locator('#model-choice')).toHaveValue(provider.models[0].id);
    for (const model of provider.models) {
      await page.locator('#model-choice').selectOption(model.id);
      await expect(page.locator('#selected-model-id')).toContainText(model.id);
    }
  }
});

test('旧版海外或聚合商偏好不会恢复到国内厂商接口',async ({page}) => {
  await page.addInitScript(()=> localStorage.setItem('speak-preferences',JSON.stringify({provider:'openai',model:'old-model',endpoint:'https://api.openai.com/v1'})));
  await page.goto('/'); await page.locator('#settings-open').click();
  await expect(page.locator('#provider')).toHaveValue('deepseek');
  await expect(page.locator('#endpoint')).toHaveValue(providers.deepseek.endpoint);
  await expect(page.locator('#model-choice')).toHaveValue('deepseek-flash');
});
