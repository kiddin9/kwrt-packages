include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-qosmate

PKG_MAINTAINER:=Markus Hütter <mh@hudra.net>
PKG_LICENSE:=GPL-3.0-or-later

LUCI_TITLE:=LuCI support for QoSmate
LUCI_DEPENDS:=+qosmate +luci-lib-jsonc +lua
LUCI_PKGARCH:=all

PO_LANG:=de

include $(TOPDIR)/feeds/luci/luci.mk

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/qosmate
	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DIR) $(1)/usr/libexec/rpcd

	$(INSTALL_DATA) ./htdocs/luci-static/resources/view/*.js $(1)/www/luci-static/resources/view/qosmate/

	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/luci-app-qosmate.json $(1)/usr/share/luci/menu.d/
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-qosmate.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_BIN) ./root/usr/libexec/rpcd/luci.qosmate $(1)/usr/libexec/rpcd/
endef

# call BuildPackage - OpenWrt buildroot signature

$(eval $(call BuildPackage,$(PKG_NAME)))
