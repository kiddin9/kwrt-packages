# Copyright (C) 2024 Openwrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-gecoosac
PKG_VERSION:=2.2
PKG_RELEASE:=15

LUCI_TITLE:=LuCI Support for gecoosac
LUCI_DEPENDS:=+luci-compat +gecoosac
LUCI_PKGARCH:=all

define Package/$(PKG_NAME)/conffiles
/etc/gecoosac
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
