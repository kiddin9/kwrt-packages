include $(TOPDIR)/rules.mk

PKG_NAME:=python-gobject
PKG_VERSION:=3.46.0
PKG_RELEASE:=2

PKG_SOURCE:=python311-gobject-prebuilt-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/jjm2473/openwrt-apps/releases/download/prebuilt/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.1-or-later
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/python-gobject

include $(INCLUDE_DIR)/package.mk

define Package/python3-gobject
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Python bindings for the GObject library
  DEPENDS:=@(x86_64||aarch64) +gobject-introspection
  URL:=https://pygobject.gnome.org
endef

define Build/Configure
	true
endef

define Build/Compile
	rm -f $(PKG_BUILD_DIR)/*/usr/lib/python3.*/site-packages/gi/_gi_cairo.*.so
endef

define Package/python3-gobject/install
	$(INSTALL_DIR) \
		$(1)/usr

	$(CP) \
		$(PKG_BUILD_DIR)/$(ARCH)/usr/lib \
		$(1)/usr
endef

$(eval $(call BuildPackage,python3-gobject))
