include $(TOPDIR)/rules.mk

PKG_NAME:=boltbrowser
PKG_RELEASE:=2

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/br0xen/boltbrowser.git
PKG_SOURCE_DATE:=2023-05-31
PKG_SOURCE_VERSION:=65c868158373a3aa87427c98fbd89da2da2fdc7a
PKG_MIRROR_HASH:=skip

PKG_LICENSE:=GPL-3.0-or-later
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=Tianling Shen <cnsztl@immortalwrt.org>

PKG_BUILD_DEPENDS:=golang/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

GO_PKG:=github.com/br0xen/boltbrowser

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/golang/golang-package.mk

define Package/boltbrowser
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=A CLI Browser for BoltDB Files
  URL:=https://github.com/br0xen/boltbrowser
  DEPENDS:=$(GO_ARCH_DEPENDS)
endef

$(eval $(call GoBinPackage,boltbrowser))
$(eval $(call BuildPackage,boltbrowser))
