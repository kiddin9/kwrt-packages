
include $(TOPDIR)/rules.mk

PKG_VERSION:=1.0.0-20230829
PKG_RELEASE:=6
PKG_MAINTAINER:=forcedata

LUCI_TITLE:=LuCI support for forcedata
LUCI_PKGARCH:=all
LUCI_DEPENDS:= +luci-lib-taskd


define Package/luci-app-forcedata/conffiles
/etc/config/forcedata
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
