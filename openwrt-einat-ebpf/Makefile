# SPDX-License-Identifier: GPL-2.0-only
#
# Copyright (C) 2024-2026 Anya Lin <hukk1996@gmail.com>

include $(TOPDIR)/rules.mk

PKG_NAME:=einat-ebpf
PKG_UPSTREAM_VERSION:=0.1.10
PKG_UPSTREAM_GITHASH:=
PKG_VERSION:=$(PKG_UPSTREAM_VERSION)$(if $(PKG_UPSTREAM_GITHASH),~$(call version_abbrev,$(PKG_UPSTREAM_GITHASH)))
PKG_RELEASE:=57

PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_UPSTREAM_VERSION)
PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_SOURCE_SUBDIR)

ifeq ($(PKG_UPSTREAM_GITHASH),)
PKG_SOURCE_URL:=https://codeload.github.com/EHfive/einat-ebpf/tar.gz/refs/tags/v$(PKG_UPSTREAM_VERSION)?
PKG_HASH:=skip

PKG_SOURCE:=$(PKG_SOURCE_SUBDIR).tar.gz
else
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/EHfive/einat-ebpf.git
PKG_SOURCE_VERSION:=$(PKG_UPSTREAM_GITHASH)
PKG_MIRROR_HASH:=skip

PKG_SOURCE:=$(PKG_SOURCE_SUBDIR)-$(PKG_SOURCE_VERSION).tar.gz
endif

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=GPL-2.0-or-later GPL-2.0-only
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=rust/host libbpf HAS_BPF_TOOLCHAIN:bpf-headers
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

PKG_CONFIG_DEPENDS+= \
	CONFIG_EINAT_EBPF_IPV6 \
	CONFIG_EINAT_EBPF_BACKEND_LIBBPF \
	CONFIG_EINAT_EBPF_BINDGEN \
	CONFIG_EINAT_EBPF_STATIC \

RUST_PKG_FEATURES:=$(subst $(space),$(comma),$(strip \
	$(if $(CONFIG_EINAT_EBPF_IPV6),ipv6) \
	$(if $(CONFIG_EINAT_EBPF_BACKEND_LIBBPF),libbpf) \
	$(if $(CONFIG_EINAT_EBPF_BINDGEN),bindgen) \
	$(if $(CONFIG_EINAT_EBPF_STATIC),static) \
))

include $(INCLUDE_DIR)/bpf.mk
include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/rust/rust-package.mk

CARGO_PKG_VARS+= \
	BINDGEN_EXTRA_CLANG_ARGS=-I$(shell $(TARGET_CC_NOCACHE) -print-file-name=include)

# Don't ignore Cargo.lock
ifeq ($(shell grep -o 'RUST_PKG_LOCKED' $(TOPDIR)/feeds/packages/lang/rust/rust-package.mk 2>/dev/null),)
	Build/Compile:=$(call Build/Compile/Cargo,,--locked)
endif

# The LLVM_PATH var is required so that einat's build script finds llvm-strip
TARGET_PATH_PKG:=$(LLVM_PATH):$(TARGET_PATH_PKG)

# Platform-specific features
# $(TOPDIR)/feeds/packages/lang/rust/rust-values.mk
# RUST_ARCH_DEPENDS:=@(aarch64||arm||i386||i686||mips||mipsel||mips64||mips64el||powerpc64||riscv64||x86_64)
EINAT_EBPF_RUST_ARCH_DEPENDS:=@(aarch64||arm||i386||i686||powerpc64||riscv64||x86_64) # Architectures other than x86_64 and aarch64 have not been tested.

define Package/$(PKG_NAME)
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Routing and Redirection
  TITLE:=eBPF-based Endpoint-Independent NAT
  URL:=https://github.com/EHfive/einat-ebpf
  # You need enable KERNEL_DEBUG_INFO_BTF and disable KERNEL_DEBUG_INFO_REDUCED
  DEPENDS:=$(EINAT_EBPF_RUST_ARCH_DEPENDS) $(BPF_DEPENDS) \
    +kmod-sched-core +kmod-sched-bpf \
    +EINAT_EBPF_BACKEND_LIBBPF:libbpf \
    +@KERNEL_DEBUG_FS +@KERNEL_DEBUG_INFO_BTF
  USERID:=einat:einat
  PROVIDES:=einat
endef

define Package/$(PKG_NAME)/description
  This eBPF application implements an "Endpoint-Independent Mapping" and
  "Endpoint-Independent Filtering" NAT(network address translation) on
  TC egress and ingress hooks.
endef

define Package/$(PKG_NAME)/config
	menu "Features configuration"
		depends on PACKAGE_einat-ebpf

		config EINAT_EBPF_IPV6
			bool "Enable IPV6 NAT66 feature"
			default n
			help
			  It would increase load time of eBPF programs to
			  about 4 times.

		config EINAT_EBPF_BACKEND_LIBBPF
			bool "Enable libbpf backend"
			default y if (aarch64 || x86_64)
			default n
			help
			  Add fallback BPF loading backend: "libbpf".

		config EINAT_EBPF_BINDGEN
			bool "Enable bindgen"
			default y if !ARCH_64BIT
			default n
			help
			  Bindgen for libbpf headers, required on 32-bit
			  platforms.

		config EINAT_EBPF_STATIC
			bool "Enable static compile"
			default n
	endmenu
endef

define Package/$(PKG_NAME)/conffiles
/etc/config/einat
endef

define Package/$(PKG_NAME)/install
	$(CURDIR)/.prepare.sh $(VERSION) $(CURDIR) $(PKG_INSTALL_DIR)/bin/einat

	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/bin/einat $(1)/usr/bin/

	$(INSTALL_DIR) $(1)/etc/init.d/
	$(INSTALL_BIN) $(CURDIR)/files/einat.init $(1)/etc/init.d/einat

	$(INSTALL_DIR) $(1)/etc/config/
	$(INSTALL_CONF) $(CURDIR)/files/einat.config $(1)/etc/config/einat

	$(INSTALL_DIR) $(1)/etc/capabilities/
	$(INSTALL_CONF) $(CURDIR)/files/capabilities.json $(1)/etc/capabilities/einat.json
endef

$(eval $(call RustBinPackage,$(PKG_NAME)))
$(eval $(call BuildPackage,$(PKG_NAME)))
