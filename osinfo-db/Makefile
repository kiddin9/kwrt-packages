

include $(TOPDIR)/rules.mk

PKG_NAME:=osinfo-db
PKG_VERSION:=20251212
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_SOURCE_URL:=https://releases.pagure.org/libosinfo/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.0-or-later
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/osinfo-db
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=osinfo database files
  URL:=https://libosinfo.org/
endef

define Package/osinfo-db/description
  The database of metadata about operating systems, hypervisors,
  virtual hardware and more for libosinfo.
endef

define Package/osinfo-db/install
	$(INSTALL_DIR) $(1)/usr/share/osinfo
	$(CP) $(PKG_BUILD_DIR)/{datamap,device,install-script,LICENSE,os,platform,schema,VERSION} $(1)/usr/share/osinfo
endef

define Build/Configure
endef

define Build/Compile
endef

$(eval $(call BuildPackage,osinfo-db))
