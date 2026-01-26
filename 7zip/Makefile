
include $(TOPDIR)/rules.mk

PKG_NAME:=7zip
PKG_VERSION:=25.01
PKG_REV:=$(subst .,,$(PKG_VERSION))
PKG_RELEASE:=1

PKG_SOURCE:=7z$(PKG_REV)-src.tar.xz
PKG_SOURCE_URL:=https://7-zip.org/a/
PKG_HASH:=skip
PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>

PKG_LICENSE:=LGPL-2.0-only
PKG_LICENSE_FILES:=DOC/License.txt DOC/copying.txt
PKG_CPE_ID:=cpe:/a:7-zip:7-zip

PKG_CHECK_FORMAT_SECURITY:=0

include $(INCLUDE_DIR)/package.mk

define Package/7zip
  SECTION:=utils
  CATEGORY:=Utilities
  DEPENDS:=+libstdcpp
  TITLE:=7zip
  URL:=https://7-zip.org/
  SUBMENU:=Compression
endef

define Package/7zip/description
	File archiver with a high compression ratio
endef

TAR_OPTIONS := -C $(PKG_BUILD_DIR) $(TAR_OPTIONS)

define Build/Configure
endef

define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR)/CPP/7zip/Bundles/Alone2 -f ../../cmpl_gcc.mak \
		CC="$(TARGET_CC) $(TARGET_CFLAGS) -D_GNU_SOURCE -O" \
		CXX="$(TARGET_CXX) $(TARGET_CXXFLAGS) -D_GNU_SOURCE -O" \
		DISABLE_RAR=1
endef

define Package/7zip/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) \
		$(PKG_BUILD_DIR)/CPP/7zip/Bundles/Alone2/b/g/7zz \
		$(1)/usr/bin/
	$(LN) 7zz $(1)/usr/bin/7z
endef

$(eval $(call BuildPackage,7zip))
