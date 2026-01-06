# SPDX-License-Identifier: MIT
#
# Copyright (C) 2023-2026 Anya Lin <hukk1996@gmail.com>

include $(TOPDIR)/rules.mk

PKG_UPSTREAM_NAME:=natmap
PKG_NAME:=natmapt
PKG_UPSTREAM_VERSION:=20250924
PKG_UPSTREAM_GITHASH:=
PKG_VERSION:=$(PKG_UPSTREAM_VERSION)$(if $(PKG_UPSTREAM_GITHASH),~$(call version_abbrev,$(PKG_UPSTREAM_GITHASH)))
PKG_RELEASE:=71
SCRIPTS_VERSION:=0.2025.11.16

PKG_SOURCE_SUBDIR:=$(PKG_UPSTREAM_NAME)-$(PKG_UPSTREAM_VERSION)
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_SOURCE_SUBDIR)

ifeq ($(PKG_UPSTREAM_GITHASH),)
PKG_SOURCE_URL:=https://github.com/heiher/natmap/releases/download/$(PKG_UPSTREAM_VERSION)
PKG_HASH:=skip

PKG_SOURCE:=$(PKG_SOURCE_SUBDIR).tar.xz
else
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/heiher/natmap.git
PKG_SOURCE_VERSION:=4b6db4e60f0b80f5dab60c4e030b4a64c550de25
PKG_MIRROR_HASH:=skip

PKG_SOURCE:=$(PKG_SOURCE_SUBDIR)-$(PKG_SOURCE_VERSION).tar.gz
endif

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>, Richard Yu <yurichard3839@gmail.com>, Ray Wang <r@hev.cc>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=License

PKG_USE_MIPS16:=0
PKG_BUILD_FLAGS:=no-mips16
PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk

define Package/natmapt
  SECTION:=net
  CATEGORY:=Network
  TITLE:=TCP/UDP port mapping tool for full cone NAT
  URL:=https://github.com/heiher/natmap
  DEPENDS:=+curl +jsonfilter +bash
endef

MAKE_FLAGS += REV_ID="$(PKG_VERSION)"

define Package/natmapt/conffiles
/etc/config/natmap
endef

define Package/natmapt/prerm
#!/bin/sh
rm -f "$$IPKG_INSTROOT/usr/bin/natmap-curl"
exit 0
endef

define Package/natmapt/install
	$(CURDIR)/.prepare.sh $(VERSION) $(CURDIR) $(PKG_BUILD_DIR)/bin/natmap
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/bin/natmap $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/usr/lib/natmap/
	$(INSTALL_BIN) ./files/natmap-update.sh $(1)/usr/lib/natmap/update.sh
	$(INSTALL_BIN) ./files/common.sh $(1)/usr/lib/natmap/common.sh
	$(INSTALL_DIR) $(1)/etc/config/
	$(INSTALL_CONF) ./files/natmap.config $(1)/etc/config/natmap
	$(INSTALL_DIR) $(1)/etc/init.d/
	$(INSTALL_BIN) ./files/natmap.init $(1)/etc/init.d/natmap
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_BIN) ./files/natmap.defaults $(1)/etc/uci-defaults/97_natmap
	$(INSTALL_DIR) $(1)/etc/natmap/client
	$(INSTALL_BIN) ./files/client/qBittorrent $(1)/etc/natmap/client/
	$(LN)          qBittorrent                $(1)/etc/natmap/client/qBittorrent-announce_port
	$(INSTALL_DIR) $(1)/etc/natmap/notify
	$(INSTALL_BIN) ./files/notify/ntfy $(1)/etc/natmap/notify/
	$(INSTALL_DIR) $(1)/etc/natmap/ddns
	$(INSTALL_BIN) ./files/ddns/Cloudflare $(1)/etc/natmap/ddns/
endef

define Package/natmapt-scripts/Default
	SECTION:=net
	CATEGORY:=Network
	TITLE:=NATMap $(1) scripts ($(2))
	DEPENDS:=+natmapt
	PROVIDES:=@natmapt-$(1)-scripts-$(2)
	VERSION:=$(SCRIPTS_VERSION)
	PKGARCH:=all
endef

define Package/natmapt-scripts/install/Default
	$(INSTALL_DIR) $(1)/etc/natmap/$(2)
	$(INSTALL_BIN) ./files/$(2)/$(3) $(1)/etc/natmap/$(2)/
endef

define Package/natmapt-client-script-transmission
	$(call Package/natmapt-scripts/Default,client,Transmission)
	DEPENDS+:=
endef
define Package/natmapt-client-script-transmission/install
	$(call Package/natmapt-scripts/install/Default,$(1),client,Transmission)
endef

define Package/natmapt-client-script-deluge
	$(call Package/natmapt-scripts/Default,client,Deluge)
	DEPENDS+:=
endef
define Package/natmapt-client-script-deluge/install
	$(call Package/natmapt-scripts/install/Default,$(1),client,Deluge)
endef

define Package/natmapt-notify-script-pushbullet
	$(call Package/natmapt-scripts/Default,notify,Pushbullet)
	DEPENDS+:=
endef
define Package/natmapt-notify-script-pushbullet/install
	$(call Package/natmapt-scripts/install/Default,$(1),notify,Pushbullet)
endef

define Package/natmapt-notify-script-pushover
	$(call Package/natmapt-scripts/Default,notify,Pushover)
	DEPENDS+:=
endef
define Package/natmapt-notify-script-pushover/install
	$(call Package/natmapt-scripts/install/Default,$(1),notify,Pushover)
endef

define Package/natmapt-notify-script-telegram
	$(call Package/natmapt-scripts/Default,notify,Telegram)
	DEPENDS+:=
endef
define Package/natmapt-notify-script-telegram/install
	$(call Package/natmapt-scripts/install/Default,$(1),notify,Telegram)
endef

$(eval $(call BuildPackage,natmapt))
$(eval $(call BuildPackage,natmapt-client-script-transmission))
$(eval $(call BuildPackage,natmapt-client-script-deluge))
$(eval $(call BuildPackage,natmapt-notify-script-pushbullet))
$(eval $(call BuildPackage,natmapt-notify-script-pushover))
$(eval $(call BuildPackage,natmapt-notify-script-telegram))
