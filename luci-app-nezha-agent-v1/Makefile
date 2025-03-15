#
# <https://github.com/Erope/openwrt_nezha/>
# 
# Copyright (C) 2021 zPonds <admin@shinenet.cn>
# Copyright (C) 2020 KFERMercer <KFER.Mercer@gmail.com>
# Copyright (C) 2020 [CTCGFW] Project OpenWRT
# 
# THIS IS FREE SOFTWARE, LICENSED UNDER GPLv3.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-nezha-agent-v1
LUCI_TITLE:=LuCI support for Nezha Agent
LUCI_DEPENDS:=+nezha-agent +lyaml
LUCI_PKGARCH:=all
PKG_VERSION:=3.0
PKG_RELEASE:=2
PKG_MAINTAINER:=<https://github.com/dysf888/OpenWRT_NeZha_V1>


include $(TOPDIR)/feeds/luci/luci.mk

define Package/$(PKG_NAME)/postinst
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	chmod 755 /etc/init.d/nezha-agent >/dev/null 2>&1
	/etc/init.d/nezha-agent enable >/dev/null 2>&1
fi
exit 0
endef

define Package/$(PKG_NAME)/prerm
#!/bin/sh
if [ -z "$${IPKG_INSTROOT}" ]; then
	/etc/init.d/nezha-agent disable >/dev/null 2>&1
	/etc/init.d/nezha-agent stop >/dev/null 2>&1
fi
exit 0
endef

# call BuildPackage - OpenWrt buildroot signature
