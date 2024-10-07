include $(TOPDIR)/rules.mk

PKG_NAME:=thunder

PKG_VERSION:=1.0.3
PKG_RELEASE:=2

PKG_LICENSE:=MIT
PKG_MAINTAINER:=gngpp <gngppz@gmail.com>

PKG_SOURCE:=thunder-$(PKG_VERSION)-$(ARCH)-unknown-linux-musl.tar.gz
PKG_SOURCE_URL:=https://github.com/gngpp/thunder/releases/download/v$(PKG_VERSION)/
PKG_HASH:=skip
STRIP:=false

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=thunder
  DEPENDS:=@(aarch64||x86_64) +USE_GLIBC:libpthread +libgcc +libstdcpp
  URL:=https://nas.xunlei.com/
endef

define Package/$(PKG_NAME)/description
  Synology Nas Thunder runs on OpenWrt
endef

define Download/sha256sum
	FILE:=$(PKG_SOURCE).sha256
	URL_FILE:=$(FILE)
	URL:=$(PKG_SOURCE_URL)
	HASH:=skip
endef
$(eval $(call Download,sha256sum))

define Build/Prepare
	mv $(DL_DIR)/$(PKG_SOURCE).sha256 .
	cp $(DL_DIR)/$(PKG_SOURCE) .
	shasum -a 256 -c $(PKG_SOURCE).sha256
	rm $(PKG_SOURCE).sha256 $(PKG_SOURCE)

	tar -xvf $(DL_DIR)/$(PKG_SOURCE)
	mv thunder $(PKG_BUILD_DIR)/
endef

define Build/Compile
	echo "nas thunder using precompiled binary."
endef

define Package/$(PKG_NAME)/postrm
#!/bin/sh
  rm -rf /usr/share/thunder
  rm -rf /usr/syno
  exit 0
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
  /etc/init.d/thunder disable && /etc/init.d/thunder enable
  exit 0	
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/thunder $(1)/usr/bin/thunder
	$(INSTALL_DIR) $(1)/usr/share/thunder
	$(INSTALL_DIR) $(1)/usr/share/thunder/target
	$(INSTALL_DIR) $(1)/usr/share/thunder/target/host
	$(INSTALL_DIR) $(1)/usr/share/thunder/target/etc

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) $(CURDIR)/files/thunder.init $(1)/etc/init.d/thunder
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) $(CURDIR)/files/thunder.config $(1)/etc/config/thunder

ifeq ($(CONFIG_USE_MUSL),y)
	$(INSTALL_DIR) $(1)/usr/share/thunder/target/host/exploit
	$(INSTALL_BIN) $(CURDIR)/exploit/libc.so.6 $(1)/usr/share/thunder/target/host/exploit/libc.so.6
	$(INSTALL_BIN) $(CURDIR)/exploit/libdl.so.2 $(1)/usr/share/thunder/target/host/exploit/libdl.so.2
	$(INSTALL_BIN) $(CURDIR)/exploit/libm.so.6 $(1)/usr/share/thunder/target/host/exploit/libm.so.6
	$(INSTALL_BIN) $(CURDIR)/exploit/libstdc++.so.6 $(1)/usr/share/thunder/target/host/exploit/libstdc++.so.6
	$(INSTALL_BIN) $(CURDIR)/exploit/libpthread.so.0 $(1)/usr/share/thunder/target/host/exploit/libpthread.so.0
endif
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
