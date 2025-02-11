#
# Copyright (C) 2006-2009 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=dhrystone
PKG_VERSION:=2.1
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/siasjack/dhrystone4OP.git
PKG_SOURCE_VERSION:=cce98c52c3d8b2676ca68cab075c6e89fc9988d2
PKG_MIRROR_HASH:=skip

MAKE_PATH:=src

include $(INCLUDE_DIR)/package.mk

define Package/dhrystone
  SECTION:=utils
  CATEGORY:=Utilities
  URL:=https://github.com/siasjack/dhrystone4OP
  TITLE:=Dhrystone Benchmark Program
endef

define Package/dhrystone/description
  Dhrystone 2.1 Benchmark Program by Reinhold P. Weicker
endef

define Package/dhrystone/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/src/gcc_dry2 $(1)/usr/bin/dhrystone
endef

$(eval $(call BuildPackage,dhrystone))
