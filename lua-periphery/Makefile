include $(TOPDIR)/rules.mk

PKG_NAME:=lua-periphery
PKG_VERSION:=2.5.0
PKG_RELEASE:=5

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/vsergeev/lua-periphery.git
PKG_SOURCE_VERSION:=e91d515ebbf04bd4cfc10a3f4c7e1f12736350af
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Tianling Shen <cnsztl@immortalwrt.org>

PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=gc-sections

include $(INCLUDE_DIR)/package.mk

define Package/lua-periphery
  SUBMENU:=Lua
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=A Lua library for peripheral I/O in Linux
  URL:=https://github.com/vsergeev/lua-periphery
  DEPENDS:=+liblua
endef

define Package/lua-periphery/description
  lua-periphery is a library for GPIO, LED, PWM, SPI, I2C, MMIO, and
  Serial peripheral I/O interface access in userspace Linux.
endef

define Package/lua-periphery/install
	$(INSTALL_DIR) $(1)/usr/lib/lua
	$(CP) $(PKG_BUILD_DIR)/periphery.so* $(1)/usr/lib/lua/
endef

$(eval $(call BuildPackage,lua-periphery))
