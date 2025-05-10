include $(TOPDIR)/rules.mk

PKG_LICENSE:=GPLv3
PKG_MAINTAINER:=Yu <mukaiu@live.com>
PKG_VERSION:=2.0.3
PKG_RELEASE:=5

LUCI_TITLE:=Domain Proxy for redsocks.
LUCI_DESCRIPTION:=Domain Proxy for redsocks.
LUCI_DEPENDS:=+luci-base

define Package/luci-app-domain-proxy/conffiles
/etc/config/domain-proxy
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
