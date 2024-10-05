# luci-app-cpu-status-mini
CPU utilization info for the LuCI status page (OpenWrt webUI).

OpenWrt >= 19.07.

Advanced version: [luci-app-cpu-status](https://github.com/gSpotx2f/luci-app-cpu-status).

## Installation notes

**OpenWrt >= 21.02:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status-mini_0.1.0-r5_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-app-cpu-status-mini_0.1.0-r5_all.ipk
    opkg install /tmp/luci-app-cpu-status-mini_0.1.0-r5_all.ipk
    rm /tmp/luci-app-cpu-status-mini_0.1.0-r5_all.ipk
    /etc/init.d/rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-mini-ru_0.1.0-r5_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-i18n-cpu-status-mini-ru_0.1.0-r5_all.ipk
    opkg install /tmp/luci-i18n-cpu-status-mini-ru_0.1.0-r5_all.ipk
    rm /tmp/luci-i18n-cpu-status-mini-ru_0.1.0-r5_all.ipk

**OpenWrt 19.07:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-status-mini_0.1-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-app-cpu-status-mini_0.1-1_all.ipk
    opkg install /tmp/luci-app-cpu-status-mini_0.1-1_all.ipk
    rm /tmp/luci-app-cpu-status-mini_0.1-1_all.ipk
    /etc/init.d/rpcd reload

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-status-mini-ru_0.1-1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-i18n-cpu-status-mini-ru_0.1-1_all.ipk
    opkg install /tmp/luci-i18n-cpu-status-mini-ru_0.1-1_all.ipk
    rm /tmp/luci-i18n-cpu-status-mini-ru_0.1-1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-cpu-status-mini/blob/master/screenshots/01.jpg)
