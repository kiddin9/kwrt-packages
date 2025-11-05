# Copyright (C) 2019 Openwrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-qbittorrent-ee
PKG_VERSION:=1.0-26
PKG_RELEASE:=1

LUCI_TITLE:=LuCI support for qBittorrent EE
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+qBittorrent-EE

define Package/$(PKG_NAME)/conffiles
/etc/config/qbittorrent_ee
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
