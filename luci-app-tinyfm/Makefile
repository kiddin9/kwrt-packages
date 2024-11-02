# Ini adalah perangkat lunak open source, dilisensikan di bawah Lisensi Open Source Kustom
#
# Hak Cipta (C) 2024 BobbyUnknown
#
# Deskripsi:
# Perangkat lunak ini menyediakan aplikasi filemanager tinyfilemanager untuk OpenWrt.
# Aplikasi ini memungkinkan pengguna untuk mengelola file dan direktori pada router
# OpenWrt melalui antarmuka web yang mudah digunakan.
include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Filemanager
LUCI_DEPENDS:=+php8 +php8-cgi +php8-fastcgi +php8-fpm +php8-mod-session +php8-mod-ctype +php8-mod-fileinfo +php8-mod-zip +php8-mod-iconv +php8-mod-mbstring +coreutils-stat +zoneinfo-asia +bash +curl +tar
LUCI_DESCRIPTION:=Upload Download filemanager

PKG_MAINTAINER:=BobbyUnknown <bobbyun.knowm88gmail.com>
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
