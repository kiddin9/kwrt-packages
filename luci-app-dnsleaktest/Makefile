# This is free software, licensed under the Apache License, Version 2.0
#
# Copyright (C) 2024 Hilman Maulana <hilman0.0maulana@gmail.com>

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI for DNS Leak Test
LUCI_DEPENDS:=+curl
LUCI_DESCRIPTION:=LuCI support for DNS Leak Test

PKG_MAINTAINER:=Hilman Maulana <hilman0.0maulana@gmail.com>
PKG_VERSION:=1.1
PKG_RELEASE:=3
PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature