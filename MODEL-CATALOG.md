# 国内模型厂商目录

核查日期：2026-09-12。范围：8 家国内自研模型厂商的文字生成 API，服务于职场表达改写；不是所有厂商、所有模态或所有历史快照的穷尽清单。当前主推与在售信息依据以下第一方资料，不以网页发布日期推断模型发布日期。账户实际权限、地域与余额需在控制台确认。

| 厂商 | 官方当前主推 | 获取 API Key | 官方目录 / 接入依据 |
| --- | --- | --- | --- |
| DeepSeek | DeepSeek V4.1 Flash | [密钥管理](https://platform.deepseek.com/api_keys) | [模型与计费](https://api-docs.deepseek.com/quick_start/pricing/) |
| 阿里云千问 | Qwen3.8 Max / Flash | [北京地域百炼密钥](https://bailian.console.aliyun.com/cn-beijing/model/settings/api-key) | [文本模型目录](https://help.aliyun.com/zh/model-studio/text-generation-model) |
| 月之暗面 Kimi | Kimi K3 | [密钥管理](https://platform.kimi.com/console/api-keys) | [模型目录](https://platform.kimi.com/docs/models) |
| 智谱 GLM | GLM-5.3 / GLM-5.3-Flash | [密钥管理](https://bigmodel.cn/usercenter/proj-mgmt/apikeys) | [模型总览](https://docs.bigmodel.cn/cn/guide/start/model-overview) |
| MiniMax | MiniMax-M3 | [密钥管理](https://platform.minimax.cn/console/access?tab=api-keys) | [文本 API](https://platform.minimax.cn/docs/api-reference/text-openai-api) |
| 百度文心 | ERNIE 5.1 | [IAM API Key](https://console.bce.baidu.com/iam/#/iam/apikey/list) | [千帆模型列表](https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j) |
| 字节豆包 | Seed 2.1 Pro / Turbo | [方舟密钥](https://console.volcengine.com/ark/region:ark+cn-beijing/apikey) | [官方 SDK](https://github.com/volcengine/ark-runtime-python)、[模型目录](https://www.volcengine.com/docs/82379/1554711) |
| 腾讯混元 | Hy4 Preview | [TokenHub 密钥](https://console.cloud.tencent.com/tokenhub/apikey?regionId=1) | [模型与调用说明](https://cloud.tencent.com/document/product/1823/130079) |

## 网站预设的精确调用 ID

- DeepSeek：`deepseek-flash`、`deepseek-v4-pro`。前者对应 V4.1 Flash；旧 `deepseek-v4-flash` 为兼容别名，不再作为新默认。
- 千问：`qwen3.8-flash`、`qwen3.8-max`、`qwen3.8-max-0902`、`qwen3.7-plus`、`qwen3.7-flash`、`qwen3.7-max`、`qwen3.6-plus`、`qwen3.6-flash`、`qwen3.5-plus`、`qwen3.5-flash`、`qwen-plus`、`qwen-flash`、`qwen-turbo`、`qwen-max`、`qwen-long`。
- Kimi：`kimi-k3`、`kimi-k2.7-code`、`kimi-k2.7-code-highspeed`、`kimi-k2.6`。代码优化型号不是本站推荐的通用改写默认。目录注明 K2.5、moonshot-v1 已下线，故排除。
- 智谱：`glm-5.3`、`glm-5.3-flash`、`glm-5.2`、`glm-5.1`、`glm-5`、`glm-5-turbo`、`glm-4.7`、`glm-4.7-flash`、`glm-4.6`、`glm-4.5`、`glm-4-flash-250414`。已下线的 `glm-4.5-flash` 不预设。
- MiniMax：`MiniMax-M3`、`MiniMax-M2.7`、`MiniMax-M2.7-highspeed`、`MiniMax-M2.5`、`MiniMax-M2.5-highspeed`、`MiniMax-M2.1`、`MiniMax-M2.1-highspeed`、`MiniMax-M2`。
- 百度：`ernie-5.1`、`ernie-5.0`、`ernie-5.0-thinking-preview`、`ernie-5.0-thinking-latest`、`ernie-5.0-thinking-exp`、`ernie-4.5-turbo-32k`、`ernie-4.5-turbo-128k`、`ernie-4.5-turbo-20260402`。
- 豆包：`doubao-seed-2-1-pro-260628`（官方 Ark SDK 示例）、`doubao-seed-2-0-lite-260428`（[官方 OpenViking 采购说明](https://github.com/volcengine/OpenViking/blob/main/docs/en/guides/02-volcengine-purchase-guide.md)）。[官方发布页](https://seed.bytedance.com/zh/blog/seed2-1-officially-released-advancing-ai-productivity)确认 2.1 Turbo 产品存在，但本次未从正式 API 文档 / 官方 SDK 确认其精确调用 ID，因此不猜写预设，用户可从方舟复制到自定义模型 ID。
- 腾讯：`hy4-preview`、`hy3`、`hunyuan-role-latest`、`hy-role`。目录另有 `hy-mt2-pro`、`hy-mt2-plus`、`hy-mt2-lite` 等翻译专用模型；未预设为通用改写型号。新配置使用 TokenHub，[迁移说明](https://cloud.tencent.com/document/product/1823/131382)。

## 接入取舍与验证边界

- 仅使用 HTTPS Chat Completions 兼容接口；“OpenAI 兼容协议”不代表提供商是 OpenAI。已移除 OpenAI、SiliconFlow 和自定义服务商选项，旧海外偏好不会恢复到国内接口。
- 参数仅对匹配的官方接口与已知型号附加，用户修改接入地址或自定义型号时不猜厂商特有参数。DeepSeek、千问和 Kimi K2.6 按官方能力关闭思考以缩短等待；K3 / GLM-5.3 降低思考力度而非使用不支持的关闭开关；MiniMax 将推理与正文分离。
- 参数依据：[DeepSeek 思考模式](https://api-docs.deepseek.com/guides/thinking_mode/)、[千问深度思考](https://help.aliyun.com/zh/model-studio/deep-thinking)、[K3](https://platform.kimi.com/docs/guide/kimi-k3-quickstart)、[K2.6](https://platform.kimi.com/docs/guide/kimi-k2-6-quickstart)、[GLM-5.3](https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3)、上表 MiniMax 文本 API。
- API Key 管理页通常要求登录；核实的是官方入口和文档，不是用户账户的密钥权限。千问预填北京按量接口，MiniMax 使用国内按量接口，不混用 Coding / Token Plan 专用密钥。百度使用 V2 Bearer API Key，不是旧的双密钥换令牌流程。
- 没有真实密钥，因此没有声称完成八家实际付费调用。可在本地页面填入密钥后点击“测试连接”，测试会产生少量模型调用费用。密钥仅保存在当前页面内存。
- 目录是本次核查快照，不会自动宣称未来仍最新；完整历史、多模态和专用型号请进入对应官方目录。可维护数据位于 `dist/providers.js`。
