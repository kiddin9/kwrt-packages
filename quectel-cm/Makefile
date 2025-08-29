include $(TOPDIR)/rules.mk

PKG_NAME:=quectel-cm
PKG_VERSION:=1.6.7
PKG_RELEASE:=23

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/quectel-open-source/Quectel_QConnectManager_Linux
PKG_SOURCE_VERSION:=170ed7177cc3beb831bc85571aad956492ff7e7e
PKG_MIRROR_HASH:=skip

include $(INCLUDE_DIR)/package.mk

define Package/quectel-cm
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Quectel dial program
  DEPENDS:=+libpthread
endef

define Package/quectel-cm/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/quectel-CM $(1)/usr/bin
endef

$(eval $(call BuildPackage,quectel-cm))
