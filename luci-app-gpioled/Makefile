#
# Copyright (C) 2008-2014 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-gpioled
PKG_VERSION:=1.0.1-20230809
PKG_RELEASE:=12
PKG_MAINTAINER:=<https://github.com/animegasan>

LUCI_TITLE:=LuCI for GPIO LED
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+coreutils-sleep +screen +bash
LUCI_DESCRIPTION:=LuCI support for GPIO LED Configuration

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
