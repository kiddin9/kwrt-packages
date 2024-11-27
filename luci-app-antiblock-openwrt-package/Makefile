# See /LICENSE for more information.
# This is free software, licensed under the GNU General Public License v2.

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-antiblock
PKG_LICENSE:=GPL-3.0-or-later

LUCI_TITLE:=AntiBlock Web UI
LUCI_URL:=https://github.com/karen07/luci-app-antiblock-openwrt-package
LUCI_DESCRIPTION:=Provides Web UI for AntiBlock
LUCI_DEPENDS:=+luci-base +antiblock

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
