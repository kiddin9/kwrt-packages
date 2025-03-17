# SPDX-License-Identifier: GPL-2.0

include $(TOPDIR)/rules.mk

PKG_NAME:=hv-tools
PKG_VERSION:=0.0.7
PKG_RELEASE:=1
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

define Build/Compile
	$(MAKE_VARS) $(MAKE) $(MAKE_FLAGS) all -C $(LINUX_DIR)/tools/hv
endef

define Package/hv-tools/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_kvp_daemon $(1)/usr/sbin/hv_kvp_daemon
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_vss_daemon $(1)/usr/sbin/hv_vss_daemon
	$(INSTALL_BIN) $(LINUX_DIR)/tools/hv/hv_fcopy_daemon $(1)/usr/sbin/hv_fcopy_daemon
	$(INSTALL_DIR) $(1)/usr/libexec/hypervkvpd
	$(INSTALL_BIN) ./hv_get_dhcp_info.sh $(1)/usr/libexec/hypervkvpd/hv_get_dhcp_info
	$(INSTALL_BIN) ./hv_get_dns_info.sh $(1)/usr/libexec/hypervkvpd/hv_get_dns_info
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./hv_kvp_daemon.init $(1)/etc/init.d/hv_kvp_daemon
	$(INSTALL_BIN) ./hv_vss_daemon.init $(1)/etc/init.d/hv_vss_daemon
	$(INSTALL_BIN) ./hv_fcopy_daemon.init $(1)/etc/init.d/hv_fcopy_daemon
endef

$(eval $(call BuildPackage,hv-tools))
