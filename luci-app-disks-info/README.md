# luci-app-disks-info
Status of connected disk devices (partitions, filesystems, SMART) for LuCI (OpenWrt webUI).

OpenWrt >= 21.02.

**Dependences:** ucode, ucode-mod-fs, fdisk, smartmontools, smartmontools-drivedb.

## Installation notes

**OpenWrt >= 25.12:**

    apk update
    wget --no-check-certificate -O /tmp/luci-app-disks-info-0.6.1-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-app-disks-info-0.6.1-r1.apk
    apk --allow-untrusted add /tmp/luci-app-disks-info-0.6.1-r1.apk
    rm /tmp/luci-app-disks-info-0.6.1-r1.apk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-disks-info-ru-0.6.1-r1.apk https://github.com/gSpotx2f/packages-openwrt/raw/master/25.12/luci-i18n-disks-info-ru-0.6.1-r1.apk
    apk --allow-untrusted add /tmp/luci-i18n-disks-info-ru-0.6.1-r1.apk
    rm /tmp/luci-i18n-disks-info-ru-0.6.1-r1.apk

**OpenWrt <= 24.10:**

    opkg update
    wget --no-check-certificate -O /tmp/luci-app-disks-info_0.6.1-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-app-disks-info_0.6.1-r1_all.ipk
    opkg install /tmp/luci-app-disks-info_0.6.1-r1_all.ipk
    rm /tmp/luci-app-disks-info_0.6.1-r1_all.ipk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-disks-info-ru_0.6.1-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/24.10/luci-i18n-disks-info-ru_0.6.1-r1_all.ipk
    opkg install /tmp/luci-i18n-disks-info-ru_0.6.1-r1_all.ipk
    rm /tmp/luci-i18n-disks-info-ru_0.6.1-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-disks-info/blob/master/screenshots/01.jpg)
