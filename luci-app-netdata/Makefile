# SPDX-License-Identifier: GPL-3.0
#
# Copyright (C) 2022-2025 muink <https://github.com/muink>

include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-netdata

LUCI_TITLE:=LuCI Netdata
LUCI_DEPENDS:=+netdata-ssl +openssl-util

LUCI_DESCRIPTION:=Real-time performance monitoring

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=GPL-3.0

define Package/$(LUCI_NAME)/conffiles
endef

define Package/$(LUCI_NAME)/postinst
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
