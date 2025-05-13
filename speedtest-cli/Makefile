include $(TOPDIR)/rules.mk

PKG_NAME:=speedtest-cli
PKG_VERSION:=1.2.0
PKG_RELEASE:=2

ifeq ($(ARCH),aarch64)
  PKG_HASH:=skip
else ifeq ($(ARCH),arm)
  ARM_CPU_FEATURES:=$(word 2,$(subst +,$(space),$(call qstrip,$(CONFIG_CPU_TYPE))))
  ifeq ($(ARM_CPU_FEATURES),)
    ARCH:=armel
    PKG_HASH:=skip
  else
    ARCH:=armhf
    PKG_HASH:=skip
  endif
else ifeq ($(ARCH),i386)
  PKG_HASH:=skip
else ifeq ($(ARCH),x86_64)
  PKG_HASH:=skip
endif

PKG_SOURCE:=ookla-speedtest-$(PKG_VERSION)-linux-$(ARCH).tgz
PKG_SOURCE_URL:=https://install.speedtest.net/app/cli

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)

PKG_MAINTAINER:=sbwml <admin@cooluc.com>

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
	SECTION:=net
	CATEGORY:=Network
	TITLE:=Speedtest CLI by Ookla
	DEPENDS:=@(aarch64||arm||i386||x86_64) +ca-certificates
	URL:=https://www.speedtest.net/
endef

define Package/$(PKG_NAME)/description
  The Global Broadband Speed Test
endef

define Build/Prepare
	( \
		pushd $(PKG_BUILD_DIR) ; \
			$(TAR) -zxf $(DL_DIR)/ookla-speedtest-$(PKG_VERSION)-linux-$(ARCH).tgz -C . ; \
		popd ; \
	)
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/speedtest $(1)/usr/bin
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
