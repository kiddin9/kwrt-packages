# SPDX-License-Identifier: GPL-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=hv-tools
PKG_VERSION:=0.0.8
PKG_RELEASE:=3
PKG_LICENSE:=GPL-2.0

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/kernel.mk

define Package/hv-tools
	SECTION:=Custom
	CATEGORY:=Extra packages
	TITLE:=hv-tools
	DEPENDS:=+uci +libpthread
	MAINTAINER:=yichya <mail@yichya.dev>
endef

define Package/hv-tools/description
	Hyper-V Linux Guest Services for OpenWrt
endef

define Package/hv-tools/config
menu "hv-tools Configuration"
	depends on PACKAGE_hv-tools

	choice
		prompt "select fcopy daemon"
		default FCOPY_DAEMON
		help
		  Select the fcopy daemon included.

		config FCOPY_DAEMON_NONE
			bool "do not include fcopy daemon"
			help
			  Do not include any fcopy daemon.

		config FCOPY_DAEMON
			bool "include hv_fcopy_daemon"
			help
			  Include hv_fcopy_daemon (for Linux 6.9 and earlier).

		config FCOPY_UIO_DAEMON
			bool "include hv_fcopy_uio_daemon"
			help
			  Include hv_fcopy_uio_daemon (for Linux 6.10 and later).
	endchoice

endmenu
endef

HV_FCOPY_DAEMON:=
ifeq ($(CONFIG_FCOPY_DAEMON),y)
	HV_FCOPY_DAEMON=hv_fcopy_daemon
endif
ifeq ($(CONFIG_FCOPY_UIO_DAEMON),y)
	HV_FCOPY_DAEMON=hv_fcopy_uio_daemon
endif

define Build/Compile
	$(MAKE_VARS) $(MAKE) $(MAKE_FLAGS) hv_kvp_daemon hv_vss_daemon $(HV_FCOPY_DAEMON) -C $(LINUX_DIR)/tools/hv
endef

define Package/hv-tools/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_kvp_daemon $(1)/usr/sbin/hv_kvp_daemon
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_vss_daemon $(1)/usr/sbin/hv_vss_daemon
	$(INSTALL_DIR) $(1)/usr/libexec/hypervkvpd
	$(INSTALL_BIN) ./hv_get_dhcp_info.sh $(1)/usr/libexec/hypervkvpd/hv_get_dhcp_info
	$(INSTALL_BIN) ./hv_get_dns_info.sh $(1)/usr/libexec/hypervkvpd/hv_get_dns_info
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./hv_kvp_daemon.init $(1)/etc/init.d/hv_kvp_daemon
	$(INSTALL_BIN) ./hv_vss_daemon.init $(1)/etc/init.d/hv_vss_daemon
ifdef CONFIG_FCOPY_DAEMON
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_fcopy_daemon $(1)/usr/sbin/hv_fcopy_daemon
	$(INSTALL_BIN) ./hv_fcopy_daemon.init $(1)/etc/init.d/hv_fcopy_daemon
endif
ifdef CONFIG_FCOPY_UIO_DAEMON
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_fcopy_uio_daemon $(1)/usr/sbin/hv_fcopy_uio_daemon
	$(INSTALL_BIN) ./hv_fcopy_uio_daemon.init $(1)/etc/init.d/hv_fcopy_uio_daemon
endif
endef

$(eval $(call BuildPackage,hv-tools))
