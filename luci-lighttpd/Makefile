#
# Copyright (C) 2008-2014 The LuCI Team <luci@lists.subsignal.org>
#
# This is free software, licensed under the Apache License, Version 2.0 .
#

include $(TOPDIR)/rules.mk

LUCI_TYPE:=col
LUCI_BASENAME:=lighttpd

LUCI_TITLE:=LuCI Configuration Interface with Lighttpd as webserver
LUCI_DESCRIPTION:=Standard set including full admin with ppp support, package management and the default Bootstrap theme
LUCI_DEPENDS:= \
	+lighttpd +lighttpd-mod-alias +lighttpd-mod-cgi +lighttpd-mod-redirect +lighttpd-mod-mbedtls +luci-mod-admin-full +luci-theme-bootstrap \
	+luci-app-firewall +luci-app-package-manager +luci-proto-ppp +IPV6:luci-proto-ipv6 \
	+rpcd-mod-rrdns

PKG_LICENSE:=Apache-2.0

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
