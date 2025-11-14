
include $(TOPDIR)/rules.mk

PKG_NAME:=ssd1306
PKG_RELEASE:=1

PKG_SOURCE_DATE:=2024-10-11
PKG_SOURCE_VERSION:=19128ed4b6108408fea05b9d0551236b6d638dbc
PKG_SOURCE:=ssd1306_linux-$(PKG_SOURCE_DATE).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/armlabs/ssd1306_linux/tar.gz/$(PKG_SOURCE_VERSION)?
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/ssd1306
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=SSD1306 OLED I2C Driver
  URL:=https://github.com/armlabs/ssd1306_linux
endef

define Package/ssd1306/description
 SSD1306 oled I2C driver working in linux
endef

TAR_OPTIONS:=--strip-components 1 $(TAR_OPTIONS)
TAR_CMD=$(HOST_TAR) -C $(1) $(TAR_OPTIONS)

define Package/ssd1306/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/ssd1306 $(1)/usr/bin
endef

# Set variables used in the source's Makefile
MAKE_FLAGS+= BIN="ssd1306" LDFLAGS=""

$(eval $(call BuildPackage,ssd1306))
