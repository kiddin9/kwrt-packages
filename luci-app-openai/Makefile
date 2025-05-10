# Copyright (C) 2016 Openwrt.org
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-openai
PKG_VERSION:=1.0.0
PKG_RELEASE:=7

LUCI_TITLE:=LuCI support for OpenAI
LUCI_DEPENDS:=+openai +luci-compat

define Package/$(PKG_NAME)/postinst
#!/bin/sh
[ -n "${IPKG_INSTROOT}" ] || {
	( . /etc/uci-defaults/luci-openai ) && rm -f /etc/uci-defaults/luci-openai
	exit 0
}
endef

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
