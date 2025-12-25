# luci-app-cpu-status-mini
CPU utilization info for the LuCI status page (OpenWrt webUI).

OpenWrt >= 21.02.

Advanced version: [luci-app-cpu-status](https://github.com/gSpotx2f/luci-app-cpu-status).

## Installation notes

**OpenWrt >= 25.12:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status-mini-0.2.0-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-app-cpu-status-mini-0.2.0-r1.apk
    apk --allow-untrusted add /tmp/luci-app-cpu-status-mini-0.2.0-r1.apk
    rm /tmp/luci-app-cpu-status-mini-0.2.0-r1.apk
    service rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-mini-ru-0.2.0-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-i18n-cpu-status-mini-ru-0.2.0-r1.apk
    apk --allow-untrusted add /tmp/luci-i18n-cpu-status-mini-ru-0.2.0-r1.apk
    rm /tmp/luci-i18n-cpu-status-mini-ru-0.2.0-r1.apk

**OpenWrt <= 24.10:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status-mini_0.2.0-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-app-cpu-status-mini_0.2.0-r1_all.ipk
    opkg install /tmp/luci-app-cpu-status-mini_0.2.0-r1_all.ipk
    rm /tmp/luci-app-cpu-status-mini_0.2.0-r1_all.ipk
    service rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-mini-ru_0.2.0-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-i18n-cpu-status-mini-ru_0.2.0-r1_all.ipk
    opkg install /tmp/luci-i18n-cpu-status-mini-ru_0.2.0-r1_all.ipk
    rm /tmp/luci-i18n-cpu-status-mini-ru_0.2.0-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-cpu-status-mini/blob/master/screenshots/01.jpg)
