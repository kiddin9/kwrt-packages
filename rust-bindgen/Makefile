# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2025 ImmortalWrt.org

include $(TOPDIR)/rules.mk

PKG_NAME:=rust-bindgen
PKG_VERSION:=0.72.1
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/rust-lang/rust-bindgen/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=skip

PKG_MAINTAINER:=Tianling Shen <cnsztl@immortalwrt.org>
PKG_LICENSE:=BSD-3-Clause
PKG_LICENSE_FILES:=LICENSE

HOST_BUILD_DEPENDS:=rust/host
HOST_BUILD_PARALLEL:=1
PKG_HOST_ONLY:=1

include $(INCLUDE_DIR)/host-build.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/rust/rust-host-build.mk

define Package/bindgen-cli
  SECTION:=lang
  CATEGORY:=Languages
  SUBMENU:=Rust
  TITLE:=Automatically generates Rust FFI bindings to C (and some C++) libraries
  URL:=https://github.com/rust-lang/rust-bindgen
  DEPENDS:=$(RUST_ARCH_DEPENDS)
  BUILDONLY:=1
endef

define Package/bindgen-cli/description
  bindgen automatically generates Rust FFI bindings to C
  (and some C++) libraries.
endef

HOST_MAKE_PATH:=bindgen-cli

$(eval $(call RustBinHostBuild))
$(eval $(call HostBuild))
$(eval $(call BuildPackage,bindgen-cli))
