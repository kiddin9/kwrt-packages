

include $(TOPDIR)/rules.mk

PKG_NAME:=gcompat
PKG_VERSION:=1.1.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://git.adelielinux.org/adelie/gcompat/-/archive/$(PKG_VERSION)/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=NCSA
PKG_LICENSE_FILES:=LICENSE

PKG_INSTALL:=1

include $(INCLUDE_DIR)/package.mk

LINKER_ARCH:=$(ARCH)
LOADER_NAME:=ld-linux-$(ARCH).so.1
ifeq ($(ARCH),x86)
LINKER_ARCH=i386
LOADER_NAME=ld-linux.so.2
endif
ifeq ($(ARCH),x86_64)
LOADER_NAME=ld-linux-x86-64.so.2
endif
ifneq ($(filter armhf armv7,$(ARCH)),)
LINKER_ARCH=arm
LOADER_NAME=ld-linux-armhf.so.3
endif

define Package/gcompat
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=GNU C Library compatibility layer for musl
  URL:=https://git.adelielinux.org/adelie/gcompat
  DEPENDS:=@USE_MUSL +musl-obstack +libucontext
endef

define Package/gcompat/description
The gcompat provides glibc-compatible APIs for use on musl libc systems.
endef

define Package/gcompat/install
	$(INSTALL_DIR) $(1)/lib

	$(CP) $(PKG_INSTALL_DIR)/lib/$(LOADER_NAME) $(1)/lib
	$(CP) $(PKG_INSTALL_DIR)/lib/libgcompat.so.0 $(1)/lib

	for i in libc.so.6 libcrypt.so.1 libm.so.6 libpthread.so.0 libresolv.so.2 librt.so.1 libutil.so.1; do \
		$(LN) libgcompat.so.0 "$(1)/lib/$$$$i"; \
	done

endef

MAKE_FLAGS+= \
	LINKER_PATH="/lib/ld-musl-$(LINKER_ARCH).so.1" \
	LOADER_NAME=$(LOADER_NAME) \
	WITH_LIBUCONTEXT=1 \
	WITH_OBSTACK=musl-obstack


$(eval $(call BuildPackage,gcompat))
