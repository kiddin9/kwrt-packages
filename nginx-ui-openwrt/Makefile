include $(TOPDIR)/rules.mk

PKG_NAME:=nginx-ui
PKG_VERSION:=2.0.0-beta.42
PKG_RELEASE:=2

PKG_SOURCE:=v$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/0xJacky/nginx-ui/archive/refs/tags/
PKG_HASH:=skip

PKG_BUILD_DEPENDS:=node/host golang/host
PKG_BUILD_PARALLEL:=1
PKG_USE_MIPS16:=0

PKG_LICENSE:=AGPL-3.0-only
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Kiddin9

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/golang.mk

define Package/nginx-ui
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=Web UI for Nginx
  URL:=https://nginxui.com
  DEPENDS:=+nginx-ssl
endef

define Package/nginx-ui/description
  Nginx UI is a web interface for Nginx configuration management
endef

define Build/Prepare
	$(call Build/Prepare/Default)
	
	# 设置 GOPATH
	$(INSTALL_DIR) $(PKG_BUILD_DIR)/go
	export GOPATH=$(PKG_BUILD_DIR)/go
	
	# 准备前端构建环境
	cd $(PKG_BUILD_DIR)/app && \
		npm install && \
		npm run build
endef

define Build/Compile
	cd $(PKG_BUILD_DIR) && \
		export GOOS=linux && \
		export GOARCH=$(GOLANG_ARCH) && \
		export CGO_ENABLED=0 && \
		export BUILD_TIME=$(shell date +%s) && \
		go build -tags=jsoniter \
			-ldflags "-s -w \
				-X 'github.com/0xJacky/Nginx-UI/settings.buildTime=$(BUILD_TIME)'" \
			-o $(PKG_BUILD_DIR)/nginx-ui -v main.go
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
