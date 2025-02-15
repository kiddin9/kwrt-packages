include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Nginx UI
LUCI_DEPENDS:=+subconverter +sub-web +luci-base
LUCI_PKGARCH:=all


define Package/luci-app-subconverter/conffiles
/etc/config/subconverter
/etc/subconverter/
endef

define Package/luci-app-subconverter/postinst
#!/bin/sh
	chmod +x /etc/init.d/subconverter
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
