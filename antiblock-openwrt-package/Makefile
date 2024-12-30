include $(TOPDIR)/rules.mk

PKG_NAME:=antiblock
PKG_VERSION:=1.0.0
PKG_RELEASE:=7
PKG_LICENSE:=GPL-3.0-or-later

ifeq ("$(wildcard ../antiblock)", "")
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/karen07/antiblock
PKG_SOURCE_VERSION:=6ea4fcfdada6a86817cb5d681d35b023a1a18402
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
AntiBlock program proxies DNS requests. The IP addresses of the specified domains are added to the routing table for routing through the specified interface.
endef

define Package/antiblock/conffiles
/etc/config/antiblock
endef

ifneq ("$(wildcard ../antiblock)", "")
define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	$(CP) ../antiblock/* $(PKG_BUILD_DIR)/
endef
endif

define Package/antiblock/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/antiblock $(1)/usr/bin/antiblock

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/antiblock $(1)/etc/init.d/antiblock

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/antiblock $(1)/etc/config/antiblock
endef

$(eval $(call BuildPackage,antiblock))
