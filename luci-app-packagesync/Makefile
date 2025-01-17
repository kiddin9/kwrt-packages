# SPDX-License-Identifier: GPL-3.0
#
# Copyright (C) 2023-2025 muink <https://github.com/muink>

include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-packagesync

LUCI_TITLE:=LuCI Local software source
LUCI_DEPENDS:=+blockd +curl +getopt +rsync +bash +jsonfilter +ncat-full

LUCI_DESCRIPTION:=Used to build a local mirror feeds source on the router

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=GPL-3.0

define Package/$(LUCI_NAME)/conffiles
/etc/config/packagesync
endef

define Package/$(LUCI_NAME)/postinst
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
