# luci-app-interfaces-statistics
Network interfaces statistics for LuCI (OpenWrt webUI).

OpenWrt >= 19.07.

## Installation notes

**OpenWrt >= 21.02:**

    wget --no-check-certificate -O /tmp/luci-app-interfaces-statistics_0.4.0-r4_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-app-interfaces-statistics_0.4.0-r4_all.ipk
    opkg install /tmp/luci-app-interfaces-statistics_0.4.0-r4_all.ipk
    rm /tmp/luci-app-interfaces-statistics_0.4.0-r4_all.ipk
    /etc/init.d/rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-interfaces-statistics-ru_0.4.0-r4_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-i18n-interfaces-statistics-ru_0.4.0-r4_all.ipk
    opkg install /tmp/luci-i18n-interfaces-statistics-ru_0.4.0-r4_all.ipk
    rm /tmp/luci-i18n-interfaces-statistics-ru_0.4.0-r4_all.ipk

**OpenWrt 19.07:**

    wget --no-check-certificate -O /tmp/luci-app-interfaces-statistics_0.4-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-app-interfaces-statistics_0.4-1_all.ipk
    opkg install /tmp/luci-app-interfaces-statistics_0.4-1_all.ipk
    rm /tmp/luci-app-interfaces-statistics_0.4-1_all.ipk
    /etc/init.d/rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-interfaces-statistics-ru_0.4-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-i18n-interfaces-statistics-ru_0.4-1_all.ipk
    opkg install /tmp/luci-i18n-interfaces-statistics-ru_0.4-1_all.ipk
    rm /tmp/luci-i18n-interfaces-statistics-ru_0.4-1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-interfaces-statistics/blob/master/screenshots/01.jpg)
