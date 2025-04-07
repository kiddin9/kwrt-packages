include $(TOPDIR)/rules.mk

PKG_NAME:=gecoosac
PKG_VERSION:=2.2.20250318
PKG_RELEASE:=6

ifeq ($(ARCH),aarch64)
  PKG_ARCH:=ac_linux_arm64
  PKG_HASH:=skip
else ifeq ($(ARCH),arm)
  PKG_ARCH:=ac_linux_arm
  PKG_HASH:=skip
else ifeq ($(ARCH),mips)
  PKG_ARCH:=ac_linux_mips
  PKG_HASH:=skip
else ifeq ($(ARCH),mipsel)
  PKG_ARCH:=ac_linux_mipsle
  PKG_HASH:=skip
else ifeq ($(ARCH),i386)
  PKG_ARCH:=ac_linux_386
  PKG_HASH:=skip
else ifeq ($(ARCH),x86_64)
  PKG_ARCH:=ac_linux_amd64
  PKG_HASH:=skip
else
  PKG_HASH:=skip
endif

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-$(ARCH_PACKAGES)
PKG_SOURCE_URL:=https://github.com/lwb1978/gecoosac-core/releases/download/V$(PKG_VERSION)/$(PKG_ARCH)?
UNPACK_CMD=$(CP) $(DL_DIR)/$(PKG_SOURCE) $(PKG_BUILD_DIR)/$(PKG_NAME)

PKG_LICENSE:=AGPL-3.0-only
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=lwb1978 <lwb1978@gmail.com>

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  TITLE:=gecoosac server (version $(PKG_VERSION))
  URL:=http://www.cnrouter.com/
  DEPENDS:=@(aarch64||arm||i386||mips||mipsel||x86_64)
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/$(PKG_NAME) $(1)/usr/bin
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
