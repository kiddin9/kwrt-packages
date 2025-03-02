# SPDX-License-Identifier: Apache-2.0
#
# Copyright (C) 2023-2025 Anya Lin <hukk1996@gmail.com>

include $(TOPDIR)/rules.mk

PKG_NAME:=go-stun
PKG_UPSTREAM_VERSION:=0.1.4
PKG_UPSTREAM_GITHASH:=d32c135f5e509d278e95ba9945849903f966a91f
PKG_VERSION:=$(PKG_UPSTREAM_VERSION)~$(call version_abbrev,$(PKG_UPSTREAM_GITHASH))
PKG_RELEASE:=8

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/ccding/go-stun.git
PKG_SOURCE_VERSION:=d32c135f5e509d278e95ba9945849903f966a91f
PKG_MIRROR_HASH:=skip

PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_UPSTREAM_VERSION)
PKG_SOURCE:=$(PKG_SOURCE_SUBDIR)-$(PKG_SOURCE_VERSION).tar.gz

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_SOURCE_SUBDIR)

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_USE_MIPS16:=0
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/ccding/go-stun

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  TITLE:=A GO implementation of the STUN client
  URL:=https://github.com/ccding/go-stun
  DEPENDS:=$(GO_ARCH_DEPENDS)
endef

define Package/$(PKG_NAME)/description
  go-stun is a STUN (RFC 3489, 5389) client implementation in golang (a.k.a. UDP hole punching).
  RFC 3489: STUN - Simple Traversal of User Datagram Protocol (UDP) Through Network Address Translators (NATs)
  RFC 5389: Session Traversal Utilities for NAT (STUN)
endef

define Package/$(PKG_NAME)/conffiles
endef

define Package/$(PKG_NAME)/postinst
endef

define Package/$(PKG_NAME)/prerm
endef

define Package/$(PKG_NAME)/install
	$(call GoPackage/Package/Install/Bin,$(PKG_INSTALL_DIR))

	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/$(PKG_NAME) $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./uci-defaults $(1)/etc/uci-defaults/99_$(PKG_NAME)
endef

$(eval $(call GoBinPackage,$(PKG_NAME)))
$(eval $(call BuildPackage,$(PKG_NAME)))
