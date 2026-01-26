
include $(TOPDIR)/rules.mk

PKG_NAME:=msr-tools
PKG_VERSION:=1.3
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/intel/msr-tools/archive/refs/tags/
PKG_HASH:=skip
PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>

PKG_LICENSE:=GPL-2.0-or-later
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/$(PKG_NAME)-$(PKG_NAME)-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/msr-tools
  SECTION:=utils
  CATEGORY:=Utilities
  DEPENDS:=@TARGET_x86
  TITLE:=msr-tools
  URL:=https://01.org/msr-tools
endef

define Package/msr-tools/description
	utilities for MSRs and CPU ID
endef

define Build/Configure
	mkdir -p $(PKG_INSTALL_DIR)/usr/bin
endef

define Package/msr-tools/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) \
		$(PKG_INSTALL_DIR)/usr/bin/{cpuid,rdmsr,wrmsr} \
		$(1)/usr/bin/
endef

MAKE_FLAGS+= sbindir="$(PKG_INSTALL_DIR)/usr/bin" install

$(eval $(call BuildPackage,msr-tools))
