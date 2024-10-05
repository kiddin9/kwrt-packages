# Network ports status LuCI application

## Description
This package allows you to monitor current state of the network interfaces specified in configuration file (`/etc/config/luci_netports`).

## Dependencies
This LuCI application developed for LuCI master branch. Application requires luabitop package to be installed.

Master branch of this repository requires index status page client side view implementation in the LuCI (see commit https://github.com/openwrt/luci/commit/c85af3d7618b55c499ce4bf58e3896068bd413ae). Support for older LuCI releases (e.g. for version 18.06.x) is left in the [v1.x](https://github.com/tano-systems/luci-app-tn-netports/tree/v1.x) branch of this repository.

## Supported languages
- English
- Russian

## UCI configuration
UCI configuration for this application is stored in `/etc/config/luci_netports` file.

This file contain one `global` section with global application settings and one or more `port` sections with network ports settings.

### Global settings

The `global` section contains global application settings. Default `global` section configuration:
```
config global 'global'
	option default_additional_info '0'
	option default_h_mode          '1'
	option hv_mode_switch_button   '1'
```

These options can be set in the `global` section:

| Name                      | Type    | Required | Default | Description                                                                  |
| ------------------------- | ------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `default_additional_info` | boolean | no       | 0       | Display additional information in horizontal view mode by default.           |
| `default_h_mode`          | boolean | no       | 1       | Use horizontal view mode by default.                                         |
| `hv_mode_switch_button`   | boolean | no       | 1       | Show button for manual switching between horizontal and vertical view modes. |

Horizontal display mode can be used maximum for 6 interfaces. If there are more interfaces, the vertical display mode will be automatically activated without the possibility of switching to the horizontal mode.

### Ports settings

Sections of the type `port` declare network port settings for displaying in application.

A minimal port declaration consists of the following lines:
```
config port
	option ifname 'eth0'
```
These options can be set in the `port` sections:

| Name                      | Type    | Required | Default | Description                                                                  |
| ------------------------- | ------- | -------- | ------- | ---------------------------------------------------------------------------- |
| `ifname`                  | string  | yes      | (none)  | Network interface name. |
| `name`                    | string  | no       | value of `ifname` | Custom port name for displaying in application. |
| `type`                    | string  | no       | `auto` | Custom port type. Available port types listed in the table below. |
| `disable`                 | boolean | no       | false  | Do not display specified interface. |

Available port types (`type` setting):

| Type(s) | Disabled icon | Linkdown icon | Linkup icon | Description |
| ----- |:------------:|:--------------:|:------------:| :---------- |
| `auto` | - | - | - | Automatically detect type by interface name (see next table). |
| `copper` | ![copper_disabled](htdocs/luci-static/resources/netports/icons/copper_disabled.svg?sanitize=true) | ![copper_down](htdocs/luci-static/resources/netports/icons/copper_down.svg?sanitize=true) | ![copper_up](htdocs/luci-static/resources/netports/icons/copper_up.svg?sanitize=true) | Wired (RJ45) connection. |
| `sfp` | ![sfp_disabled](htdocs/luci-static/resources/netports/icons/sfp_disabled.svg?sanitize=true) | ![sfp_down](htdocs/luci-static/resources/netports/icons/sfp_down.svg?sanitize=true) | ![sfp_up](htdocs/luci-static/resources/netports/icons/sfp_up.svg?sanitize=true) | SFP connection. |
| `fixed` | ![fixed_disabled](htdocs/luci-static/resources/netports/icons/fixed_disabled.svg?sanitize=true) | ![fixed_down](htdocs/luci-static/resources/netports/icons/fixed_down.svg?sanitize=true) | ![fixed_up](htdocs/luci-static/resources/netports/icons/fixed_up.svg?sanitize=true) | Intercircuit fixed link connection. |
| `wifi`, `usb_wifi` | ![wifi_disabled](htdocs/luci-static/resources/netports/icons/wifi_disabled.svg?sanitize=true) | ![wifi_down](htdocs/luci-static/resources/netports/icons/wifi_down.svg?sanitize=true) | ![wifi_up](htdocs/luci-static/resources/netports/icons/wifi_up.svg?sanitize=true) | Wireless connection. |
| `usb_rndis` | ![usb_rndis_disabled](htdocs/luci-static/resources/netports/icons/usb_rndis_disabled.svg?sanitize=true) | ![usb_rndis_down](htdocs/luci-static/resources/netports/icons/usb_rndis_down.svg?sanitize=true) | ![usb_rndis_up](htdocs/luci-static/resources/netports/icons/usb_rndis_up.svg?sanitize=true) | USB RNDIS connection. |
| `usb_stick`, `usb_2g`, `usb_3g`, `usb_4g` | ![usb_stick_disabled](htdocs/luci-static/resources/netports/icons/usb_stick_disabled.svg?sanitize=true) | ![usb_stick_down](htdocs/luci-static/resources/netports/icons/usb_stick_down.svg?sanitize=true) | ![usb_stick_up](htdocs/luci-static/resources/netports/icons/usb_stick_up.svg?sanitize=true) | USB 2G/3G/4G modem connection. |
| `gprs` | ![gprs_disabled](htdocs/luci-static/resources/netports/icons/gprs_disabled.svg?sanitize=true) | ![gprs_down](htdocs/luci-static/resources/netports/icons/gprs_down.svg?sanitize=true) | ![gprs_up](htdocs/luci-static/resources/netports/icons/gprs_up.svg?sanitize=true) | GPRS connection. |
| `vpn`, `tunnel` | ![tunnel_disabled](htdocs/luci-static/resources/netports/icons/tunnel_disabled.svg?sanitize=true) | ![tunnel_down](htdocs/luci-static/resources/netports/icons/tunnel_down.svg?sanitize=true) | ![tunnel_up](htdocs/luci-static/resources/netports/icons/tunnel_up.svg?sanitize=true) | Tunnel connection. |
| `ppp` | ![ppp_disabled](htdocs/luci-static/resources/netports/icons/ppp_disabled.svg?sanitize=true) | ![ppp_down](htdocs/luci-static/resources/netports/icons/ppp_down.svg?sanitize=true) | ![ppp_up](htdocs/luci-static/resources/netports/icons/ppp_up.svg?sanitize=true) | PPP connection. |

Automatic network port type detection (`auto` type):

| Interface name regular expression(s) | Example(s) | Detected type |
| :------------- | :--- | :--- |
| `^eth\d+`,<br />`^sw\d+p\d+`,<br />`^en[a-z]\d+[a-z]\d+` | `eth0`, `eth32`,<br />`sw1p4`,<br />`enp0s4`, `ens9f0` | `copper` |
| `^wlan\d+`,<br />`^wl[a-z]\d+[a-z]\d+` | `wlan0`,<br />`wlp0s4`, `wls1f4` | `wifi` |
| `^usb\d+` | `usb0` | `usb_rndis` |
| `^wwan\d+`,<br />`^ww[a-z]\d+[a-z]\d+` | `wwan0`,<br />`wwp0s4`, `wws1f4` | `usb_stick` |
| `^ppp\d+` | `ppp0` | `ppp` |
| `^tun\d+`,<br />`^tap\d+`,<br />`^wg\d+` | `tun0`, `tap0`, `wg0` | `tunnel` |

## Screenshots

### Vertical mode

![Vertical view mode](screenshots/v-mode-5-ports.png?raw=true "Vertical view mode")

### Horizontal mode

Without additional information:

![Horizontal view mode](screenshots/h-mode-5-ports.png?raw=true "Horizontal view mode")

With additional information:

![Horizontal view mode (with extra information)](screenshots/h-mode-5-ports-extra.png?raw=true "Horizontal view mode (with extra information)")
