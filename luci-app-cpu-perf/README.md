# luci-app-cpu-perf
CPU performance information and management for LuCI (OpenWrt webUI).

OpenWrt >= 22.03.

**Dependences:** ucode, ucode-mod-fs.

## Installation notes

    wget --no-check-certificate -O /tmp/luci-app-cpu-perf_0.5.0-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-app-cpu-perf_0.5.0-r1_all.ipk
    opkg install /tmp/luci-app-cpu-perf_0.5.0-r1_all.ipk
    rm /tmp/luci-app-cpu-perf_0.5.0-r1_all.ipk
    service rpcd restart
    service cpu-perf start

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-perf-ru_0.5.0-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-i18n-cpu-perf-ru_0.5.0-r1_all.ipk
    opkg install /tmp/luci-i18n-cpu-perf-ru_0.5.0-r1_all.ipk
    rm /tmp/luci-i18n-cpu-perf-ru_0.5.0-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-cpu-perf/blob/master/screenshots/01.jpg)
![](https://github.com/gSpotx2f/luci-app-cpu-perf/blob/master/screenshots/02.jpg)

## Related LuCI applications:

CPU load: [https://github.com/gSpotx2f/luci-app-cpu-status](https://github.com/gSpotx2f/luci-app-cpu-status), [https://github.com/gSpotx2f/luci-app-cpu-status-mini](https://github.com/gSpotx2f/luci-app-cpu-status-mini).
Temperature: [https://github.com/gSpotx2f/luci-app-temp-status](https://github.com/gSpotx2f/luci-app-temp-status).
