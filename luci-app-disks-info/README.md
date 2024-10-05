# luci-app-disks-info
Information about connected disk devices (partitions, filesystems, SMART) for LuCI (OpenWrt webUI).

OpenWrt >= 19.07.

Dependences: fdisk, smartmontools, smartmontools-drivedb.

## Installation notes

**OpenWrt >= 21.02:**

    opkg update
    wget --no-check-certificate -O /tmp/luci-app-disks-info_0.4.2-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-app-disks-info_0.4.2-r1_all.ipk
    opkg install /tmp/luci-app-disks-info_0.4.2-r1_all.ipk
    rm /tmp/luci-app-disks-info_0.4.2-r1_all.ipk
    /etc/init.d/rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-disks-info-ru_0.4.2-r1_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/current/luci-i18n-disks-info-ru_0.4.2-r1_all.ipk
    opkg install /tmp/luci-i18n-disks-info-ru_0.4.2-r1_all.ipk
    rm /tmp/luci-i18n-disks-info-ru_0.4.2-r1_all.ipk

**OpenWrt 19.07:**

    opkg update
    wget --no-check-certificate -O /tmp/luci-app-disks-info_0.3-7_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-app-disks-info_0.3-7_all.ipk
    opkg install /tmp/luci-app-disks-info_0.3-7_all.ipk
    rm /tmp/luci-app-disks-info_0.3-7_all.ipk
    /etc/init.d/rpcd restart

i18n-ru:

    wget --no-check-certificate -O /tmp/luci-i18n-disks-info-ru_0.3-7_all.ipk https://github.com/gSpotx2f/packages-openwrt/raw/master/19.07/luci-i18n-disks-info-ru_0.3-7_all.ipk
    opkg install /tmp/luci-i18n-disks-info-ru_0.3-7_all.ipk
    rm /tmp/luci-i18n-disks-info-ru_0.3-7_all.ipk

## Screenshots:

![](https://github.com/gSpotx2f/luci-app-disks-info/blob/master/screenshots/01.jpg)
