# Copyright 2024- Douglas Orend <doug.orend2@gmail.com>
# This is free software, licensed under the Apache License, Version 2.0

include $(TOPDIR)/rules.mk

PKG_LICENSE:=Apache-2.0
PKG_NAME:=luci-app-ympd
PKG_VERSION:=1.1
PKG_RELEASE:=1
PKG_MAINTAINER:=Douglas Orend <doug.orend2@gmail.com>

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-ympd
	SECTION:=luci
	CATEGORY:=LuCI
	SUBMENU:=3. Applications
	TITLE:=LuCI support for ympd
	PKGARCH:=all
	DEPENDS:=+luci-base +ympd
endef

define Package/luci-app-ympd/description
	LuCI Support for YMPD 
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/luci-app-ympd/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/
	$(INSTALL_DATA) ./htdocs/*.js $(1)/www/luci-static/resources/view/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d/
	$(INSTALL_DATA) ./root/luci-menu.d.json $(1)/usr/share/luci/menu.d/luci-app-ympd.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/rpcd-acl.d.json $(1)/usr/share/rpcd/acl.d/luci-app-ympd.json
endef

$(eval $(call BuildPackage,luci-app-ympd))
