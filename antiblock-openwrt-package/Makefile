include $(TOPDIR)/rules.mk

PKG_NAME:=antiblock
PKG_VERSION:=1.0.0
PKG_RELEASE:=5
PKG_LICENSE:=GPL-3.0-or-later

ifeq ("$(wildcard ../antiblock)", "")
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/karen07/antiblock
PKG_SOURCE_VERSION:=81a5cca4f2dcf595655d28ceda6686783196f17f
endif

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Package/antiblock
	SECTION:=net
	CATEGORY:=Network
	DEPENDS:=libcurl kmod-tun
	TITLE:=DNS proxy add blocked domains ip address to route table.
	URL:=https://github.com/karen07/antiblock
endef

define Package/antiblock/description
	DNS proxy add blocked domains ip address to route table.
endef

ifneq ("$(wildcard ../antiblock)", "")
define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ../antiblock/* $(PKG_BUILD_DIR)/
endef
endif

define Package/antiblock/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/antiblock $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/antiblock $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/antiblock $(1)/etc/config/
endef

$(eval $(call BuildPackage,antiblock))
