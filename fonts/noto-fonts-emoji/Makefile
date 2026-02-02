include $(TOPDIR)/rules.mk

PKG_NAME:=noto-fonts-emoji
PKG_VERSION:=2.051
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL_FILE:=font-noto-emoji-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://github.com/googlefonts/noto-emoji/archive/v$(PKG_VERSION)/
PKG_HASH:=04f3d1e5605edebebac00a7a0becb390a4a3ead015066905b27935b30c18e745

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=OFL-1.1
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)-$(PKG_VERSION)/noto-emoji-$(PKG_VERSION)

include $(INCLUDE_DIR)/package.mk

define Package/noto-fonts-emoji
  TITLE:=noto-fonts-emoji
  SECTION:=fonts
  CATEGORY:=Fonts
  SUBMENU:=Noto
  URL:=https://github.com/googlefonts/noto-emoji
  PKGARCH:=all
endef

define Build/Compile
	true
endef

define Build/Configure
	true
endef

define Package/noto-fonts-emoji/install
	$(INSTALL_DIR) \
		$(1)/usr/share/fonts/noto

	$(INSTALL_DATA) \
		$(PKG_BUILD_DIR)/fonts/NotoColorEmoji.ttf \
		$(1)/usr/share/fonts/noto
endef

$(eval $(call BuildPackage,noto-fonts-emoji))
