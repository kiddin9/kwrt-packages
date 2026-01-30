
include $(TOPDIR)/rules.mk

PKG_NAME:=virt-manager
PKG_VERSION:=5.0.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_SOURCE_URL:=https://releases.pagure.org/virt-manager/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.1-or-later
PKG_LICENSE_FILES:=COPYING COPYING.LESSER
PKG_CPE_ID:=cpe:/a:virt-manager:virt-manager

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/meson.mk

define Package/virt-manager
  SECTION:=libs
  CATEGORY:=Libraries
  DEPENDS:=+libvirt-glib +qemu-img +libvirt-python +libxml2-python
  TITLE:=GUI for managing virtual machines
  URL:=https://virt-manager.org/
endef

define Package/virt-manager/description
  The virt-manager application is a desktop user interface for managing virtual machines through libvirt.
endef

MESON_ARGS += \
	-Dupdate-icon-cache=false \
	-Dcompile-schemas=false \
	-Dupdate-icon-cache=false

define Package/virt-manager/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_DIR) $(1)/usr/share/virt-manager
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/* $(1)/usr/bin
	$(CP) $(PKG_INSTALL_DIR)/usr/share/virt-manager/virtinst $(1)/usr/share/virt-manager
	$(CP) ./files/Libosinfo.py $(1)/usr/share/virt-manager/virtinst/
endef

$(eval $(call BuildPackage,virt-manager))
