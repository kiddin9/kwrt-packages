#
# Copyright (C) 2019 Ycarus (Yannick Chabanois) <ycarus@zugaina.org> for OpenMPTCProuter project
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_SOURCE_PROTO:=git
#PKG_SOURCE_URL:=https://github.com/jedisct1/dsvpn.git
PKG_SOURCE_URL:=https://github.com/Ysurac/dsvpn.git
#PKG_SOURCE_VERSION:=aae011339bba733d3fa4ffe8b5dd95dab2efb4ab
PKG_SOURCE_VERSION:=aae011339bba733d3fa4ffe8b5dd95dab2efb4ab
PKG_NAME:=dsvpn
PKG_VERSION:=0.1.5
PKG_RELEASE:=1
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
SECTION:=net
CATEGORY:=Network
DEPENDS:=+kmod-tun
TITLE:=A Dead Simple VPN
URL:=https://github.com/jedisct1/dsvpn
SUBMENU:=VPN
endef

define Package/$(PKG_NAME)/conffiles
/etc/config/dsvpn
endef

TARGET_CFLAGS += -DNO_DEFAULT_ROUTES -DNO_DEFAULT_FIREWALL -DNO_DEFAULT_CONGESTION

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/dsvpn $(1)/usr/sbin/$(PKG_NAME)
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) files/init $(1)/etc/init.d/$(PKG_NAME)
	$(INSTALL_DIR) $(1)/etc/config
	touch $(1)/etc/config/dsvpn
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
