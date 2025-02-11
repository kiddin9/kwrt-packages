# Copyright (C) 2019 Openwrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-webdav

LUCI_TITLE:=LuCI support for WebDav
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+nginx-mod-dav-ext

PKG_MAINTAINER:=sbwml <admin@cooluc.com>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
