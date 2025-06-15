include $(TOPDIR)/rules.mk

PKG_NAME:=nginx-ui
PKG_VERSION:=2.1.6
PKG_RELEASE:=31

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
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

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

define Package/nginx-ui/conffiles
/etc/nginx-ui/
/etc/config/nginx-ui
endef

define Build/Prepare
	$(call Build/Prepare/Default)
	
	# 准备前端构建环境
	cd $(PKG_BUILD_DIR)/app && \
		npm install && \
		npm run build
endef

define Build/Compile
	cd $(PKG_BUILD_DIR) && \
	export GOOS=linux && \
	export GOARCH=$(GOARCH) && \
	export CGO_ENABLED=1 && \
	go generate cmd/version/generate.go && \
	go build -tags=jsoniter \
		-ldflags "-w --extldflags '-static' -X 'github.com/0xJacky/Nginx-UI/settings.buildTime=$(shell date +%s)'" \
		-o $(PKG_BUILD_DIR)/nginx-ui -v main.go
endef

define Package/nginx-ui/install
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/usr/bin
	
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/nginx-ui $(1)/usr/bin/
	$(INSTALL_CONF) ./files/etc/config/nginx-ui $(1)/etc/config/
	$(INSTALL_BIN) ./files/etc/init.d/nginx-ui $(1)/etc/init.d/
endef

define Package/nginx-ui/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	# 确保目录存在
	mkdir -p /etc/nginx/sites-available
	mkdir -p /etc/nginx/sites-enabled
	mkdir -p /etc/nginx/streams-available
	mkdir -p /etc/nginx/streams-enabled

	ln -sf /etc/nginx/uci.conf /etc/nginx/nginx.conf

	grep -q sites-enabled files/etc/nginx/uci.conf.template || sed -i '/include conf\.d\/\*\.conf;/a 	include /etc/nginx/sites-enabled/*;' /etc/nginx/uci.conf.template;
	/etc/init.d/nginx restart
	
fi
exit 0
endef

$(eval $(call BuildPackage,nginx-ui))
