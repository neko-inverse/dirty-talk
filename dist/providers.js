// Official text-generation catalog, checked 2026-09-12. See MODEL-CATALOG.md.
export const catalogCheckedAt = '2026-09-12';
export const providers = {
  deepseek: {
    name: 'DeepSeek · 深度求索', endpoint: 'https://api.deepseek.com',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    docs: 'https://api-docs.deepseek.com/', catalogUrl: 'https://api-docs.deepseek.com/quick_start/pricing/',
    latest: 'DeepSeek V4.1 Flash',
    note: '官方当前推荐 deepseek-flash；旧 V4 Flash 名称仅为兼容别名。使用开放平台 API Key。',
    models: [
      {id:'deepseek-flash',label:'DeepSeek V4.1 Flash',tag:'当前主推',request:{thinking:{type:'disabled'}}},
      {id:'deepseek-v4-pro',label:'DeepSeek V4 Pro · 0813',tag:'仍提供服务',request:{thinking:{type:'disabled'}}}
    ]
  },
  qwen: {
    name: '通义千问 · 阿里云百炼', endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    keyUrl: 'https://bailian.console.aliyun.com/cn-beijing/model/settings/api-key',
    docs: 'https://help.aliyun.com/zh/model-studio/get-api-key', catalogUrl: 'https://help.aliyun.com/zh/model-studio/text-generation-model',
    latest: 'Qwen3.8 Max / Qwen3.8 Flash',
    note: '预填北京地域按量付费接口。API Key、地域和工作空间需匹配；不使用 Coding / Token Plan 专用密钥。',
    models: [
      {id:'qwen3.8-flash',label:'Qwen3.8 Flash',tag:'最新系列 · 轻量',request:{enable_thinking:false}},
      {id:'qwen3.8-max',label:'Qwen3.8 Max',tag:'最新系列 · 旗舰',request:{enable_thinking:false}},
      {id:'qwen3.8-max-0902',label:'Qwen3.8 Max · 0902',tag:'固定快照',request:{enable_thinking:false}},
      {id:'qwen3.7-plus',label:'Qwen3.7 Plus',tag:'均衡',request:{enable_thinking:false}},
      {id:'qwen3.7-flash',label:'Qwen3.7 Flash',tag:'轻量',request:{enable_thinking:false}},
      {id:'qwen3.7-max',label:'Qwen3.7 Max',tag:'旧版',request:{enable_thinking:false}},
      {id:'qwen3.6-plus',label:'Qwen3.6 Plus',tag:'旧版',request:{enable_thinking:false}},
      {id:'qwen3.6-flash',label:'Qwen3.6 Flash',tag:'旧版',request:{enable_thinking:false}},
      {id:'qwen3.5-plus',label:'Qwen3.5 Plus',tag:'旧版',request:{enable_thinking:false}},
      {id:'qwen3.5-flash',label:'Qwen3.5 Flash',tag:'旧版',request:{enable_thinking:false}},
      {id:'qwen-plus',label:'Qwen Plus',tag:'旧版别名',request:{enable_thinking:false}},
      {id:'qwen-flash',label:'Qwen Flash',tag:'旧版别名',request:{enable_thinking:false}},
      {id:'qwen-turbo',label:'Qwen Turbo',tag:'旧版',request:{enable_thinking:false}},
      {id:'qwen-max',label:'Qwen Max',tag:'旧版'},
      {id:'qwen-long',label:'Qwen Long',tag:'长文本'}
    ]
  },
  kimi: {
    name:'Kimi · 月之暗面',endpoint:'https://api.moonshot.cn/v1',
    keyUrl:'https://platform.kimi.com/console/api-keys',
    docs:'https://platform.kimi.com/docs/guide/kimi-k3-quickstart',catalogUrl:'https://platform.kimi.com/docs/models',
    latest:'Kimi K3',note:'K3 与 K2.7 Code 系列始终思考，响应可能较慢；K2.6 可关闭思考。已下线的 K2.5 与 moonshot-v1 不再预设。',
    models:[
      {id:'kimi-k3',label:'Kimi K3',tag:'最新旗舰',request:{reasoning_effort:'low'}},
      {id:'kimi-k2.7-code',label:'Kimi K2.7 Code',tag:'代码优化'},
      {id:'kimi-k2.7-code-highspeed',label:'Kimi K2.7 Code Highspeed',tag:'代码高速版'},
      {id:'kimi-k2.6',label:'Kimi K2.6',tag:'可关闭思考',request:{thinking:{type:'disabled'}}}
    ]
  },
  zhipu: {
    name:'GLM · 智谱',endpoint:'https://open.bigmodel.cn/api/paas/v4',
    keyUrl:'https://bigmodel.cn/usercenter/proj-mgmt/apikeys',
    docs:'https://docs.bigmodel.cn/cn/guide/models/text/glm-5.3',catalogUrl:'https://docs.bigmodel.cn/cn/guide/start/model-overview',
    latest:'GLM-5.3 / GLM-5.3-Flash',note:'使用智谱开放平台按量付费密钥。GLM-5.3 始终思考；GLM-4.5-Flash 已下线，不再预设。',
    models:[
      {id:'glm-5.3',label:'GLM-5.3',tag:'最新旗舰',request:{thinking:{type:'enabled'},reasoning_effort:'low'}},
      {id:'glm-5.3-flash',label:'GLM-5.3-Flash',tag:'最新轻量'},
      ...['glm-5.2','glm-5.1','glm-5','glm-5-turbo','glm-4.7','glm-4.7-flash','glm-4.6','glm-4.5','glm-4-flash-250414'].map(id=>({id,label:id.toUpperCase(),tag:'其他在售型号'}))
    ]
  },
  minimax: {
    name:'MiniMax · 稀宇科技',endpoint:'https://api.minimax.cn/v1',
    keyUrl:'https://platform.minimax.cn/console/access?tab=api-keys',
    docs:'https://platform.minimax.cn/docs/api-reference/text-openai-api',catalogUrl:'https://platform.minimax.cn/docs/api-reference/text-openai-api',
    latest:'MiniMax-M3',note:'使用国内开放平台按量付费密钥，不使用 Token Plan 专用密钥。M3 可关闭思考，M2 系列保留思考但与正文分离。',
    models:[
      {id:'MiniMax-M3',label:'MiniMax M3',tag:'最新旗舰',request:{thinking:{type:'disabled'},reasoning_split:true}},
      ...['MiniMax-M2.7','MiniMax-M2.7-highspeed','MiniMax-M2.5','MiniMax-M2.5-highspeed','MiniMax-M2.1','MiniMax-M2.1-highspeed','MiniMax-M2'].map(id=>({id,label:id,tag:id.endsWith('highspeed')?'高速版':'其他在售型号',request:{reasoning_split:true}}))
    ]
  },
  baidu: {
    name:'文心 · 百度千帆',endpoint:'https://qianfan.baidubce.com/v2',
    keyUrl:'https://console.bce.baidu.com/iam/#/iam/apikey/list',
    docs:'https://cloud.baidu.com/doc/qianfan/s/rmh4stn9m',catalogUrl:'https://cloud.baidu.com/doc/qianfan/s/rmh4stp0j',
    latest:'ERNIE 5.1',note:'使用千帆 V2 的 API Key（Bearer 鉴权），不是旧版 API Key + Secret Key 换取的 access_token。具体权限以控制台为准。',
    models:[
      {id:'ernie-5.1',label:'ERNIE 5.1',tag:'最新旗舰'},
      ...['ernie-5.0','ernie-5.0-thinking-preview','ernie-5.0-thinking-latest','ernie-5.0-thinking-exp','ernie-4.5-turbo-32k','ernie-4.5-turbo-128k','ernie-4.5-turbo-20260402'].map(id=>({id,label:id,tag:id.includes('thinking')?'思考版本':'其他在售型号'}))
    ]
  },
  doubao: {
    name:'豆包 · 字节跳动',endpoint:'https://ark.cn-beijing.volces.com/api/v3',
    keyUrl:'https://console.volcengine.com/ark/region:ark+cn-beijing/apikey',
    docs:'https://github.com/volcengine/ark-runtime-python',catalogUrl:'https://www.volcengine.com/docs/82379/1554711',
    latest:'Doubao Seed 2.1 Pro / Turbo',note:'Pro 的精确 ID 已由官方 SDK 核实。Turbo 请选「自定义模型 ID」，从方舟复制实际 Model ID 或 ep- 接入点 ID；不要直接填写产品名。',
    models:[
      {id:'doubao-seed-2-1-pro-260628',label:'Doubao Seed 2.1 Pro',tag:'最新系列'},
      {id:'doubao-seed-2-0-lite-260428',label:'Doubao Seed 2.0 Lite',tag:'轻量版本'}
    ]
  },
  hunyuan: {
    name:'混元 · 腾讯',endpoint:'https://tokenhub.tencentmaas.com/v1',
    keyUrl:'https://console.cloud.tencent.com/tokenhub/apikey?regionId=1',
    docs:'https://cloud.tencent.com/document/product/1823/130079',catalogUrl:'https://cloud.tencent.com/document/product/1823/130079',
    latest:'Hy4 Preview',note:'使用腾讯 TokenHub 新平台密钥，不混用旧混元接口密钥。Preview 为预览版本；Hy3 是思考模型。',
    models:[
      {id:'hy4-preview',label:'Hy4 Preview',tag:'最新预览'},
      {id:'hy3',label:'Hy3',tag:'思考模型'},
      {id:'hunyuan-role-latest',label:'Hunyuan Role Latest',tag:'角色对话'},
      {id:'hy-role',label:'Hy Role',tag:'角色对话'}
    ]
  }
};
