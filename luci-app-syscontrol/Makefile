# This is open source software, licensed under the MIT License.
#
# Copyright (C) 2024 BobbyUnknown
#
# Description:
# This software provides a RAM release scheduling application for OpenWrt.
# The application allows users to configure and automate the process of
# releasing RAM on their OpenWrt routers at specified intervals, helping
# to optimize system performance and resource management through
# a user-friendly web interface.


include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-syscontrol
PKG_VERSION:=1.0.1
PKG_RELEASE:=1

PKG_MAINTAINER:=BobbyUnknown <bobbyun.known88@gmail.com>

LUCI_TITLE:=LuCI for System Control
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=$(LUCI_TITLE)
  DEPENDS:=$(LUCI_DEPENDS)
  PKGARCH:=$(LUCI_PKGARCH)
endef

define Package/$(PKG_NAME)/description
  LuCI interface for System Control, a tool for managing the system.
endef

define Build/Prepare
	# No preparation steps required
endef

define Build/Compile
	# No compilation steps required
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./root/etc/config/77_syscontrol $(1)/etc/config/

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./root/etc/init.d/ram_release $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) ./root/usr/bin/ram_release.sh $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./root/usr/share/luci/menu.d/* $(1)/usr/share/luci/menu.d/

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./root/usr/share/rpcd/acl.d/luci-app-syscontrol.json $(1)/usr/share/rpcd/acl.d/

	$(INSTALL_DIR) $(1)/var/log
	$(INSTALL_DATA) ./root/var/log/ram_release.log $(1)/var/log/

	$(INSTALL_DIR) $(1)/www/luci-static/resources/view/syscontrol
	$(CP) ./htdocs/luci-static/resources/view/* $(1)/www/luci-static/resources/view/syscontrol/
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] || {
	/etc/init.d/ram_release enable
	/etc/init.d/ram_release start
}
endef

define Package/$(PKG_NAME)/prerm
#!/bin/sh
[ -n "$$IPKG_INSTROOT" ] || {
	/etc/init.d/ram_release stop
	/etc/init.d/ram_release disable
}
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
