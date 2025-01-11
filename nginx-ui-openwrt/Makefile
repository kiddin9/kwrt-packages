include $(TOPDIR)/rules.mk

PKG_NAME:=nginx-ui
PKG_VERSION:=2.0.0-beta.42
PKG_RELEASE:=1

PKG_SOURCE:=nginx-ui-linux-64.tar.gz
PKG_SOURCE_URL:=https://github.com/0xJacky/nginx-ui/releases/download/v$(PKG_VERSION)/
PKG_HASH:=skip

PKG_MAINTAINER:=kiddin9
PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/nginx-ui
  SECTION:=net
  CATEGORY:=Network
  TITLE:=Web UI for Nginx
  URL:=https://nginxui.com
  DEPENDS:=+nginx
endef

define Package/nginx-ui/description
  Nginx UI is a web interface for Nginx configuration management
endef

define Package/nginx-ui/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/etc/nginx-ui
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_DIR) $(1)/etc/nginx/sites-available
	$(INSTALL_DIR) $(1)/etc/nginx/sites-enabled
	
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/nginx-ui $(1)/usr/bin/
	$(INSTALL_CONF) ./files/etc/config/nginx-ui $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/nginx-ui $(1)/etc/init.d/
	$(INSTALL_CONF) ./files/etc/nginx-ui/app.ini $(1)/etc/nginx-ui/
	$(INSTALL_CONF) ./files/etc/nginx/nginx.conf $(1)/etc/nginx/
endef

define Package/nginx-ui/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	# 确保目录存在
	mkdir -p /etc/nginx/sites-available
	mkdir -p /etc/nginx/sites-enabled
	
	grep -q sites-enabled files/etc/nginx/nginx.conf || sed -i '/include conf\.d\/\*\.conf;/a 	include /etc/nginx/sites-enabled/*;' /etc/nginx/uci.conf.template
	
	# 禁用 UCI 集成
	uci set nginx.global.uci_enable='false'
	uci commit nginx
	
	# 重启 nginx 服务
	/etc/init.d/nginx restart
fi
exit 0
endef

$(eval $(call BuildPackage,nginx-ui))
