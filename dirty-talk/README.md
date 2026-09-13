# Dirty Talk 服务器部署包

将此目录整体上传到服务器即可。需要 Node.js 22 或以上；没有第三方运行依赖，不需要 npm install，也没有构建步骤。

## 文件

- server.mjs：HTTP 服务与模型 API 代理。
- engine.mjs：本地示例和改写提示词。
- dist/：页面、脚本、样式与模型目录，整个文件夹必须保留。
- package.json：ES Modules 声明与 npm start 命令。

本目录不含开发测试、node_modules、Git 历史、原始参考图片或 API Key。它是当前源码的部署快照；以后修改项目源码时，需要同步更新本目录。

## Linux 启动

进入本目录，替换为实际服务器 IP：

```sh
PUBLIC_ORIGIN=http://你的服务器IP:4317 npm start
```

默认监听 0.0.0.0:4317。如修改端口，访问来源也要对应：

```sh
PORT=8080 PUBLIC_ORIGIN=http://你的服务器IP:8080 npm start
```

未设置 PUBLIC_ORIGIN 时，只允许 localhost / 127.0.0.1 地址访问。PUBLIC_ORIGIN 必须包含协议、地址及非默认端口，不含路径。不会自动加载 .env，请通过启动环境传入变量。

## HTTPS 正式访问

```sh
PUBLIC_ORIGIN=https://talk.example.com npm start
```

将实际域名的 HTTPS 反向代理转发到 http://127.0.0.1:4317，并保留浏览器原始 Host 请求头（含非默认端口）。TLS 证书由代理配置；PUBLIC_ORIGIN 本身不会启用 HTTPS。不要通过公网明文 HTTP 填写 API Key。

防火墙应限制 4317 仅供反向代理或可信网络访问。本应用没有用户登录及限流，公开服务需要在代理层增加访问控制和限流。可以用服务器进程管理器保持运行；直接启动后按 Ctrl+C 会停止，关闭终端也可能结束进程。

## 本机 Windows 试运行

```powershell
npm start
```

打开 http://127.0.0.1:4317。若主项目正在使用该端口，可先设置 $env:PORT=4319 再启动，并访问 http://127.0.0.1:4319。

API Key 由每位使用者在网页“模型设置”填写，仅保存在当前页面内存。未配置真实密钥时可以体验本地示例。
