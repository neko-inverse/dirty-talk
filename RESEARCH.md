# LinkedIn Speak 调研与实现依据

核查日期：2026-09-12。依据两张本地截图、官方资料和媒体报道；未取得 Kagi 的私有提示词，也不声称复刻其内部模型。

## 图片识别

两图展示的是翻译器界面，目标语言均为 LinkedIn Speak。源语言出现简体中文及 Chinese (Singapore)，界面包含词义、发音、语音输入、复制、朗读等入口，并出现 Basic、Best 档位。

第一类示例将侮辱同事的直白句改写为双方有不同协作方式；第二类示例把愤怒辞职改写为寻求新挑战、个人成长、价值观契合的职业公告。核心是语域和叙事转换，而非逐字中英翻译。

## 来源核实

1. [Kagi 官方更新日志](https://kagi.com/changelog)：LinkedIn Speak 是 Kagi Translate 的趣味语言模式，官方记录其于 2026 年 3 月推出。
2. [Kagi Translate 官方文档](https://help.kagi.com/kagi/translate/)：提供上下文感知翻译、语气与正式程度等自定义能力，也有词典、语音、网页和文档翻译。原产品的能力大于本次专注表达转换的实现范围。
3. [官方 URL 参数说明](https://help.kagi.com/kagi/translate/url-parameters.html)：描述来源/目标语言、质量、正式程度、上下文、格式保留等网页参数。URL 参数不是可用作自建后端的文本翻译 API。
4. [原版模式入口](https://translate.kagi.com/?from=en&to=LinkedIn+speak)：可直接进入 LinkedIn Speak 目标模式，访问限制依 Kagi 当时账户与服务政策。
5. [Fast Company 报道](https://www.fastcompany.com/91511316/this-eerily-accurate-linkedin-speak-translation-tool-will-help-you-sound-like-an-instant-thinkfluencer)：观察到个人成长、影响力、协作等职业化叙事，及夸张的领英公告风格。媒体样例描述并不等于固定的官方生成规则。

## 实现决策

- 核心工作区直接显示输入与结果，不另设营销落地页。
- 三种风格是本项目的表达控制，不冒充 Kagi 的 Basic/Best 质量档位。
- 采用独立模型接口与本地代理，不调用或抓取 Kagi 的私有接口。
- 精简模式用确定性的已知示例，不通过关键词给任意输入拼接貌似正确的输出。
- AI 提示词约束保留日期、数字、否定和边界，不能把拒绝改成接受，也不能凭空添加业绩、感谢、承诺或身份。
- 密钥由用户在页面配置；调用失败明确报错，不悄悄切换示例并伪装 AI 成功。
- 无账号、数据库、上传和在线发布流程；符合本次本地运行的目标。

## 首轮服务商调研（历史记录）

下表记录早期调研，不代表当前配置。当前已移除 OpenAI 和 SiliconFlow，仅提供 8 家国内自研厂商；当前型号、密钥入口与来源以 [MODEL-CATALOG.md](MODEL-CATALOG.md) 为准。

| 提供商 | 预填 Base URL | 模型示例 | 官方依据 |
| --- | --- | --- | --- |
| DeepSeek | `https://api.deepseek.com` | `deepseek-v4-flash`、`deepseek-v4-pro` | [首次调用](https://api-docs.deepseek.com/) |
| 通义千问，北京 | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | [Base URL](https://help.aliyun.com/zh/model-studio/base-url)、[子工作空间调用](https://help.aliyun.com/en/model-studio/model-calling-in-sub-workspace) |
| SiliconFlow | `https://api.siliconflow.cn/v1` | `deepseek-ai/DeepSeek-V4-Flash`、`deepseek-ai/DeepSeek-V3.2` | [快速上手](https://docs.siliconflow.cn/docs/userguide/quickstart)、[模型中心](https://siliconflow.cn/models)、[文本生成](https://docs.siliconflow.cn/docs/userguide/capabilities/text-generation) |
| OpenAI | `https://api.openai.com/v1` | `gpt-4.1-mini`、`gpt-4.1` | [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini)、[Chat Completions](https://developers.openai.com/api/reference/resources/chat/subresources/completions/methods/create) |

阿里云端点与密钥区域必须匹配；官方已提供工作空间专用域名，用户可在高级设置替换。本表只表示文档中的兼容示例，不表示已用真实密钥逐一连通，也不保证服务商未来可用模型不变。
