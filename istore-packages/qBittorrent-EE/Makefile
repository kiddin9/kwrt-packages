
include $(TOPDIR)/rules.mk

PKG_NAME:=qBittorrent-EE
PKG_VERSION:=4.6.7.10
PKG_RELEASE=1
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/src

ifeq ($(ARCH),x86_64)
	QBEE_ARCH:=x86_64
	QBEE_HASH:=a95dca7b55a8139186b7c5da3181cced0007a7eeab8f64e4d85c6628c9a58707
endif

ifeq ($(ARCH),aarch64)
	QBEE_ARCH:=aarch64
	QBEE_HASH:=9b66aac409a8f5326520fd379a996821ae94a0b35ec38d1e0b1e33e0468d9f17
endif

PKG_SOURCE_URL_FILE:=qbittorrent-enhanced-nox_$(QBEE_ARCH)-linux-musl_static.zip
PKG_SOURCE:=qbittorrent-enhanced-nox_v$(PKG_VERSION)_$(QBEE_ARCH)-linux-musl_static.zip
PKG_SOURCE_URL:=https://github.com/c0re100/qBittorrent-Enhanced-Edition/releases/download/release-$(PKG_VERSION)/
PKG_HASH:=$(QBEE_HASH)

include $(INCLUDE_DIR)/package.mk

define Package/qBittorrent-EE
  SECTION:=net
  CATEGORY:=Network
  DEPENDS:=@(aarch64||x86_64)
  SUBMENU:=BitTorrent
  TITLE:=qBittorrent Enhanced Edition
  URL:=https://github.com/c0re100/qBittorrent-Enhanced-Edition/
endef

define Package/qBittorrent-EE/description
  qBittorrent is a bittorrent client programmed in C++ / Qt that uses
  libtorrent (sometimes called libtorrent-rasterbar) by Arvid Norberg.
  It aims to be a good alternative to all other bittorrent clients out
  there. qBittorrent is fast, stable and provides unicode support as
  well as many features. (Enhanced Edition)
endef

define Build/Prepare
	rm -f $(PKG_BUILD_DIR)/../qbittorrent-nox
	$(call Build/Prepare/Default)
endef

define Build/Compile
endef

define Package/qBittorrent-EE/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/../qbittorrent-nox $(1)/usr/bin/qbittorrent-ee-nox
endef

$(eval $(call BuildPackage,qBittorrent-EE))
