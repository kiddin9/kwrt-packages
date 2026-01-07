<h4 align="right"><a href="README.md">English</a> | <strong>简体中文</strong></h4>
<p align="center">
    <img src=https://raw.githubusercontent.com/eamonxg/assets/master/aurora/logo/logo-circular.png width=152/>
</p>
<h1 align="center">Aurora Theme</h1>
<p align="center"><strong>一个使用 Vite 和 Tailwind CSS 构建的现代化 OpenWrt LuCI 主题。</strong></p>
<h4 align=center>☁️ 纯净 | 🦢 优雅 | 📱 响应式 | 🌗 深色/浅色模式 | ⚙️ 可配置 </h4>
<div align="center">
  <a href="https://openwrt.org"><img alt="OpenWrt" src="https://img.shields.io/badge/OpenWrt-%E2%89%A523.05-00B5E2"></a>
  <a href="https://www.google.com/chrome/"><img alt="Chrome" src="https://img.shields.io/badge/Chrome-%E2%89%A5111-4285F4?logo=googlechrome&logoColor=white"></a>
  <a href="https://www.apple.com/safari/"><img alt="Safari" src="https://img.shields.io/badge/Safari-%E2%89%A516.4-000000?logo=safari&logoColor=white"></a>
  <a href="https://www.mozilla.org/firefox/"><img alt="Firefox" src="https://img.shields.io/badge/Firefox-%E2%89%A5128-FF7139?logo=firefoxbrowser&logoColor=white"></a>
  <a href="https://github.com/eamonxg/luci-theme-aurora/releases/latest"><img alt="GitHub release" src="https://img.shields.io/github/v/release/eamonxg/luci-theme-aurora"></a>
  <a href="https://github.com/eamonxg/luci-theme-aurora/releases"><img alt="Downloads" src="https://img.shields.io/github/downloads/eamonxg/luci-theme-aurora/total"></a>
  <a href="https://discord.gg/8R9s2C2a"><img alt="Discord" src="https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white"></a>
</div>




## 特性

- **现代化**：采用现代化 UI 设计，使用最新的 Web 技术构建，带来前沿体验。
- **移动端友好**：针对手机和平板进行了显示和交互优化，确保更流畅的使用体验。
- **主题切换器**：支持跟随设备、浅色和深色模式，可无缝切换。
- **可定制**：提供 [luci-app-aurora-config](https://github.com/eamonxg/luci-app-aurora-config) 插件用于自定义主题配置。

## 预览

| 模式     | 效果图                                                       |
| -------- | ------------------------------------------------------------ |
| 浅色模式 | ![Light Mode](https://raw.githubusercontent.com/eamonxg/assets/master/aurora/preview/preview-light.png) |
| 深色模式 | ![Dark Mode](https://raw.githubusercontent.com/eamonxg/assets/master/aurora/preview/preview-dark.png) |

## 兼容性

- **OpenWrt**：需要 OpenWrt 23.05.0 或更高版本，因为主题采用了 ucode 模板和 LuCI JavaScript APIs。
- **浏览器**：基于 **TailwindCSS v4** 构建。兼容以下现代浏览器：
  - **Chrome/Edge 111+** _(2023年3月发布)_
  - **Safari 16.4+** _(2023年3月发布)_
  - **Firefox 128+** _(2024年7月发布)_

## 安装

OpenWrt 25.12+ 及 Snapshots 使用 `apk`，其它版本使用 `opkg`：

> **提示**：可通过运行 `opkg --version` 或 `apk --version` 来确认包管理器，如果有输出（而非 "not found"），即可确认该包管理器。

- **opkg**（OpenWrt 25.12 以下）：  
  ```sh
  cd /tmp && wget -O luci-theme-aurora.ipk https://github.com/eamonxg/luci-theme-aurora/releases/latest/download/luci-theme-aurora_0.9.0_beta-r20251206_all.ipk && opkg install luci-theme-aurora.ipk
  ```

- **apk**（OpenWrt 25.12+ 及 Snapshots）：  
  ```sh
  cd /tmp && wget -O luci-theme-aurora.apk https://github.com/eamonxg/luci-theme-aurora/releases/latest/download/luci-theme-aurora-0.9.0_beta-r20251206.apk && apk add --allow-untrusted luci-theme-aurora.apk
  ```


## 参与贡献

<details>
<summary><b>开发</b></summary>

<p>步入 2025 年，市面上的 OpenWrt 主题开发方式仍然比较原始，而前端工具链已相当成熟且先进。 所以全面拥抱现代前端生态，是 Aurora 主题开发的核心理念。</p>

<p>Aurora 使用 <strong>Vite</strong> 作为构建工具。</p>

<ul>
<li>在开发过程中，您可以自由选择和集成任何 CSS 工具链。</li>
<li>在生产环境中，有多种策略可用于优化打包资源。</li>
<li>最重要的是，借助本地代理服务器，样式更改可以实时预览！</li>
</ul>

<p>更多开发信息请参考 <a href=".dev/docs/DEVELOPMENT.md">开发文档</a>。</p>

</details>

<h4>交流社区</h4>

<p>新建了个Discord社群，欢迎大家来交流👏～ <a href="https://discord.gg/8R9s2C2a">加入 Discord 社区</a></p>

## 许可与致谢

本项目采用 Apache License 2.0。

生产构建结构基于官方 OpenWrt 主题
[luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap)。

视觉风格和部分实现受到
[Apple](https://www.apple.com/) 和 [Vercel](https://vercel.com/) 的影响。

项目使用现代前端技术栈开发，包括
[Vite](https://vitejs.dev/) 和 [Tailwind CSS](https://tailwindcss.com/)。