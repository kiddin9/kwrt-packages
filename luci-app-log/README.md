# luci-app-log-viewer
Advanced syslog and kernel log (tail, search, etc) for LuCI (OpenWrt webUI).

OpenWrt >= 22.03.

Supported LuCI themes: luci-theme-bootstrap, luci-theme-material, luci-theme-openwrt-2020.

**Dependences:** ucode, ucode-mod-fs.

## Installation notes

**OpenWrt >= 25.12:**

    wget --no-check-certificate -O /tmp/luci-app-log-viewer-1.5.0-r2.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-app-log-viewer-1.5.0-r2.apk
    apk --allow-untrusted add /tmp/luci-app-log-viewer-1.5.0-r2.apk
    rm /tmp/luci-app-log-viewer-1.5.0-r2.apk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-log-viewer-ru-1.5.0-r2.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-i18n-log-viewer-ru-1.5.0-r2.apk
    apk --allow-untrusted add /tmp/luci-i18n-log-viewer-ru-1.5.0-r2.apk
    rm /tmp/luci-i18n-log-viewer-ru-1.5.0-r2.apk

**OpenWrt <= 24.10:**

    wget --no-check-certificate -O /tmp/luci-app-log-viewer_1.5.0-r2_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-app-log-viewer_1.5.0-r2_all.ipk
    opkg install /tmp/luci-app-log-viewer_1.5.0-r2_all.ipk
    rm /tmp/luci-app-log-viewer_1.5.0-r2_all.ipk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-log-viewer-ru_1.5.0-r2_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-i18n-log-viewer-ru_1.5.0-r2_all.ipk
    opkg install /tmp/luci-i18n-log-viewer-ru_1.5.0-r2_all.ipk
    rm /tmp/luci-i18n-log-viewer-ru_1.5.0-r2_all.ipk

## Screenshots:

Kernel log:

![](https://github.com/gSpotx2f/luci-app-log/blob/master/screenshots/01.jpg)

System log (logd):

![](https://github.com/gSpotx2f/luci-app-log/blob/master/screenshots/02.jpg)

Filter settings:

![](https://github.com/gSpotx2f/luci-app-log/blob/master/screenshots/03.jpg)

System log (syslog-ng):

![](https://github.com/gSpotx2f/luci-app-log/blob/master/screenshots/04.jpg)

## Mod lines:

    wget --no-check-certificate -O /www/luci-static/resources/view/log-viewer/log-widget.js https://github.com/gSpotx2f/luci-app-log/raw/master/dev-mods-examples/mod-lines/htdocs/luci-static/resources/view/log-viewer/log-widget.js

![](https://github.com/gSpotx2f/luci-app-log/blob/master/dev-mods-examples/mod-lines/screenshots/01.jpg)

## Mod textarea:

    wget --no-check-certificate -O /www/luci-static/resources/view/log-viewer/log-widget.js https://github.com/gSpotx2f/luci-app-log/raw/master/dev-mods-examples/mod-textarea/htdocs/luci-static/resources/view/log-viewer/log-widget.js

![](https://github.com/gSpotx2f/luci-app-log/blob/master/dev-mods-examples/mod-textarea/screenshots/01.jpg)
