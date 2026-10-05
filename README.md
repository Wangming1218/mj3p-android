# 麻将三人 Android 封装工程

本仓库为 Android 版本准备的 Capacitor 项目骨架，使用 React + Vite 前端并通过 Capacitor 包装为 Android 应用。

## 1. 安装依赖

```bash
npm install
```

## 2. 本地开发

```bash
npm run dev
```

访问：

- http://localhost:5173

## 3. 生产构建

```bash
npm run build
```

## 4. Android 工程初始化

在项目目录下执行：

```bash
npx cap add android
npx cap sync android
```

然后打开 Android Studio：

```bash
npx cap open android
```

## 5. Android 端的网络配置

当前后端地址已设置为：

- http://123.45.67.89:3000

为了方便开发阶段真机调试，Android 应用默认允许明文 HTTP（cleartext）。

你需要在 Android Studio 中生成 Android 工程之后，确保 AndroidManifest.xml 含有：

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

并在 application 节点添加：

```xml
android:networkSecurityConfig="@xml/network_security_config"
```

对应 XML 文件：

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
```

保存到：

- android/app/src/main/res/xml/network_security_config.xml

## 6. 生成 APK / AAB

在 Android Studio 中选择：

- Build -> Build Bundle(s) / APK(s) -> Build APK

或者：

- Build -> Generate Signed Bundle / APK

## 7. 说明

这是一个 Android 封装工程原型，前端仍是 Web 代码，适合快速把现有麻将网页封装成 Android 应用。用户当下仍需在本地安装 Android Studio 与 Android SDK 才能完成最终 APK 打包。

## 8. 常见问题

### 1）无法访问后端

- 检查你的手机是否能访问 123.45.67.89:3000
- 如果是局域网 IP，请确保同一网络
- 生产环境建议切换到 HTTPS

### 2）Android Studio 未安装

需要安装 Android Studio + Android SDK + JDK。

### 3）无法打开 Android 工程

执行：

```bash
npx cap sync android
npx cap open android
```

然后在 Android Studio 中重新打开 `android/` 目录。
