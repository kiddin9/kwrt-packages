[![Build Packages](https://github.com/ttimasdf/luci-app-jederproxy/actions/workflows/build.yml/badge.svg?branch=main)](https://github.com/ttimasdf/luci-app-jederproxy/actions/workflows/build.yml)
![LLM Copilot](https://img.shields.io/badge/copilot-gpt--3.5--turbo-purple)


# luci-app-jederproxy

LuCI interface and nftables/iptables generator for multiple proxy backends, supporting mihomo/clash/clash meta, xray/v2ray, shadowsocks (ss-redir).

## Introduction

`luci-app-jederproxy` is a LuCI (OpenWrt Web Interface) application that provides a user-friendly interface and nftables/iptables generator for managing multiple proxy backends. It supports popular proxy backends such as mihomo, clash, clash meta, xray, v2ray, and shadowsocks (ss-redir).

With `luci-app-jederproxy`, users can easily configure and manage their proxy settings through the OpenWrt web interface. The application generates the necessary nftables/iptables rules based on the selected proxy backend and configuration options, simplifying the setup process and ensuring proper routing of network traffic through the chosen proxy.


| Server              | Status  |
|---------------------|---------|
| mihomo              | ✔️  |
| clash               | ✔️  |
| clash meta          | ✔️  |
| xray                | ❓  |
| v2ray               | ❓  |
| shadowsocks (ss-redir) | 🚧  |

- ✔️ - Supported
- ❓ - Untested but should be okay
- 🚧 - Work in progress

## Features

- LuCI web interface for easy configuration and management of proxy backends.
- Support for multiple proxy backends, including mihomo, clash, clash meta, xray, v2ray, and shadowsocks (ss-redir).
- Automatic generation of nftables/iptables rules based on the selected proxy backend and configuration options.
- Flexible configuration options for each proxy backend, allowing customization of proxy settings according to individual requirements.
- Real-time status monitoring and logging of proxy activities.
- Integration with OpenWrt firewall and network settings for seamless integration into the existing network infrastructure.

## Prerequisites

- OpenWrt or compatible firmware installed on your router/device.
- LuCI web interface installed and accessible.

## Installation

1. Log in to your OpenWrt router/device using SSH or LuCI web interface.
2. Navigate to the "System" -> "Software" page in the LuCI web interface.
3. Click on the "Update lists" button to refresh the package lists.
4. Search for `luci-app-jederproxy` in the "Download and install package" field.
5. Click on the "Install" button next to the `luci-app-jederproxy` package to install it.
6. Wait for the installation to complete.
7. Once installed, the `luci-app-jederproxy` application will be available in the "Services" section of the LuCI web interface.

## Usage

1. Access the LuCI web interface by entering the IP address of your OpenWrt router/device in a web browser.
2. Log in to the LuCI web interface using your credentials.
3. Navigate to the "Services" section and click on the "JederProxy" link.
4. The `luci-app-jederproxy` interface will be displayed, allowing you to configure and manage your proxy backends.
5. Select the desired proxy backend from the available options (mihomo, clash, clash meta, xray, v2ray, shadowsocks).
6. Configure the proxy settings according to your requirements.
7. Click on the "Save" button to apply the changes.
8. The nftables/iptables rules will be automatically generated based on the selected proxy backend and configuration options.

## Support and Contributions

For bug reports, feature requests, or general questions, please create an issue on the [GitHub repository](https://github.com/ttimasdf/luci-app-jederproxy).

Contributions to the project are welcome! If you would like to contribute code, please submit a pull request on the [GitHub repository](https://github.com/ttimasdf/luci-app-jederproxy).

## License

This project is licensed under the [MIT License](LICENSE).
