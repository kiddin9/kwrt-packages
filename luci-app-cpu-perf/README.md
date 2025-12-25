# luci-app-cpu-perf
CPU performance management for LuCI (OpenWrt webUI).

OpenWrt >= 22.03.

**Dependences:** ucode, ucode-mod-fs.

## Installation notes

**OpenWrt >= 25.12:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-perf-0.6.1-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-app-cpu-perf-0.6.1-r1.apk
    apk --allow-untrusted add /tmp/luci-app-cpu-perf-0.6.1-r1.apk
    rm /tmp/luci-app-cpu-perf-0.6.1-r1.apk
    service rpcd restart
    service cpu-perf start

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-perf-ru-0.6.1-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-i18n-cpu-perf-ru-0.6.1-r1.apk
    apk --allow-untrusted add /tmp/luci-i18n-cpu-perf-ru-0.6.1-r1.apk
    rm /tmp/luci-i18n-cpu-perf-ru-0.6.1-r1.apk

**OpenWrt <= 24.10:**

    wget --no-check-certificate -O /tmp/luci-app-cpu-perf_0.6.1-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-app-cpu-perf_0.6.1-r1_all.ipk
    opkg install /tmp/luci-app-cpu-perf_0.6.1-r1_all.ipk
    rm /tmp/luci-app-cpu-perf_0.6.1-r1_all.ipk
    service rpcd restart
    service cpu-perf start

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-cpu-perf-ru_0.6.1-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-i18n-cpu-perf-ru_0.6.1-r1_all.ipk
    opkg install /tmp/luci-i18n-cpu-perf-ru_0.6.1-r1_all.ipk
    rm /tmp/luci-i18n-cpu-perf-ru_0.6.1-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-cpu-perf/blob/master/screenshots/00.jpg)
![](https://github.com/gSpotx2f/luci-app-cpu-perf/blob/master/screenshots/01.jpg)
![](https://github.com/gSpotx2f/luci-app-cpu-perf/blob/master/screenshots/02.jpg)

## Related LuCI applications:

CPU load: [https://github.com/gSpotx2f/luci-app-cpu-status](https://github.com/gSpotx2f/luci-app-cpu-status), [https://github.com/gSpotx2f/luci-app-cpu-status-mini](https://github.com/gSpotx2f/luci-app-cpu-status-mini).
Temperature: [https://github.com/gSpotx2f/luci-app-temp-status](https://github.com/gSpotx2f/luci-app-temp-status).
