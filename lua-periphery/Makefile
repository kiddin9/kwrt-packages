include $(TOPDIR)/rules.mk

PKG_NAME:=lua-periphery
PKG_VERSION:=2.4.3
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/vsergeev/lua-periphery.git
PKG_SOURCE_VERSION:=8de3894978a22a0d7d8f7d5df1bc15f006c7b822
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Tianling Shen <cnsztl@immortalwrt.org>

CMAKE_SOURCE_SUBDIR:=c-periphery
CMAKE_BINARY_SUBDIR:=c-periphery
PKG_BUILD_FLAGS:=gc-sections

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Package/lua-periphery
  SUBMENU:=Lua
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=A Lua library for peripheral I/O in Linux
  URL:=https://github.com/vsergeev/lua-periphery
  DEPENDS:=+lua
endef

define Package/lua-periphery/description
  lua-periphery is a library for GPIO, LED, PWM, SPI, I2C, MMIO, and
  Serial peripheral I/O interface access in userspace Linux.
endef

CMAKE_OPTIONS += -DBUILD_TESTS=OFF

define Build/Compile
	+$(NINJA) -C $(CMAKE_BINARY_DIR)
	$(CP) $(CMAKE_BINARY_DIR)/libperiphery.a $(CMAKE_BINARY_DIR)/periphery.a
	+$(MAKE_VARS) $(MAKE) $(PKG_JOBS) -C $(PKG_BUILD_DIR) $(MAKE_FLAGS)
endef

define Package/lua-periphery/install
	$(INSTALL_DIR) $(1)/usr/lib/lua
	$(CP) $(PKG_BUILD_DIR)/periphery.so* $(1)/usr/lib/lua/
endef

$(eval $(call BuildPackage,lua-periphery))
