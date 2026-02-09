include $(TOPDIR)/rules.mk

PKG_NAME:=aavmf
PKG_VERSION:=202508
PKG_RELEASE:=1

PKG_SOURCE:=aavmf-prebuilt-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/jjm2473/openwrt-apps/releases/download/prebuilt/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=BSD-2-Clause-Patent
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/aavmf-prebuilt

include $(INCLUDE_DIR)/package.mk

define Package/aavmf
  TITLE:=ARM (aarch64) Virtual Machine Firmware EFI
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

define Package/aavmf/install
	$(INSTALL_DIR) \
		$(1)/usr/share/AAVMF

	$(INSTALL_DATA) \
		$(PKG_BUILD_DIR)/AAVMF/* \
		$(1)/usr/share/AAVMF

endef

$(eval $(call BuildPackage,aavmf))
