

include $(TOPDIR)/rules.mk

PKG_NAME:=libosinfo
PKG_VERSION:=1.12.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://gitlab.com/libosinfo/libosinfo/-/archive/v$(PKG_VERSION)/
PKG_HASH:=skip
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-v$(PKG_VERSION)

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.0-or-later
PKG_LICENSE_FILES:=COPYING
PKG_CPE_ID:=cpe:/a:libosinfo:libosinfo

PKG_BUILD_DEPENDS:=glib2 libsoup3 libxml2 libxslt

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/meson.mk

define Package/libosinfo
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=library for managing OS information for virtualization
  DEPENDS:=+glib2 +libsoup3 +libxml2 +libxslt +pciids +usbids +osinfo-db
  URL:=https://libosinfo.org/
endef

define Package/libosinfo/description
The libosinfo project comprises three parts:

1. A database of metadata about operating systems, hypervisors, virtual hardware and more
2. A GObject based library API for querying information from the database
3. Command line tools for querying & extracting information from the database
endef

define Package/libosinfo/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/bin
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/*.so* $(1)/usr/lib
#	$(CP) $(PKG_INSTALL_DIR)/usr/lib/girepository-1.0 $(1)/usr/lib/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/* $(1)/usr/bin
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/include/* $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/* $(1)/usr/lib
	$(SED) 's,=/usr,=$(STAGING_DIR)/usr,g' $(1)/usr/lib/pkgconfig/*.pc
endef

MESON_ARGS += \
	-Db_lto=true \
	-Denable-gtk-doc=false \
	-Denable-introspection=disabled \
	-Denable-tests=false \
	-Denable-vala=disabled \
	-Dwith-pci-ids-path=/usr/share/hwdata/pci.ids \
	-Dwith-usb-ids-path=/usr/share/hwdata/usb.ids

$(eval $(call BuildPackage,libosinfo))
