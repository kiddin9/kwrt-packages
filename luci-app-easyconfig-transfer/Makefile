#
# Copyright 2024-2025 Rafał Wabik - IceG - From eko.one.pl forum
#
# Licensed to the GNU General Public License v3.0.
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI JS Support for easyconfig transfer statistics
PKG_MAINTAINER:=Rafał Wabik <4Rafal@gmail.com>
LUCI_DESCRIPTION:=LuCI JS interface for the easyconfig transfer statistics.
LUCI_DEPENDS:=+luci-base
PKG_VERSION:=1.0.16
PKG_RELEASE:=10
LUCI_PKGARCH:=all


define Package/luci-app-easyconfig-transfer/conffiles
/etc/config/easyconfig_transfer
/tmp/easyconfig_statistics.json
/usr/lib/easyconfig/easyconfig_statistics.json
/usr/lib/easyconfig/easyconfig_statistics.json.gz
endef


include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
