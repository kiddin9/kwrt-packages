include $(TOPDIR)/rules.mk
include $(INCLUDE_DIR)/kernel.mk

PKG_NAME:=tcp-brutal
PKG_VERSION:=1.0.3
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://codeload.github.com/apernet/tcp-brutal/tar.gz/v$(PKG_VERSION)?
PKG_HASH:=skip

PKG_LICENSE:=GPL-3.0
PKG_LICENSE_FILES:=LICENSE
PKG_MAINTAINER:=sbwml <admin@cooluc.com>

include $(INCLUDE_DIR)/package.mk

define KernelPackage/tcp-brutal
  TITLE:=TCP Brutal congestion control
  SUBMENU:=Network Support
  FILES:= $(PKG_BUILD_DIR)/brutal.ko
  AUTOLOAD:=$(call AutoProbe,brutal)
endef

define KernelPackage/tcp-brutal/Description
  TCP Brutal is Hysteria's congestion control algorithm ported to TCP, as a Linux kernel module.
endef

define Build/Compile
	+$(KERNEL_MAKE) M=$(PKG_BUILD_DIR) modules
endef

$(eval $(call KernelPackage,tcp-brutal))
