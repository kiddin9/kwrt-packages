<h4 align="right"><strong>English</strong> | <a href="README_zh.md">简体中文</a></h4>
<p align="center">
    <img src=https://raw.githubusercontent.com/eamonxg/assets/master/aurora/logo/logo-circular.png width=152/>
</p>
<h1 align="center">Aurora Theme</h1>
<p align="center"><strong>A modern OpenWrt LuCI theme built with Vite and Tailwind CSS.</strong></p>
<h4 align=center>☁️ Pure | 🦢 Elegant | 📱 Responsive | 🌗 Dark/Light Mode | ⚙️ Settable </h4>
<div align="center">
  <img alt="OpenWrt" src="https://img.shields.io/badge/OpenWrt-%E2%89%A523.05-00B5E2">
  <img alt="Chrome" src="https://img.shields.io/badge/Chrome-%E2%89%A5111-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Safari" src="https://img.shields.io/badge/Safari-%E2%89%A516.4-000000?logo=safari&logoColor=white">
  <img alt="Firefox" src="https://img.shields.io/badge/Firefox-%E2%89%A5128-FF7139?logo=firefoxbrowser&logoColor=white">
  <img alt="Firefox" src="https://img.shields.io/github/downloads/eamonxg/luci-theme-aurora/total">
</div>

## Features

- **Modern**: Modern UI design, built with the latest web technologies for a cutting-edge experience.
- **Mobile-friendly**: Display and interaction optimized for smartphones and tablets, ensuring smoother usability.
- **Theme Switcher**: Supports device, light, and dark modes with seamless switching.
- **Customizable**: Provides the [luci-app-aurora-config](https://github.com/eamonxg/luci-app-aurora-config) plugin for custom theme configuration.

## Preview

| Mode       | Screenshot                                        |
|------------|---------------------------------------------------|
| Light | ![Light Mode](https://raw.githubusercontent.com/eamonxg/assets/master/aurora/preview/preview-light.png) |
| Dark | ![Dark Mode](https://raw.githubusercontent.com/eamonxg/assets/master/aurora/preview/preview-dark.png) |

## Compatibility

- **OpenWrt**: Requires OpenWrt 23.05.0 or later, as the theme uses ucode templates and LuCI JavaScript APIs.
- **Browsers**: Built with **TailwindCSS v4**. Compatible with the following modern browsers:
  - **Chrome/Edge 111+** _(released March 2023)_
  - **Safari 16.4+** _(released March 2023)_
  - **Firefox 128+** _(released July 2024)_


## [About Development](.dev/docs/DEVELOPMENT.md)

As we step into 2025, the development of OpenWrt themes in the market remains fairly primitive, while the frontend toolchain has already become mature and advanced.
Embracing the modern frontend ecosystem is therefore the core philosophy of the Aurora theme.

Aurora uses **Vite** as the build tool.

- During development, you can freely choose and integrate any CSS toolchain.
- In production, multiple strategies are available to optimize bundled assets.
- Most importantly, with the help of a local proxy server, style changes can be previewed in real time!

## License & Credits

This project is licensed under the Apache License.

The production build structure is based on the official OpenWrt theme
[luci-theme-bootstrap](https://github.com/openwrt/luci/tree/master/themes/luci-theme-bootstrap).

Visual style and some implementations are influenced by
[Apple](https://www.apple.com/) and [Vercel](https://vercel.com/).

The project is developed using a modern front-end stack, including
[Vite](https://vitejs.dev/) and [Tailwind CSS](https://tailwindcss.com/).
