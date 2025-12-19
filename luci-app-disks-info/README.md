# luci-app-disks-info
Status of connected disk devices (partitions, filesystems, SMART) for LuCI (OpenWrt webUI).

OpenWrt >= 21.02.

**Dependences:** ucode, ucode-mod-fs, fdisk, smartmontools, smartmontools-drivedb.

## Installation notes

    opkg update
    wget --no-check-certificate -O /tmp/luci-app-disks-info_0.6.0-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-app-disks-info_0.6.0-r1_all.ipk
    opkg install /tmp/luci-app-disks-info_0.6.0-r1_all.ipk
    rm /tmp/luci-app-disks-info_0.6.0-r1_all.ipk
    service rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-disks-info-ru_0.6.0-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-i18n-disks-info-ru_0.6.0-r1_all.ipk
    opkg install /tmp/luci-i18n-disks-info-ru_0.6.0-r1_all.ipk
    rm /tmp/luci-i18n-disks-info-ru_0.6.0-r1_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-disks-info/blob/master/screenshots/01.jpg)
