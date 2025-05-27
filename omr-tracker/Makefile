#
# OpenMPTCProuter tracker is a modified version of OverTheBox tracker from OVH
# Copyright (C) 2017-2023 Ycarus (Yannick Chabanois) <ycarus@zugaina.org>
#
# This is free software, licensed under the GNU General Public License v3.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=omr-tracker
PKG_VERSION:=2.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  TITLE:=OpenMPTCProuter tracker
  PKGARCH:=all
  DEPENDS:=+bind-dig +httping +whois +shadowsocks-libev-ss-local
endef

define Package/$(PKG_NAME)/description
  A module to track OpenMPTCProuter connections
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/conffiles
/etc/config/$(PKG_NAME)
endef

define Package/$(PKG_NAME)/install
	$(CP) ./files/* $(1)/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
