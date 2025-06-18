# SPDX-License-Identifier: MIT
#
# Copyright (C) 2024 Anya Lin <hukk1996@gmail.com>

include $(TOPDIR)/rules.mk

PKG_NAME:=shadowsocks-rust
PKG_VERSION:=1.23.4
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/shadowsocks/shadowsocks-rust/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=skip

PKG_MAINTAINER:=Anya Lin <hukk1996@gmail.com>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

PKG_BUILD_DEPENDS:=rust/host
PKG_BUILD_PARALLEL:=1
PKG_BUILD_FLAGS:=no-mips16

PKG_CONFIG_DEPENDS:= \
	CONFIG_SS_RUST_HICKORY_DNS \
	CONFIG_SS_RUST_LOCAL_HTTP \
	CONFIG_SS_RUST_LOCAL_TUNNEL \
	CONFIG_SS_RUST_LOCAL_SOCKS4 \
	CONFIG_SS_RUST_LOCAL_REDIR \
	CONFIG_SS_RUST_LOCAL_DNS \
	CONFIG_SS_RUST_LOCAL_FAKE_DNS \
	CONFIG_SS_RUST_LOCAL_TUN \
	CONFIG_SS_RUST_LOCAL_ONLINE_CONFIG \
	CONFIG_SS_RUST_AEAD_CIPHER_EXTRA \
	CONFIG_SS_RUST_AEAD_CIPHER_2022 \
	CONFIG_SS_RUST_AEAD_CIPHER_2022_EXTRA \

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/rust/rust-package.mk

# Don't ignore Cargo.lock
Build/Compile:=$(call Build/Compile/Cargo,,--locked)

# Platform-specific features
# $(TOPDIR)/feeds/packages/lang/rust/rust-values.mk
RUST_ARCH_DEPENDS:=@(aarch64||arm||i386||i686||powerpc64||riscv64||x86_64)

define Package/shadowsocks-rust/Default
  TITLE_sslocal:=client provides HTTP/SOCKS proxy, port forwarding, transparent proxy and tun.
  TITLE_ssserver:=
  TITLE_ssmanager:=server manager.
  TITLE_ssservice:=single bundled of local,server,manager. also used to generate safed secured password.
  TITLE_ssurl:=for encoding/decoding SIP002 URLs.
  LN_sslocal:=y
  LN_ssserver:=y
  LN_ssmanager:=y

  define Package/shadowsocks-rust-$(1)
    SECTION:=net
    CATEGORY:=Network
    SUBMENU:=Web Servers/Proxies
    TITLE:=shadowsocks-rust $(1). $$(TITLE_$(1))
    URL:=https://github.com/shadowsocks/shadowsocks-rust
    DEPENDS:=$$(RUST_ARCH_DEPENDS) $$(if $$(LN_$(1)),+shadowsocks-rust-ssservice)
  endef

  define Package/shadowsocks-rust-$(1)/install
	$$(INSTALL_DIR) $$(1)/usr/bin/
	$$(if $$(LN_$(1)), \
	$$(LN) ssservice $$(1)/usr/bin/$(1), \
	$$(INSTALL_BIN) $$(PKG_INSTALL_DIR)/bin/$(1) $$(1)/usr/bin/ )
  endef
endef

define Package/shadowsocks-rust-config
  SECTION:=net
  CATEGORY:=Network
  SUBMENU:=Web Servers/Proxies
  TITLE:=shadowsocks-rust config scripts
  URL:=https://github.com/shadowsocks/shadowsocks-rust
  DEPENDS:= +shadowsocks-rust-ssservice #+shadowsocks-rust-ssurl
  PKGARCH:=all
endef

define Package/shadowsocks-rust-config/install
	$(INSTALL_DIR) $(1)/etc/config/
	$(INSTALL_DIR) $(1)/etc/init.d/

	$(INSTALL_DIR) $(1)/usr/lib/shadowsocks-rust/
	echo -n $(RUST_PKG_FEATURES) > $(1)/usr/lib/shadowsocks-rust/features
endef

define Package/shadowsocks-rust-config/config
	menu "Features configuration"
		depends on PACKAGE_shadowsocks-rust-config

		config SS_RUST_HICKORY_DNS
			bool "Uses hickory-resolver as DNS resolver instead of tokio's builtin."
			default n

		config SS_RUST_LOCAL_HTTP
			bool "Allow using HTTP protocol for sslocal"
			default y

		config SS_RUST_LOCAL_TUNNEL
			bool "Allow using tunnel protocol for sslocal"
			default y
			help
			  for port forwarding.

		config SS_RUST_LOCAL_SOCKS4
			bool "Allow using SOCKS4/4a protocol for sslocal"
			default n

		config SS_RUST_LOCAL_REDIR
			bool "Allow using redir (transparent proxy) protocol for sslocal"
			default y

		config SS_RUST_LOCAL_DNS
			bool "Allow using dns protocol for sslocal"
			default n
			help
			  serves as a DNS server proxying queries to local or
			  remote DNS servers by ACL rules.

		config SS_RUST_LOCAL_FAKE_DNS
			bool "FakeDNS, allocating an IP address for each individual Query from a specific IP pool"
			default n

		config SS_RUST_LOCAL_TUN
			bool "TUN interface support for sslocal"
			default y

		config SS_RUST_LOCAL_ONLINE_CONFIG
			bool "SIP008 Online Configuration Delivery"

		config SS_RUST_AEAD_CIPHER_EXTRA
			bool "Enable non-standard AEAD ciphers"

		config SS_RUST_AEAD_CIPHER_2022
			bool "Enable AEAD-2022 ciphers (SIP022)"
			default y

		config SS_RUST_AEAD_CIPHER_2022_EXTRA
			bool "Enable AEAD-2022 extra ciphers (non-standard ciphers)"
	endmenu
endef

RUST_PKG_FEATURES:=$(subst $(space),$(comma),$(strip \
	$(if $(CONFIG_SS_RUST_HICKORY_DNS),hickory-dns) \
	$(if $(CONFIG_SS_RUST_LOCAL_HTTP),local-http) \
	$(if $(CONFIG_SS_RUST_LOCAL_TUNNEL),local-tunnel) \
	$(if $(CONFIG_SS_RUST_LOCAL_SOCKS4),local-socks4) \
	$(if $(CONFIG_SS_RUST_LOCAL_REDIR),local-redir) \
	$(if $(CONFIG_SS_RUST_LOCAL_DNS),local-dns) \
	$(if $(CONFIG_SS_RUST_LOCAL_FAKE_DNS),local-fake-dns) \
	$(if $(CONFIG_SS_RUST_LOCAL_TUN),local-tun) \
	$(if $(CONFIG_SS_RUST_LOCAL_ONLINE_CONFIG),local-online-config) \
	$(if $(CONFIG_SS_RUST_AEAD_CIPHER_EXTRA),aead-cipher-extra) \
	$(if $(CONFIG_SS_RUST_AEAD_CIPHER_2022),aead-cipher-2022) \
	$(if $(CONFIG_SS_RUST_AEAD_CIPHER_2022_EXTRA),aead-cipher-2022-extra) \
))

SHADOWSOCKS_COMPONENTS:=sslocal ssserver ssmanager ssservice ssurl
define shadowsocks-rust/templates
  $(foreach component,$(SHADOWSOCKS_COMPONENTS),
    $(call Package/shadowsocks-rust/Default,$(component))
  )
endef
$(eval $(call shadowsocks-rust/templates))

$(eval $(call BuildPackage,shadowsocks-rust-config))
$(foreach component,$(SHADOWSOCKS_COMPONENTS), \
  $(eval $(call BuildPackage,shadowsocks-rust-$(component))) \
)
