#
# Copyright (C) 2017-2024
#
# This is free software, licensed under the GNU General Public License v2.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=filebrowser
PKG_VERSION:=1.1.1-stable
PKG_RELEASE=1

ifeq ($(ARCH),aarch64)
	PKG_ARCH:=arm64
	PKG_HASH:=skip
else ifeq ($(ARCH),arm)
	PKG_ARCH:=armv7
	PKG_HASH:=skip
else ifeq ($(ARCH),x86_64)
	PKG_ARCH:=amd64
	PKG_HASH:=skip
endif

include $(INCLUDE_DIR)/package.mk

define Package/filebrowser
  SECTION:=net
  CATEGORY:=Network
  DEPENDS:=@(arm||aarch64||x86_64)
  TITLE:=FileBrowser Quantum
endef

define Package/filebrowser/description
  The best free self-hosted web-based file manager.
endef

PKG_SOURCE:=linux-$(PKG_ARCH)-filebrowser
PKG_SOURCE_URL:=https://github.com/gtsteffaniak/filebrowser/releases/download/v$(PKG_VERSION)

define Build/Prepare
	$(call Build/Prepare/Default)
endef

define Build/Compile
endef

define Package/filebrowser/conffiles
/etc/filebrowser/
/etc/config/filebrowser
endef

define Package/filebrowser/install
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(CURDIR)/files/filebrowser.init $(1)/etc/init.d/filebrowser
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(CURDIR)/files/filebrowser.config $(1)/etc/config/filebrowser
	$(INSTALL_DIR) $(1)/etc/filebrowser
	$(INSTALL_CONF) $(CURDIR)/files/config.yaml $(1)/etc/filebrowser/config.yaml
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) $(DL_DIR)/linux-$(PKG_ARCH)-filebrowser $(1)/usr/bin/filebrowser
endef

$(eval $(call BuildPackage,filebrowser))
