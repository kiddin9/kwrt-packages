#
# Copyright (C) 2019 OpenWrt.org
#
# KFERMercer <KFER.Mercer@gmail.com>
#
# This is free software, licensed under the GNU General Public License v3.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=baidupcs-web
PKG_VERSION:=3.7.4-nnew
PKG_RELEASE:=$(AUTORELEASE)

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/Erope/BaiduPCS-Go/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=6efd1c5e4cf5cf876204bed246c70ea0212ad078d4eb7703d7f1179b39551d1d
PKG_BUILD_DIR:=$(BUILD_DIR)/BaiduPCS-Go-$(PKG_VERSION)

PKG_LICENSE:=Apache-2.0
PKG_LICENSE_FILES:=LICENSE

PKG_CONFIG_DEPENDS:= \
	CONFIG_BAIDUPCS_WEB_COMPRESS_GOPROXY \
	CONFIG_BAIDUPCS_WEB_COMPRESS_UPX

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_USE_MIPS16:=0

GO_PKG:=github.com/Erope/BaiduPCS-Go
GO_PKG_LDFLAGS:=-s -w
GO_PKG_LDFLAGS_X:=main.Version=v$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/$(PKG_NAME)
	SECTION:=net
	CATEGORY:=Network
	TITLE:=BaiduPCS-Web is a web controller for BaiduPCS-Go
	URL:=https://github.com/Erope/BaiduPCS-Go
	DEPENDS:=$(GO_ARCH_DEPENDS)
endef

define Package/$(PKG_NAME)/description
BaiduPCS-Web is a web controller for BaiduPCS-Go
endef

define Package/$(PKG_NAME)/config
config BAIDUPCS_WEB_COMPRESS_GOPROXY
	bool "Compiling with GOPROXY proxy"
	default n

config BAIDUPCS_WEB_COMPRESS_UPX
	bool "Compress executable files with UPX"
	default y
endef

ifeq ($(CONFIG_BAIDUPCS_WEB_COMPRESS_GOPROXY),y)
	export GO111MODULE=on
	export GOPROXY=https://goproxy.baidu.com
endif

define Build/Compile
( \
  GOOS=$$$$(go env GOOS) GOARCH=$$$$(go env GOARCH) go get -v github.com/GeertJohan/go.rice/rice/... ; \
  cd $(PKG_BUILD_DIR)/internal/pcsweb ; \
  "$$$$(go env GOPATH)/bin/rice" embed-go ; \
)
	$(call GoPackage/Build/Compile)
ifeq ($(CONFIG_BAIDUPCS_WEB_COMPRESS_UPX),y)
	upx --lzma --best $(GO_PKG_BUILD_BIN_DIR)/BaiduPCS-Go
endif
endef

define Package/$(PKG_NAME)/install
	$(call GoPackage/Package/Install/Bin,$(PKG_INSTALL_DIR))
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(GO_PKG_BUILD_BIN_DIR)/BaiduPCS-Go $(1)/usr/bin/$(PKG_NAME)
endef

$(eval $(call GoBinPackage,$(PKG_NAME)))
$(eval $(call BuildPackage,$(PKG_NAME)))
