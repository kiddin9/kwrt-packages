include $(TOPDIR)/rules.mk

PKG_NAME:=homebox
PKG_VERSION:=0.0.0-dev.2024101306
PKG_RELEASE:=21

ifeq ($(ARCH),aarch64)
	H_ARCH:=arm64

else ifeq ($(ARCH),arm)
	H_ARCH:=arm

else ifeq ($(ARCH),i386)
	H_ARCH:=386

else ifeq ($(ARCH),mips)
	H_ARCH:=mips

else ifeq ($(ARCH),mipsel)
	H_ARCH:=mips

else ifeq ($(ARCH),x86_64)
	H_ARCH:=amd64
endif

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  TITLE:=A Toolbox for Home Local Networks Speed Test
  URL:=https://github.com/XGHeaven/homebox
  DEPENDS:=@(i386||x86_64||arm||aarch64||mipsel||mips) +libstdcpp
endef

define Package/$(PKG_NAME)/description
  A Toolbox for Home Local Networks Speed Test
endef

define Build/Prepare
	mkdir -p $(PKG_BUILD_DIR)
	[ ! -f $(PKG_BUILD_DIR)/server-linux-$(H_ARCH).tar.gz ] && wget https://github.com/XGHeaven/homebox/releases/download/v$(PKG_VERSION)/server-linux-$(H_ARCH).tar.gz -O $(PKG_BUILD_DIR)/server-linux-$(H_ARCH).tar.gz
	tar -xzvf $(PKG_BUILD_DIR)/server-linux-$(H_ARCH).tar.gz -C $(PKG_BUILD_DIR)
endef

define Build/Compile
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/bin $(1)/etc/config $(1)/etc/init.d $(1)/etc/uci-defaults
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/server-linux-$(H_ARCH) $(1)/usr/bin/homebox
	$(INSTALL_CONF) ./files/homebox.config $(1)/etc/config/homebox
	$(INSTALL_BIN) ./files/homebox.init $(1)/etc/init.d/homebox
	$(INSTALL_BIN) ./files/homebox.uci-default $(1)/etc/uci-defaults/homebox
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
