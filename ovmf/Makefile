include $(TOPDIR)/rules.mk

PKG_NAME:=ovmf
PKG_VERSION:=202508
PKG_RELEASE:=1

PKG_SOURCE:=ovmf-prebuilt-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/jjm2473/openwrt-apps/releases/download/prebuilt/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=BSD-2-Clause-Patent
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/ovmf-prebuilt

include $(INCLUDE_DIR)/package.mk

define Package/ovmf
  TITLE:=Open Virtual Machine Firmware (OVMF) BIOS
  SECTION:=firmware
  CATEGORY:=Firmware
  URL:=https://github.com/tianocore/tianocore.github.io/wiki/EDK-II/
  PKGARCH:=all
endef

define Build/Compile
	true
endef

define Build/Configure
	true
endef

define Package/ovmf/install
	$(INSTALL_DIR) \
		$(1)/usr/share/OVMF \
		$(1)/usr/share/ovmf

	$(INSTALL_DATA) \
		$(PKG_BUILD_DIR)/OVMF/* \
		$(1)/usr/share/OVMF

	$(CP) \
		$(PKG_BUILD_DIR)/ovmf/* \
		$(1)/usr/share/ovmf
endef

$(eval $(call BuildPackage,ovmf))
