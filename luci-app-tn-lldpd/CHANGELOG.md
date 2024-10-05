# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

All dates in this document are in `DD.MM.YYYY` format.

## [Unreleased]

### Fixed
- Fixed lldpd.getStatus ubus method arguments

## [Version 2.0.2] (06.04.2021)
### Added
- Display port administrative status on statistics tab
- Added support for discovered port "mfs" parameter

### Fixed
- Fixed displaying "Protocol" column in statistics table

## [Version 2.0.1] (06.12.2020)
### Fixed
- Fixed IE11 compatibility.
- Fixed Rx interface statistics display.

## [Version 2.0.0] (22.04.2020)
### Changed
- Coverted to client side rendering.

## [Version 1.3.0] (21.04.2020)
### Added
- Added ACL rules for latest LuCI support
- Allow to hide footer by UCI option 'luci.app_tn_lldpd.hide_footer'

### Changed
- Changed application pages titles.
- All tables wrapped into div with class "table-wrapper".
- Use polling interval from LuCI configuration (luci.main.pollinterval)
- Added spinner for messages about waiting for data.
- Removed useless ucitrack definition
- Use L.Poll.add() instead of deprecated XHR.Poll() for data polling.

### Fixed
- Fixed possible simultaneous folding/unfolding of multiple rows.
- Dropped unnecessary data from the "discovered port" column
  of the neighbors table.
- Minor HTML markup fixes.
- Handle JSON.parse() exceptions.

## [Version 1.2.1] (25.12.2018)
### Added
- Added support for the official OpenWrt and Material LuCI themes.
  Previously supported only Bootstrap LuCI theme.
- Enable/disable service checkbox.
- Additional JavaScript checks for case when LLDPd not started.

### Changed
- Update screenshots for neighbors and statistics tables.
- Badges with individual colors for all supported protocols in neighbors
  and statistics tables. Previously inidividual badges will available
  only for LLDP and CDP protocols. EDP, FDP and SONMP protocols had the
  same colors for badges.
- Changed icons for show/hide additional information.
- Fold and unfold table cells when clicking on any place in the row.

## [Version 1.2.0] (15.12.2018)
### Added
- This CHANGELOG.md file.
- New screenshots.
- Extra validators for parameters.
- Local chassis information view.
- The ability to configure the following new parameters:
  * Port ID subtype applied to all interfaces (MAC or name of the interface)
  * The destination MAC address used to send LLDPDU
  * Receive-only mode (lldpd -r parameter)
  * Interfaces to use for computing chassis ID (lldpd -C parameter)
  * Filter neighbors (lldpd -H parameter)
  * Disable LLDP-MED inventory TLV transmission (lldpd -i parameter)
- Extra comments for existing parameters.

### Changed
- Improved tables appearance and usability. Allow to collapse/expand additional information
  for each table row.
- Merged status and config menu items as 3rd level pages under "Services"
  main menu item.

### Fixed
- HTML markup and JavaScript fixes.

## [Version 1.1.1] (18.09.2018)
### Fixed
- Fixed lldpd service reloading.
- Some HTML markup fixes.

## [Version 1.1.0] (17.07.2018)
### Added
- Added support for LuCI from OpenWrt 18.06.x branch.

## [Version 1.0.0] (05.07.2018)

Initial release

[Unreleased]: https://github.com/tano-systems/luci-app-tn-lldpd/tree/master
[Version 2.0.2]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v2.0.2
[Version 2.0.1]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v2.0.1
[Version 2.0.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v2.0.0
[Version 1.3.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.3.0
[Version 1.2.2]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.2.2
[Version 1.2.1]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.2.1
[Version 1.2.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.2.0
[Version 1.1.1]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.1.1
[Version 1.1.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.1.0
[Version 1.0.0]: https://github.com/tano-systems/luci-app-tn-lldpd/releases/tag/v1.0.0
