include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for subconverter
LUCI_DEPENDS:=+subconverter +sub-web +luci-base
LUCI_PKGARCH:=all


define Package/luci-app-subconverter/conffiles
/etc/config/subconverter
/etc/subconverter/
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
