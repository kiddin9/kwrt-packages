# Copyright (C) 2016 Openwrt.org
# Copyright (C) 2024 iv7777 <hongba@rocketmail.com>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI support for Timewol
LUCI_PKGARCH:=all
LUCI_DEPENDS:=+etherwake

define Build/Prepare
	chmod +x root/etc/init.d/timewol >/dev/null 2>&1
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
