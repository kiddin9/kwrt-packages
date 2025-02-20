# Copyright 2024- Douglas Orend <doug.orend2@gmail.com>
# This is free software, licensed under the Apache License, Version 2.0

include $(TOPDIR)/rules.mk

PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=LuCI support for AdguardHome
LUCI_DEPENDS:=+adguardhome +luci-base

PKG_MAINTAINER:=Douglas Orend <doug.orend2@gmail.com>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
