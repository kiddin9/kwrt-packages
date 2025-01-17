# SPDX-License-Identifier: MIT
#
# Copyright (C) 2023-2025 muink <https://github.com/muink>

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-alwaysonline

LUCI_TITLE:=LuCI Support for alwaysonline
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+uci-alwaysonline

LUCI_DESCRIPTION:=Hijack/bypass Windows NCSI and iOS portal detection

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=MIT

define Package/$(LUCI_NAME)/conffiles
endef

define Package/$(LUCI_NAME)/postinst
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
