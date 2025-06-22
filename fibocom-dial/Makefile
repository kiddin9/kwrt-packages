include $(TOPDIR)/rules.mk

PKG_NAME:=fibocom-dial
PKG_RELEASE:=5

include $(INCLUDE_DIR)/package.mk

define Package/fibocom-dial
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=WWAN
  TITLE:=Dialing tool for Fibocom WWAN modules
endef

define Package/fibocom-dial/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/fibocom-dial $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/fibo_qmimsg_server $(1)/usr/bin/fibocom-qmimsg-server
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/multi-pdn-manager $(1)/usr/bin/fibocom-multi-pdn-manager
endef

$(eval $(call BuildPackage,fibocom-dial))
