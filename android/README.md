# Android 配置说明

这部分用于让 Android 应用在开发阶段允许明文 HTTP 联网（例如你当前的后端地址 http://123.45.67.89:3000）。

## 1. AndroidManifest 示例

在生成的 Android 工程中，确保 `android/app/src/main/AndroidManifest.xml` 包含：

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wangming.mj3p">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:usesCleartextTraffic="true"
        android:networkSecurityConfig="@xml/network_security_config"
        ... >
    </application>
</manifest>
```

## 2. 生成 Android 工程

在项目根目录执行：

```bash
npm install
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## 3. 打包 APK / AAB

在 Android Studio 中：

- `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK`
- 或：`Build` -> `Generate Signed Bundle / APK`

## 4. 上线建议

上线前建议将后端切换到 HTTPS，避免 Android 明文 HTTP 受限。
