include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/target.mk

PKG_SOURCE_URL=$(BASE_URL)
PKG_VERSION:=latest
PKG_RELEASE:=1
PKG_NAME:=fogvdn
PKG_HASH:=skip

ifeq ($(ARCH),x86_64)
	PKG_ARCH:=X64
else ifeq ($(ARCH),arm)
	PKG_ARCH:=ARM
else ifeq ($(ARCH),aarch64)
	PKG_ARCH:=ARM64
endif
PKG_VENDOR:=PEAR
PKG_SOURCE:=$(PKG_NAME)_$(PKG_VENDOR)_$(PKG_ARCH)_LINUX_$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://download.openfogos.com/release/


include $(INCLUDE_DIR)/package.mk
PKG_UNPACK:=$(HOST_TAR) -C $(PKG_BUILD_DIR)/root --strip-components=1 -xzf $(DL_DIR)/$(PKG_SOURCE)
define Package/$(PKG_NAME)
	SECTION:=net
	CATEGORY:=Network
  TITLE:=OpenFog Pear Peer-to-Peer Content Delivery Network
  DEPENDS:=+bash +jq +libc +getopt +ntpdate +whereis +smartmontools +zoneinfo-all +coreutils +coreutils-install +coreutils-df +coreutils-nohup @(aarch64||arm||x86_64)
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)/root
	$(PKG_UNPACK)

endef

define Build/Configure
endef

define Build/Compile
endef


define Package/$(PKG_NAME)/install
	$(CP) $(PKG_BUILD_DIR)/root/* $(1)/
endef


$(eval $(call BuildPackage,$(PKG_NAME)))
