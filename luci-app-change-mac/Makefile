# SPDX-License-Identifier: MIT
#
# Copyright (C) 2020-2024 muink <https://github.com/muink>

include $(TOPDIR)/rules.mk

LUCI_NAME:=luci-app-change-mac

LUCI_TITLE:=LuCI for MAC address randomizer
LUCI_DEPENDS:=+bash +rgmac +getopt

LUCI_DESCRIPTION:=Assign a random MAC address to the designated interface on every time boot.

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=MIT

define Package/$(LUCI_NAME)/conffiles
/etc/config/change-mac
endef

define Package/$(LUCI_NAME)/prerm
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
