
include $(TOPDIR)/rules.mk

PKG_NAME:=cpu-checker
PKG_VERSION:=0.7
PKG_RELEASE:=1

PKG_LICENSE:=GPL-3.0

include $(INCLUDE_DIR)/package.mk

define Package/cpu-checker
  SECTION:=utils
  CATEGORY:=Utilities
  PKGARCH:=all
  TITLE:=tools to help evaluate certain CPU (or BIOS) features
  DEPENDS:=+getopt +TARGET_x86:msr-tools
  URL:=https://git.launchpad.net/ubuntu/+source/cpu-checker/
endef

define Package/cpu-checker/description
  There are some CPU features that are filtered or disabled by system BIOSes. 
  This set of tools seeks to help identify when certain features are in this state, 
  based on kernel values, CPU flags and other conditions. Supported feature tests 
  are NX/XD and VMX/SVM.
endef

define Build/Configure
endef

define Build/Compile
endef

define Package/cpu-checker/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_BIN) ./files/{kvm-ok,check-bios-nx} \
		$(1)/usr/sbin/
endef

$(eval $(call BuildPackage,cpu-checker))
