# LuCI support for LLDP daemon

## Description
This application allows you to configure LLDPd and view discovered neighbors and statistics over LuCI web interface.

## Dependencies
This LuCI application requires the installed lldpd package with customized procd initialization scripts, which can be founded in the recipes of the OpenEmbedded layer of the [TanoWrt Linux Distribution](https://github.com/tano-systems/meta-tanowrt).

Master branch of this repository requires latest LuCI revision with client side rendering feature. Support for older LuCI releases (e.g. for version 18.06.x, 19.07.x) is left in the [v1.x](https://github.com/tano-systems/luci-app-tn-mstpd/tree/v1.x) branch of this repository.

## Supported Languages
- Russian
- English

## Supported (tested) LuCI Themes
- [luci-theme-tano](https://github.com/tano-systems/luci-theme-tano) ([screenshots](#screenshots) are taken with this theme)
- luci-theme-bootstrap
- luci-theme-openwrt-2020
- luci-theme-openwrt

## Screenshots

### Status

#### Discovered Neighbors
![Discovered Neighbors](screenshots/luci-app-tn-lldpd-status-neighbors.png?raw=true)

#### Local Interfaces Statistics
![Local Interfaces Statistics](screenshots/luci-app-tn-lldpd-status-statistics.png?raw=true)

### Settings

#### Basic Settings
![Basic Settings](screenshots/luci-app-tn-lldpd-settings-basic.png?raw=true)

#### Network Interfaces Settings
![Network Interfaces](screenshots/luci-app-tn-lldpd-settings-interfaces.png?raw=true)

#### Advanced Settings
![Advanced Settings](screenshots/luci-app-tn-lldpd-settings-advanced.png?raw=true)

#### Protocols Support
![Protocols Support](screenshots/luci-app-tn-lldpd-settings-protocols.png?raw=true)

[version 1.2.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.2.0
[version 1.0.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.0.0
