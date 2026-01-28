include $(TOPDIR)/rules.mk

PKG_NAME:=libvirt-python
PKG_VERSION:=11.10.0
PKG_RELEASE:=1

PYPI_NAME:=libvirt-python
PKG_HASH:=skip
PYPI_SOURCE_NAME:=libvirt_python

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.1-or-later
PKG_LICENSE_FILES:=COPYING
PKG_CPE_ID:=cpe:/a:redhat:libvirt-python

PKG_BUILD_DEPENDS:=libvirt python-setuptools

include $(TOPDIR)/feeds/packages/lang/python/pypi.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/libvirt-python
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Python
  TITLE:=Python bindings for libvirt
  URL:=https://libvirt.org/
  DEPENDS:=libvirt +libpython3
endef

define Package/libvirt-python/description
  The libvirt virtualization API python binding.
endef

$(eval $(call Py3Package,libvirt-python))
$(eval $(call BuildPackage,libvirt-python))
$(eval $(call BuildPackage,libvirt-python-src))
