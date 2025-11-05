#
# Copyright (C) 2008-2014 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI for Zerotier
LUCI_DEPENDS:=+zerotier
LUCI_PKGARCH:=all
PKG_VERSION:=1.3.0-1
PKG_RELEASE:=

include $(TOPDIR)/feeds/luci/luci.mk

define Package/luci-app-zerotier/prerm
#!/bin/sh

[ -z "$${IPKG_INSTROOT}" ] || exit 0

uci -q batch <<-EOF >/dev/null
	delete ucitrack.@zerotier[-1]
	add ucitrack zerotier
	set ucitrack.@zerotier[-1].init=zerotier
	commit ucitrack
	delete firewall.zerotier
	commit firewall
EOF

/etc/init.d/zerotier enable
/etc/init.d/luci_zerotier disable
/etc/init.d/luci_zerotier stop
exit 0
endef

define Package/luci-app-zerotier/conffiles
/etc/config/zero
endef

# call BuildPackage - OpenWrt buildroot signature
