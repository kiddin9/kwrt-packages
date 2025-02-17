# This is free software, licensed under the Apache License, Version 2.0 .

include $(TOPDIR)/rules.mk

PKG_LICENSE:=Apache-2.0

LUCI_TITLE:=LuCI support for chinadns-ng
LUCI_DEPENDS:=+chinadns-ng +wget-ssl

define Package/luci-app-chinadns-ng/conffiles
/etc/config/chinadns-ng
/etc/chinadns-ng/
endef

define Package/luci-app-chinadns-ng/postrm
#!/bin/sh
exec 2>/dev/null
rmdir --ignore-fail-on-non-empty /etc/chinadns-ng
(crontab -l | grep -v "chinadns-ng") | crontab -
exit 0
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature