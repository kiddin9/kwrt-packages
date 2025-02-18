# LuCI App AdGuardHome

**NOTE:** Original Source found for LUCI app [here](https://github.com/openwrt/luci/tree/3253c2644215a1ea8136199044e06ad5e4fd9de9/applications/luci-app-adguardhome) by Duncan Hill (<openwrt-dev@cricalix.net>).

This LuCI app provides basic integration with the [AdGuard Home](https://github.com/AdguardTeam/AdGuardHome) [package](https://openwrt.org/packages/pkgdata/adguardhome) for OpenWrt. Note that the AdGuard Home package installation and configuration requires interaction with the OpenWrt command line; this app does not remove any of that interaction.

See also: [AdGuard Home @ AdGuard](https://adguard.com/en/adguard-home/overview.html)

## Using/installing this app

First, install the AdGuard Home package - either via the web UI for software package management, or
```
opkg install adguardhome
```

Follow the [installation instructions](https://openwrt.org/docs/guide-user/services/dns/adguard-home) for AdGuard Home, and make a note of the username and password for authenticating to the web UI.

Next, install this package - either via the web UI for software package management, or
```
opkg install luci-app-adguardhome
```

This package is unable to automatically determine the username and password (the password is encrypted in AdGuard Home's configuration file), so you'll need to go to `Services > AdGuard Home > Configuration` and provide these credentials. The credentials will be stored **unencrypted** in `/etc/config/adguardhome`.

With the credentials saved, the `Services > AdGuard Home > Status` page should now work, and show you the general status of AdGuard Home.

If you go to `Services > AdGuard Home > Logs`, you can see the last 50 log lines from both the supporting script used by this package, and the AdGuard Home software.

This app provides a link to the AdGuard Home web UI, making it easy to see more detailed statistics, and the query log.

## Dependencies

Dependencies are declared in the Makefile, but are

* adguardhome, as this app is useless without it

## Screenshots

### Status Tab
![Status Tab](https://github.com/xptsp/luci-app-adguardhome/blob/main/.github/images/status.png?raw=true)

### Logs Tab
![General Tab](https://github.com/xptsp/luci-app-adguardhome/blob/main/.github/images/logs.png?raw=true)

### Configuration Tab
![MAC Filter Tab](https://github.com/xptsp/luci-app-adguardhome/blob/main/.github/images/config.png?raw=true)

## Package History

- v1.0 - Initial release
- v2.0 - Freed package from most dependancies except for AdGuardHome.
- v2.0.1 - Added forgotten dependency, plus minor fix in rpcd/luci.adguardhome
- v2.0.2 - Fixed issue in rpcd/luci.adguardhome so it works for older versions of AdGuardHome binary
- v2.1 - Added ability to change AdGuardHome password from LuCI app
