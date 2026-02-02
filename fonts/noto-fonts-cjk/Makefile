include $(TOPDIR)/rules.mk

PKG_NAME:=noto-fonts-cjk
PKG_VERSION:=20220127
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_SOURCE_URL_FILE:=font-noto-cjk-0_git$(PKG_VERSION).tar.xz
PKG_SOURCE_URL:=https://dev.alpinelinux.org/archive/font-noto-cjk/
PKG_HASH:=fa2551276a47c4a8fa15b451318a3e8e3aedb9b99f4f55028bd024a1f026bd13

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=OFL-1.1
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/font-noto-cjk-0_git$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/noto-fonts-cjk
  TITLE:=noto-fonts-cjk
  SECTION:=fonts
  CATEGORY:=Fonts
  SUBMENU:=Noto
  URL:=https://github.com/notofonts/noto-fonts
  PKGARCH:=all
endef

define Build/Compile
	true
endef

define Build/Configure
	true
endef

define Package/noto-fonts-cjk/install
	$(INSTALL_DIR) \
		$(1)/usr/share/fonts/noto

	$(INSTALL_DATA) \
		$(PKG_BUILD_DIR)/{NotoSansCJK-Bold.ttc,NotoSansCJK-Regular.ttc,NotoSerifCJK-Bold.ttc,NotoSerifCJK-Regular.ttc} \
		$(1)/usr/share/fonts/noto
endef

$(eval $(call BuildPackage,noto-fonts-cjk))
