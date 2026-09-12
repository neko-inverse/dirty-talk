# 得体 Talk · Dirty talk，得体说

设计主题：Dirty 与「得体」的谐音，采用校改式标题、纸张底色与简洁的编辑排版。切换表达风格或输出语言会自动更新本地示例；对未知输入展示明确标注的风格参考，不自动发送密钥或调用付费模型。

根据两张本地参考截图实现的独立职场表达转换器。截图来源为 Kagi Translate 的 LinkedIn Speak 模式；参考原图不随仓库分发，也不是运行所需文件。本项目与 Kagi、LinkedIn 无隶属关系。

## 本地运行

需要 Node.js 22 或以上。应用运行无需安装依赖：

```sh
npm start
```

打开 http://127.0.0.1:4317 。关闭运行服务的终端即可停止；如端口占用，在 PowerShell 使用 `$env:PORT=4318; npm start`。

## 功能

- 双栏输入与结果，手机自动变为上下排列。
- 自然得体、得体专业、领英浓度拉满三种风格；默认简体中文，可切换英文输出。
- 同事协作、辞职、会议、工作边界 4 个场景，24 种本地预设表达；本地模式仅匹配已知示例和有限别名，未知文本明确提示连接 AI。
- 仅提供 8 家国内自研模型厂商：DeepSeek、通义千问、Kimi、智谱 GLM、MiniMax、百度文心、字节豆包、腾讯混元；不含海外厂商或第三方聚合平台。
- 每家对应当前主推模型、可调用型号、获取 API Key 入口、官方模型目录和核查日期。保留自定义模型 ID 与接口地址以适应地域、账户权限和私有接入点。
- 服务商选择、模型选择、自定义模型 ID、接口地址、API Key 显示/隐藏、真实连接测试。
- API Key 只在当前页面内存中保留；关闭、刷新或离开页面会清除。仅服务商、地址、模型偏好保存在本机 localStorage，不保存输入、结果或密钥。切换服务商会清空密钥输入框。
- 复制、浏览器原生朗读、Ctrl/Cmd + Enter、字符限制、取消过时请求和中文错误提示。

右上角「模型设置」选择服务商，填入 API Key，点击「测试连接」后「保存并使用」。连接测试会发送固定短文本到所选模型，可能产生少量调用费用。预设模型来自官方文档，不保证你的账户具有对应权限，可填写任意受服务商支持的模型 ID。

## 实现

### 项目结构

```text
dist/                  浏览器源码与静态资源（手写源文件，需提交）
engine.mjs             本地示例和改写提示词
server.mjs             本地 HTTP 服务与模型请求代理
tests/                 单元、接口和浏览器回归测试
playwright.config.mjs  浏览器测试配置
MODEL-CATALOG.md       国内厂商型号与官方来源
RESEARCH.md            产品调研依据
TEST-REPORT.md         测试范围与验证边界
```

`node_modules/`、测试产物、日志、环境文件和本地参考原图均不进入 Git 仓库。`package.json` 中的 `private: true` 仅防止误发布到 npm，不影响 GitHub 仓库公开。

### 技术与安全边界

单页原生 HTML/CSS/ES Modules + Node.js 标准库服务端；无应用运行依赖、无构建步骤、无外部字体请求。按 Ponytail 的 full 模式使用浏览器原生 dialog、Clipboard、SpeechSynthesis 等能力。Playwright 只用于开发测试。

服务端仅监听 `127.0.0.1`，以白名单提供静态资源；校验请求来源、JSON 和输入长度；HTTPS 请求固定解析到公开 IPv4 地址、禁止重定向；密钥不会写入磁盘或日志。页面变化会取消请求并通知上游停止，供应商已经完成的计算仍可能计费。HTTPS 仅支持公开 IPv4 域名，不支持局域网模型、IPv6-only 服务、非 443 端口或原生 Anthropic/Gemini 专用协议。自定义入口需要 Chat Completions 兼容接口。

语音取决于设备安装的语言与浏览器支持；生成内容的语义和质量取决于所选模型，使用前请审阅。

## 测试

```sh
npm install
npm run check
npm test
npm run test:browser
```

浏览器测试使用本机 Chrome 的独立无头测试上下文，不读取用户浏览器资料。可用 `TEST_BROWSER_CHANNEL=msedge` 改用 Edge。测试服务自动占用 4318，与给用户展示的 4317 隔离。测试报告见 `TEST-REPORT.md`。

## 调研

来源核查、产品机制与实现取舍见 [RESEARCH.md](RESEARCH.md)。最新国内厂商目录、精确型号、密钥入口和核验边界见 [MODEL-CATALOG.md](MODEL-CATALOG.md)，模型信息以此为准。
