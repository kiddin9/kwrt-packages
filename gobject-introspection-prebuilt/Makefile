include $(TOPDIR)/rules.mk

PKG_NAME:=gobject-introspection
PKG_VERSION:=1.78.1
PKG_RELEASE:=1

PKG_SOURCE:=gobject-introspection-prebuilt-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/jjm2473/openwrt-apps/releases/download/prebuilt/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.0-or-later AND GPL-2.0-or-later AND MIT
PKG_LICENSE_FILES:=COPYING

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/gobject-introspection

include $(INCLUDE_DIR)/package.mk

define Package/gobject-introspection
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Introspection system for GObject-based libraries
  DEPENDS:=@(x86_64||aarch64) +glib2 +alpine-musl-compat
  URL:=https://gi.readthedocs.io
endef

define Build/Compile
	true
endef

define Build/Configure
	true
endef

define Package/gobject-introspection/install
	$(INSTALL_DIR) \
		$(1)/usr

	$(CP) \
		$(PKG_BUILD_DIR)/$(ARCH)/lib \
		$(1)/usr
endef

$(eval $(call BuildPackage,gobject-introspection))
