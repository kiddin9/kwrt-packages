#
# This is free software, licensed under the GNU General Public License v3.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=caddy
PKG_VERSION:=2.10.0
PKG_RELEASE:=16

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/caddyserver/caddy.git
PKG_SOURCE_DATE:=2025-04-28
PKG_SOURCE_VERSION:=aa3d20be3ee451af9465470a28937690104e9422
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=golang/host upx/host
PKG_BUILD_PARALLEL:=1
PKG_USE_MIPS16:=0
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/caddyserver/caddy/v2/cmd
GO_PKG_BUILD_PKG:=$(GO_PKG)/caddy
GO_PKG_LDFLAGS:=-s -w
GO_PKG_LDFLAGS_X:=github.com/caddyserver/caddy/v2.CustomVersion=v$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/$(PKG_NAME)
  TITLE:=Caddy is an open source web server
  URL:=https://caddyserver.com
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  DEPENDS:=$(GO_ARCH_DEPENDS) +libpthread
endef

define Package/$(PKG_NAME)/description
Caddy is an extensible server platform that uses TLS by default.
endef

define Build/Compile
	$(call GoPackage/Build/Compile)
	$(STAGING_DIR_HOST)/bin/upx --lzma --best $(GO_PKG_BUILD_BIN_DIR)/caddy
endef

define Package/caddy/install
	$(call GoPackage/Package/Install/Bin,$(1))
endef

$(eval $(call GoBinPackage,$(PKG_NAME)))
$(eval $(call BuildPackage,$(PKG_NAME)))
