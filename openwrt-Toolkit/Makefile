# SPDX-License-Identifier: GPL-2.0
#
# Copyright (C) 2023-2024 muink <https://github.com/muink>
# Copyright (C) 2015-2017 wongsyrone

include $(TOPDIR)/rules.mk

PKG_NAME:=Toolkit
PKG_UPSTREAM_VERSION:=0.4.0.2
PKG_UPSTREAM_GITHASH:=631954eac283e38822c47e3122e9e2a3ac5984c6
PKG_VERSION:=$(PKG_UPSTREAM_VERSION)~$(call version_abbrev,$(PKG_UPSTREAM_GITHASH))
PKG_RELEASE:=2

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/muink/Toolkit.git
PKG_SOURCE_VERSION:=631954eac283e38822c47e3122e9e2a3ac5984c6
#PKG_MIRROR_HASH:=skip

PKG_SOURCE:=$(PKG_NAME)-$(PKG_SOURCE_VERSION).tar.gz
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_UPSTREAM_VERSION)
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_SOURCE_SUBDIR)

PKG_LICENSE:=GPL-2.0
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Chengr28 <chengr28@twitter>

PKG_USE_MIPS16:=0
PKG_BUILD_PARALLEL:=1
CMAKE_INSTALL:=1

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

TARGET_CFLAGS += $(FPIC)

CMAKE_OPTIONS += \
	-DPLATFORM_OPENWRT=ON

# Note: GCC 4.6 and 4.8 dont have complete C++11 support
#       Please use GCC 4.9 or higher to compile
define Package/Toolkit
	SECTION:=net
	CATEGORY:=Network
	TITLE:=A useful and powerful toolkit (DNSPing+FileHash)
	URL:=https://github.com/chengr28/Toolkit
	DEPENDS:=+libstdcpp \
		@GCC_VERSION_4_6:BROKEN @GCC_VERSION_4_8:BROKEN
endef

define Package/Toolkit/config
if PACKAGE_Toolkit

	config PACKAGE_Toolkit_advancedoptions
		bool "Use advanced compile options, see Makefile for details."
		default n
endif
endef

define Package/Toolkit/description
A network util can ping with DNS request.
endef

# Some advanced compile flags for expert
ifneq ($(CONFIG_PACKAGE_Toolkit_advancedoptions),)
	# Try to reduce binary size
	TARGET_CFLAGS += -ffunction-sections -fdata-sections
	TARGET_LDFLAGS += -Wl,--gc-sections
	# Use Link time optimization
	TARGET_CFLAGS += -flto
	TARGET_LDFLAGS += -Wl,-flto
endif

define Package/Toolkit/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/{DNSPing,FileHash} $(1)/usr/sbin/
endef


$(eval $(call BuildPackage,Toolkit))
