include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-nbtverify
PKG_VERSION:=1.0.0
PKG_RELEASE:=1

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

# 定义基础信息
define Package/nbtverify
    SECTION:=utils
    CATEGORY:=Utilities
    TITLE:=nbtverify
    DEPENDS:=+ipset +dnsmasq-full +curl
    URL:=https://www.nbtca.space/
    MAINTAINER:=nbtca
endef

# 描述信息
define Package/nbtverify/description
    This package contains LuCI configuration pages for nbtverify.
endef

# 安装方法
define Package/nbtverify/install
    $(INSTALL_DIR) $(1)/etc/config
    $(INSTALL_DIR) $(1)/etc/init.d
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/model/cbi
    $(INSTALL_DIR) $(1)/usr/lib/lua/luci/controller
    $(INSTALL_DIR) $(1)/usr/sbin

    $(INSTALL_CONF) ./files/etc/config/nbtverify $(1)/etc/config/nbtverify
    $(INSTALL_BIN) ./files/etc/init.d/nbtverify.sh $(1)/etc/init.d/nbtverify
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/model/cbi/nbtverify.lua $(1)/usr/lib/lua/luci/model/cbi/nbtverify.lua
    $(INSTALL_DATA) ./files/usr/lib/lua/luci/controller/nbtverify.lua $(1)/usr/lib/lua/luci/controller/nbtverify.lua
    $(INSTALL_BIN) ./files/usr/sbin/nbtverify $(1)/usr/sbin/nbtverify
endef

$(eval $(call BuildPackage,nbtverify))
