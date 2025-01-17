# SPDX-License-Identifier: MIT
#
# Copyright (C) 2022-2025 muink <https://github.com/muink>
# Copyright (C) 2021 Tano Systems <https://github.com/tano-systems>

include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-tn-netports

LUCI_TITLE:=Network Interfaces Ports Status
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+luabitop

LUCI_DESCRIPTION:=Network ports status LuCI application

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=MIT

define Package/$(LUCI_NAME)/conffiles
/etc/config/luci_netports
endef

define Package/$(LUCI_NAME)/postinst
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
