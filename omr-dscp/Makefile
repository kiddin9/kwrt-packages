#
# Copyright (C) 2018-2023 Ycarus (Yannick Chabanois) <ycarus@zugaina.org> for OpenMPTCProuter
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=omr-dscp
PKG_VERSION:=0.1
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
SECTION:=net
CATEGORY:=Network
DEPENDS:= +dnsmasq-full +LINUX_5_4:iptables +LINUX_5_4:iptables-mod-extra +LINUX_5_4:ipset
TITLE:=OMR-DSCP
endef

define Package/$(PKG_NAME)-nft
SECTION:=net
CATEGORY:=Network
DEPENDS:= +dnsmasq-full
TITLE:=OMR-DSCP nft
endef

define Package/$(PKG_NAME)/description
OMR-ByPass
endef

define Package/$(PKG_NAME)-nft/description
OMR-ByPass nft support
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(CP) ./files/* $(1)/
	rm -f $(1)/etc/init.d/omr-dscp-nft
endef

define Package/$(PKG_NAME)-nft/install
	$(CP) ./files/* $(1)/
	mv $(1)/etc/init.d/omr-dscp-nft $(1)/etc/init.d/omr-dscp
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
$(eval $(call BuildPackage,$(PKG_NAME)-nft))
