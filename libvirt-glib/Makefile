

include $(TOPDIR)/rules.mk

PKG_NAME:=libvirt-glib
PKG_VERSION:=5.0.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_SOURCE_URL:=https://libvirt.org/sources/glib/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.1-or-later
PKG_LICENSE_FILES:=COPYING
PKG_CPE_ID:=cpe:/a:redhat:libvirt-glib


PKG_BUILD_DEPENDS:=libxml2

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/meson.mk

define Package/libvirt-glib
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=libvirt glib integration for events
  DEPENDS:=libvirt
  URL:=https://libvirt.org/
endef

define Package/libvirt-glib/description
  libvirt-glib wraps libvirt to provide a high-level object-oriented API better
  suited for glib-based applications
endef

define Package/libvirt-glib/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/*.so $(1)/usr/lib
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/include/* $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/* $(1)/usr/lib
	$(SED) 's,=/usr,=$(STAGING_DIR)/usr,g' $(1)/usr/lib/pkgconfig/*.pc
endef

MESON_ARGS += \
	-Ddocs=disabled

$(eval $(call BuildPackage,libvirt-glib))
