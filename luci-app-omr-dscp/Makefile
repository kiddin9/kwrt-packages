#
# Copyright (C) 2018-2019 Ycarus (Yannick Chabanois) <ycarus@zugaina.org>
#
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=LuCI Interface to DSCP
LUCI_DEPENDS:=+LINUX_5_4:omr-dscp +!LINUX_5_4:omr-dscp-nft
PKG_LICENSE:=GPLv3

#include $(TOPDIR)/feeds/luci/luci.mk
include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
