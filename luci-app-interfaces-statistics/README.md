# luci-app-interfaces-statistics
Network interfaces statistics for LuCI (OpenWrt webUI).

OpenWrt >= 21.02.

## Installation notes

**OpenWrt >= 25.12:**

    wget --no-check-certificate -O /tmp/luci-app-interfaces-statistics-0.4.1-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-app-interfaces-statistics-0.4.1-r1.apk
    apk --allow-untrusted add /tmp/luci-app-interfaces-statistics-0.4.1-r1.apk
    rm /tmp/luci-app-interfaces-statistics-0.4.1-r1.apk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-interfaces-statistics-ru-0.4.1-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-i18n-interfaces-statistics-ru-0.4.1-r1.apk
    apk --allow-untrusted add /tmp/luci-i18n-interfaces-statistics-ru-0.4.1-r1.apk
    rm /tmp/luci-i18n-interfaces-statistics-ru-0.4.1-r1.apk

**OpenWrt <= 24.10:**

    wget --no-check-certificate -O /tmp/luci-app-interfaces-statistics_0.4.1-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-app-interfaces-statistics_0.4.1-r1_all.ipk
    opkg install /tmp/luci-app-interfaces-statistics_0.4.1-r1_all.ipk
    rm /tmp/luci-app-interfaces-statistics_0.4.1-r1_all.ipk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-interfaces-statistics-ru_0.4.1-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-i18n-interfaces-statistics-ru_0.4.1-r1_all.ipk
    opkg install /tmp/luci-i18n-interfaces-statistics-ru_0.4.1-r1_all.ipk
    rm /tmp/luci-i18n-interfaces-statistics-ru_0.4.1-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-interfaces-statistics/blob/master/screenshots/01.jpg)
