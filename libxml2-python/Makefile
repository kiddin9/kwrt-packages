include $(TOPDIR)/rules.mk

PKG_NAME:=libxml2-python
PKG_VERSION:=$(shell grep -m1 '^PKG_VERSION:=' $(TOPDIR)/package/libs/libxml2/Makefile | cut -d'=' -f2)
PKG_RELEASE:=1

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=Copyright

PKG_BUILD_DEPENDS:=libxml2

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/libxml2-python
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Python bindings for libxml2
  URL:=http://xmlsoft.org/
  DEPENDS:=+libxml2 +libpython3 +@LIBXML2_WITH_PYTHON
endef

define Build/Configure
endef

define Build/Compile
endef

define Build/Install
endef

define Package/libxml2-python/install
	$(INSTALL_DIR) $(1)$(PYTHON3_PKG_DIR)
	$(CP) $(STAGING_DIR)/usr/python/{drv_libxml2.py,libxml2.py} \
		$(1)$(PYTHON3_PKG_DIR)/
	$(CP) $(STAGING_DIR)/usr/python/libxml2mod.so* \
		$(1)$(PYTHON3_PKG_DIR)/
endef

$(eval $(call BuildPackage,libxml2-python))
