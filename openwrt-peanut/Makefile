include $(TOPDIR)/rules.mk

PKG_NAME:=peanut
PKG_VERSION:=1.0
PKG_RELEASE:=1
PKG_LICENSE:=GPL-3.0-or-later
PKG_MAINTAINER:=Douglas Orend <doug.orend2@gmail.com>

include $(INCLUDE_DIR)/package.mk

define Package/peanut
	SECTION:=utils
	CATEGORY:=Utilities
	TITLE:=Peanut Script
	PKGARCH:=all
	DEPENDS:=+bash
endef

define Package/peanut/description
 Script to list all ports that the OS is listening on, sorted by IPv4 and IPv6, then port number (ascending).
endef

define Build/Prepare
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/peanut/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./files/peanut $(1)/usr/bin/peanut
endef

$(eval $(call BuildPackage,peanut))
