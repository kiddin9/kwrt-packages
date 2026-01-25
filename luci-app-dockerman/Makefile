include $(TOPDIR)/rules.mk

PKG_FLAGS:=hold

LUCI_TITLE:=LuCI Support for docker
LUCI_DEPENDS:=@(aarch64||arm||x86_64) \
	+luci-base \
	+luci-compat \
	+luci-lib-docker \
	+docker +dockerd \
	+ttyd \
	+dockerd \
	+docker-compose

PKG_LICENSE:=AGPL-3.0
PKG_MAINTAINER:=lisaac <lisaac.cn@gmail.com> \
		Florian Eckert <fe@dev.tdt.de>

PKG_VERSION:=0.5.13.20250109
PKG_RELEASE:=42

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
