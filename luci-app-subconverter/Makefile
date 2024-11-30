include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-subconverter
PKG_VERSION:=1.1
PKG_RELEASE:=9

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
	SECTION:=luci
	CATEGORY:=LuCI
	PKGARCH:=all
	SUBMENU:=3. Applications
	TITLE:=Subconverter
	DEPENDS:=+luci-base +luci +sub-web
endef

define Package/$(PKG_NAME)/description
	A luci-app for subweb and subconverter on OpenWRT
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/postinst
    #!/bin/sh
    chmod 755 /etc/subconverter/subconverter
endef

define Package/$(PKG_NAME)/prerm
    #!/bin/sh
    crontab -l | grep -v '/etc/init.d/subconverter' | crontab -
    killall -q /etc/subconverter/subconverter
    rm -rf /etc/subconverter
endef


define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci/view/subconverter
	$(INSTALL_DIR) $(1)/etc/init.d

	# $(CP) -r $(TOPDIR)/package/$(PKG_NAME)/* ./

	$(INSTALL_DATA) ./luasrc/controller/subconverter.lua $(1)/usr/lib/lua/luci/controller/
	$(INSTALL_DATA) ./luasrc/view/subconverter/subconverter.htm $(1)/usr/lib/lua/luci/view/subconverter
	$(INSTALL_DATA) ./luasrc/view/subconverter/prefini.htm $(1)/usr/lib/lua/luci/view/subconverter
	
	$(CP) -r ./root/etc/subconverter $(1)/etc/
	
	$(INSTALL_BIN) ./root/etc/init.d/subconverter $(1)/etc/init.d/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
