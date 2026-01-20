
include $(TOPDIR)/rules.mk

PKG_NAME:=zip
PKG_REV:=30
PKG_VERSION:=3.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)$(PKG_REV).tar.gz
PKG_SOURCE_URL:=http://downloads.sourceforge.net/infozip/
PKG_HASH:=skip
PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>

PKG_LICENSE:=LicenseRef-Info-ZIP
PKG_LICENSE_FILES:=LICENSE
PKG_CPE_ID:=cpe:/a:info-zip:zip

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/zip$(PKG_REV)
PKG_CHECK_FORMAT_SECURITY:=0

include $(INCLUDE_DIR)/package.mk

define Package/zip
  SECTION:=utils
  CATEGORY:=Utilities
  DEPENDS:=+libbz2
  TITLE:=Archiver to .zip files
  URL:=https://infozip.sourceforge.net/Zip.html
  SUBMENU:=Compression
endef

define Package/zip/description
	InfoZIP's zip program. Compressor/archiver for creating and modifying zipfiles.
endef

define Build/Configure
endef

TARGET_CFLAGS += \
	$(TARGET_CPPFLAGS) -I. -DUNIX \
	-DBZIP2_SUPPORT \
	-DLARGE_FILE_SUPPORT \
	-DUNICODE_SUPPORT \
	-DZIP64_SUPPORT

define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR) -f unix/Makefile \
		$(TARGET_CONFIGURE_OPTS) \
		prefix="$(PKG_INSTALL_DIR)/usr" \
		CFLAGS="$(TARGET_CFLAGS) -O" \
		CFLAGS_NOOPT="$(TARGET_CFLAGS)" \
		CC="$(TARGET_CC)" \
		BIND="$(TARGET_CC) $(TARGET_LDFLAGS)" \
		LFLAGS2="-lbz2" \
		OCRCU8="crc32_.o" \
		OCRCTB="" \
		install
endef

define Package/zip/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) \
		$(PKG_INSTALL_DIR)/usr/bin/{zip,zipcloak,zipnote,zipsplit} \
		$(1)/usr/bin/
endef

$(eval $(call BuildPackage,zip))
