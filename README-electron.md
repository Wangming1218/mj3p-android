# 麻将三人桌面版（Windows EXE）

本项目基于 React + Vite + Electron，适合把现有 Web 前端打包成 Windows 可执行程序（.exe）。

## 1. 安装依赖

```bash
npm install
```

## 2. 开发模式（前端 + Electron）

```bash
npm run electron:dev
```

## 3. 构建 Web 前端

```bash
npm run build
```

## 4. 打包成 Windows 可执行程序（.exe）

使用安装程序（NSIS）：

```bash
npm run electron:build
```

或打包为目录：

```bash
npm run electron:pack
```

生成产物默认输出到 `out/` 目录。

## 5. 后端地址

默认后端地址：

- http://123.45.67.89:3000

如果你要改地址，可在启动时设置环境变量：

```bash
MJ_SERVER_URL=http://127.0.0.1:3000 npm run electron
```

或者在代码中改 `electron/preload.js` 里的 `serverUrl`。

## 6. 说明

- 这是一个 WebView 封装版桌面应用
- 它会连接远程后端，不会把后端打进程序
- 适合你当前的麻将棋牌娱乐软件演示版
- 后续如果要做官方正式版，可以把 Play / Match / 牌局逻辑和服务端都做成真实服务端，桌面端继续作为客户端
