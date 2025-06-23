
include $(TOPDIR)/rules.mk

PKG_NAME:=nvtop
PKG_VERSION:=3.2.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/Syllo/$(PKG_NAME)/tar.gz/$(PKG_VERSION)?
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=GPL-3.0+

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Package/nvtop
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=NVTOP
  DEPENDS:=@(aarch64||x86_64) +libncursesw +libudev +libdrm
endef

define Package/nvtop/description
  NVTOP stands for Neat Videocard TOP, a (h)top like task monitor for GPUs and accelerators
endef

TARGET_CFLAGS += -I$(STAGING_DIR)/usr/include

# OpenWRT libdrm does not support AMDGPU
CMAKE_OPTIONS += \
	-DUSE_LIBUDEV_OVER_LIBSYSTEMD=ON \
	-DAMDGPU_SUPPORT=OFF \
	-DAPPLE_SUPPORT=OFF \
	-DNVIDIA_SUPPORT=OFF \
	-DASCEND_SUPPORT=OFF \
	-DTPU_SUPPORT=OFF

ifdef CONFIG_aarch64
	CMAKE_OPTIONS += \
		-DPANFROST_SUPPORT=ON \
		-DPANTHOR_SUPPORT=ON \
		-DINTEL_SUPPORT=OFF
else
	CMAKE_OPTIONS += \
		-DPANFROST_SUPPORT=OFF \
		-DPANTHOR_SUPPORT=OFF \
		-DINTEL_SUPPORT=ON \
		-DV3D_SUPPORT=OFF
endif

define Package/nvtop/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/nvtop $(1)/usr/bin/
endef

$(eval $(call BuildPackage,nvtop))
