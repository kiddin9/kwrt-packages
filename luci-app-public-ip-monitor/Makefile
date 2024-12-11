# See /LICENSE for more information.
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI app for monitoring Public IP
LUCI_DEPENDS:=+luci-base \
	+luci-mod-rpc
LUCI_PKGARCH:=all

PKG_LICENSE:=AGPL-3.0
PKG_MAINTAINER:=Chosen Realm Alfeche <calfeche13>


include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
