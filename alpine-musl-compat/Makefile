include $(TOPDIR)/rules.mk

PKG_NAME:=alpine-musl-compat
PKG_VERSION:=0.0.1
PKG_RELEASE:=1

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>

include $(INCLUDE_DIR)/package.mk

define Package/alpine-musl-compat
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=Alpine Linux musl compatibility
  DEPENDS:=+libc
endef

define Build/Compile
	true
endef

define Build/Configure
	true
endef

define Package/alpine-musl-compat/install
	$(INSTALL_DIR) $(1)/lib
	$(LN) libc.so $(1)/lib/libc.musl-$(ARCH).so.1
endef

$(eval $(call BuildPackage,alpine-musl-compat))
