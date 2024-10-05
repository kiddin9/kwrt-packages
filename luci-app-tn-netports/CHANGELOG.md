# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

All dates in this document are in `DD.MM.YYYY` format.

## [Unreleased]

### Fixed
- Proper handle aliases when searching network name for bridges

### Added
- Added 'sfp' port type with icon

## [Version 2.0.3]

### Changed
- Added translation contexts for some strings.
- Use prefixes to indicate binary multiples for Rx and Tx bytes
  from IEEE 1541-2002.

### Fixed
- Do not show the table on insufficient permissions.
- Synchronized colors of the firewall zones with colors from the
  network/firewall settings.
- Fixed nbsp entity output for XML (luci-theme-openwrt).
- Fixed markup for interfaces without MAC address (e.g. PPP connections).
- Fixed IE11 compatibility.

## [Version 2.0.2] (20.01.2020)

### Fixed
- Fixed handling of negative speed values in sysfs.

## [Version 2.0.1] (13.01.2020)

### Fixed
- Fixed links to network interfaces page.

## [Version 2.0.0] (04.11.2019)

### Changed
- Added support for client side view introduced in the latest changes
  in the master branch of the LuCI.

## [Version 1.1.1] (26.10.2019)

### Fixed
- Fixed display of the icon for 'vpn' port type.
- Fixed displaying of an empty MAC address.

## [Version 1.1.0] (06.10.2019)

### Added
- This CHANGELOG file.
- Handling cases when the firewall zones are assigned to both the network
  interface and the bridge of which the interface is a member. In this case,
  information about both firewall zones is displayed.
- Added vertical table view mode. By default used new vertical mode. This may
  changed by the `global.default_h_mode` option in `/etc/config/luci_netports`
  configuration file. If used horizontal mode then view mode is automatically
  switched to vertical mode in case the number of interfaces is more than 6.
- Added "Switch to vertical/horizontal mode" button. By default this button
  is disabled (not shown). Button may be enabled by the `global.hv_mode_switch_button`
  option in `/etc/config/luci_netports` configuration file.
- Added example screenshots.
- Added `usb_stick`, `usb_2g`, `usb_3g`, `usb_4g`, `tunnel`, `gprs`, `ppp`
  and `usb_wifi` new types and icons.
- Added `auto` port type for automatically detect type by interface name.
- Added link to the wireless interface configuration.
- Added spinner for messages about waiting for data.
- Added rpcd ubus script for data gathering

### Changed
- Updated README.md file.
- Renamed application section title from "Ports Status" to "Network Interfaces Ports Status"
- Icons moved to `icons` subdirectory.
- Place application on the "Overview" page after "Memory" section.
  This became possible after applying patch to LuCI from pull request
  [2364](https://github.com/openwrt/luci/pull/2364).
- Moved part of the JavaScript code to LuCI resources directory.
- Renamed "Network interface" parameter to "Interface" in the table.
- Renamed configuration parameter `global.hide_additional_info`
  to `global.default_additional_info`.
- Renamed old type `usb` to `usb_rndis`. Old type name `usb` is supported but deprecated.
- Changed icons for disabled state.
- Use luabitop for bitwise operations.
- Use polling interval from LuCI configuration (luci.main.pollinterval).
- Totally rework JavaScript code.

### Deprecated
- Use type `usb_rndis` instead of `usb`.

### Fixed
- Output dash if no assigned firewall zones.
- Fix administrative down state detection.
- Fix port link status icon display in IE.
- Fix Russian translations for "Connected", "Disconnected" and "Disabled".
- Properly handling of the operative interface state from
  `/sys/class/net/<if>/operstate` sysfs file.
- Fix ports type icons flickering on updates.

## [Version 1.0.0] (07.12.2018)

Initial release

[Unreleased]: https://github.com/tano-systems/luci-app-netports/tree/master
[Version 2.0.3]: https://github.com/tano-systems/luci-app-netports/releases/tag/v2.0.3
[Version 2.0.2]: https://github.com/tano-systems/luci-app-netports/releases/tag/v2.0.2
[Version 2.0.1]: https://github.com/tano-systems/luci-app-netports/releases/tag/v2.0.1
[Version 2.0.0]: https://github.com/tano-systems/luci-app-netports/releases/tag/v2.0.0
[Version 1.1.1]: https://github.com/tano-systems/luci-app-netports/releases/tag/v1.1.1
[Version 1.1.0]: https://github.com/tano-systems/luci-app-netports/releases/tag/v1.1.0
[Version 1.0.0]: https://github.com/tano-systems/luci-app-netports/releases/tag/v1.0.0
