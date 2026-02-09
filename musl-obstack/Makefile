

include $(TOPDIR)/rules.mk

PKG_NAME:=musl-obstack
PKG_VERSION:=1.2.3
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL_FILE:=v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/void-linux/musl-obstack/archive/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=GPL-2.0-or-later
PKG_LICENSE_FILES:=COPYING

PKG_FIXUP:=autoreconf
PKG_BUILD_PARALLEL:=1
PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/musl-obstack
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Standalone library to implement GNU libc's obstack
  URL:=https://github.com/void-linux/musl-obstack
  DEPENDS:=@USE_MUSL
endef

define Package/musl-obstack/description
The musl-obstack package is a copy + paste of the obstack functions and macros
 found in GNU gcc libiberty library for use with musl libc.
endef

define Package/musl-obstack/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/bin
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/lib*.so* $(1)/usr/lib

endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/include/* $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/* $(1)/usr/lib
	$(SED) 's,=/usr,=$(STAGING_DIR)/usr,g' $(1)/usr/lib/pkgconfig/*.pc
endef

$(eval $(call BuildPackage,musl-obstack))
