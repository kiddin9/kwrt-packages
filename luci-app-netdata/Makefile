# Netdata <https://github.com/netdata/netdata>
# Copyright (C) 2022-2024 muink <https://github.com/muink>
#
# This is free software, licensed under the GNU General Public License v3.
# See /LICENSE for more information.
#
include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-netdata

LUCI_TITLE:=LuCI Netdata
LUCI_DEPENDS:=+netdata-ssl +openssl-util

LUCI_DESCRIPTION:=Real-time performance monitoring

define Package/$(LUCI_NAME)/conffiles
endef

define Package/$(LUCI_NAME)/postinst
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
