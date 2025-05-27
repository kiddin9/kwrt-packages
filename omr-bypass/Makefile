#
# Copyright (C) 2018-2023 Ycarus (Yannick Chabanois) <ycarus@zugaina.org> for OpenMPTCProuter
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=omr-bypass
PKG_VERSION:=0.1
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
SECTION:=net
CATEGORY:=Network
DEPENDS:=+curl +dnsmasq-full +sqlite3-cli +iptables +iptables-mod-extra +ipset
TITLE:=OMR-ByPass
endef

define Package/$(PKG_NAME)-nft
SECTION:=net
CATEGORY:=Network
DEPENDS:=+curl +dnsmasq-full +sqlite3-cli +firewall4 @!LINUX_5_4
TITLE:=OMR-ByPass NFT
endef

define Package/$(PKG_NAME)/description
OMR-ByPass
endef

define Package/$(PKG_NAME)/description
OMR-ByPass nft support
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(CP) ./files/* $(1)/
	rm -f $(1)/etc/init.d/omr-bypass-nft
endef

define Package/$(PKG_NAME)-nft/install
	$(CP) ./files/* $(1)/
	mv $(1)/etc/init.d/omr-bypass-nft $(1)/etc/init.d/omr-bypass
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
$(eval $(call BuildPackage,$(PKG_NAME)-nft))