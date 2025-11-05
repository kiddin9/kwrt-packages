include $(TOPDIR)/rules.mk

PKG_NAME:=intel_i40e
PKG_RELEASE=2.18.9

include $(INCLUDE_DIR)/kernel.mk
include $(INCLUDE_DIR)/package.mk

define KernelPackage/intel_i40e
  SUBMENU:=Network Devices
  TITLE:=Driver for Intel i40e series devices
  DEPENDS:=@PCI_SUPPORT +kmod-ptp @TARGET_x86
  FILES:=\
  $(PKG_BUILD_DIR)/auxiliary.ko \
	$(PKG_BUILD_DIR)/i40e.ko
  AUTOLOAD:=$(call AutoProbe,i40e)
  PROVIDES:=kmod-intel_i40e
endef

define Build/Compile
	+$(MAKE) $(PKG_JOBS) -C "$(LINUX_DIR)" \
		$(KERNEL_MAKE_FLAGS) NEED_AUX_BUS=2 \
		M="$(PKG_BUILD_DIR)" \
		modules
endef

$(eval $(call KernelPackage,intel_i40e))

