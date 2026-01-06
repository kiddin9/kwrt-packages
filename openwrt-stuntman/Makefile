# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2023-2026 muink <https://github.com/muink>

include $(TOPDIR)/rules.mk

PKG_NAME:=stuntman
PKG_UPSTREAM_VERSION:=1.2.17
PKG_UPSTREAM_GITHASH:=cc5b875b3ac34b08b831ce34463b3474d412ac98
PKG_VERSION:=$(PKG_UPSTREAM_VERSION)~$(call version_abbrev,$(PKG_UPSTREAM_GITHASH))
PKG_RELEASE:=10

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/muink/stunserver.git
PKG_SOURCE_VERSION:=cc5b875b3ac34b08b831ce34463b3474d412ac98
PKG_MIRROR_HASH:=skip

PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_UPSTREAM_VERSION)
PKG_SOURCE:=$(PKG_SOURCE_SUBDIR)-$(PKG_SOURCE_VERSION).tar.gz

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_SOURCE_SUBDIR)

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=boost/host

PKG_FIXUP:=autoreconf
PKG_BUILD_PARALLEL:=1
PKG_USE_MIPS16:=0
PKG_BUILD_FLAGS:=no-mips16

#EXTRA_CPPFLAGS+= -I$(STAGING_DIR_HOSTPKG)/include/boost
EXTRA_CPPFLAGS+= $(HOST_CPPFLAGS)

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)/Default
	SECTION:=net
	CATEGORY:=Network
	TITLE:=An open source STUN server and client code by john selbie. Compliant with the latest RFCs including 5389, 5769, and 5780. Also includes backwards compatibility for RFC 3489.
	URL:=https://github.com/jselbie/stunserver
	DEPENDS:=+libpthread +libstdcpp +libopenssl
endef

Package/$(PKG_NAME)-client = $(Package/$(PKG_NAME)/Default)
Package/$(PKG_NAME)-server = $(Package/$(PKG_NAME)/Default)
Package/$(PKG_NAME)-testcode = $(Package/$(PKG_NAME)/Default)

define Package/$(PKG_NAME)/description/Default
  An open source STUN server and client code by john selbie. Compliant with the latest RFCs including 5389, 5769, and 5780. Also includes backwards compatibility for RFC 3489.
endef

Package/$(PKG_NAME)-client/description = $(Package/$(PKG_NAME)/description/Default)
Package/$(PKG_NAME)-server/description = $(Package/$(PKG_NAME)/description/Default)
Package/$(PKG_NAME)-testcode/description = $(Package/$(PKG_NAME)/description/Default)

define Package/$(PKG_NAME)-client/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/stunclient $(1)/usr/bin/
endef

define Package/$(PKG_NAME)-testcode/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/stuntestcode $(1)/usr/bin/
endef

define Package/$(PKG_NAME)-server/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/stunserver $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,$(PKG_NAME)-client))
$(eval $(call BuildPackage,$(PKG_NAME)-testcode))
$(eval $(call BuildPackage,$(PKG_NAME)-server))
