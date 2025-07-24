
include $(TOPDIR)/rules.mk

PKG_NAME:=mergerfs
PKG_VERSION:=2.40.2
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/trapexit/mergerfs/releases/download/$(PKG_VERSION)/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=ISC
PKG_LICENSE_FILES:=LICENSE

PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

define Package/mergerfs
	SECTION:=utils
	CATEGORY:=Utilities
	SUBMENU:=Filesystem
	TITLE:=A featureful union filesystem
	URL:=https://github.com/trapexit/mergerfs
	DEPENDS:=+libstdcpp
endef

define Package/mergerfs/description
 mergerfs is a FUSE based union filesystem geared towards simplifying
 storage and management of files across numerous commodity storage
 devices. It is similar to mhddfs, unionfs, and aufs.
endef

define Package/mergerfs/install
	$(INSTALL_DIR) $(1)/sbin/fs $(1)/usr/bin $(1)/usr/lib/mergerfs
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/sbin/mount.mergerfs $(1)/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/mergerfs-fusermount $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/mergerfs $(1)/usr/bin/
	$(INSTALL_DATA) $(PKG_INSTALL_DIR)/usr/lib/mergerfs/preload.so $(1)/usr/lib/mergerfs/
	$(LN) /sbin/mount.mergerfs $(1)/sbin/fs/mount.mergerfs
endef

# Set variables used in the source's Makefile
MAKE_FLAGS+= NDEBUG=1 USE_XATTR=0 LTO=1 PREFIX=/usr

$(eval $(call BuildPackage,mergerfs))
