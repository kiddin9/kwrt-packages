#
# Copyright (C) 2006-2016 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=dogcom
PKG_VERSION:=1.6.5
PKG_RELEASE:=4

PKG_LICENSE:=AGPL-3.0
PKG_LICENSE_FILES:=LICENSE

PKG_SOURCE_PROTO:=local
PKG_SOURCE:=dogcom.tar.gz

PKG_SOURCE_SUBDIR:=$(PKG_NAME)
PKG_SOURCE:=$(PKG_SOURCE_SUBDIR).tar.gz
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_SOURCE_SUBDIR)
PKG_BUILD_PARALLEL:=1

#PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/dogcom
  SECTION:=net
  CATEGORY:=Network
  TITLE:=dogcom for openwrt.
  URL:=https://github.com/mchome/dogcom
endef

define Package/dogcom/description
	dogcom is drcom-generic implementation in C.
endef

define Package/dogcom/install
	$(INSTALL_DIR)  $(1)/usr/bin
	$(INSTALL_BIN)  $(PKG_BUILD_DIR)/dogcom $(1)/usr/bin
endef

$(eval $(call BuildPackage,dogcom))
