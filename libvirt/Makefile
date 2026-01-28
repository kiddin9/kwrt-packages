

include $(TOPDIR)/rules.mk

PKG_NAME:=libvirt
PKG_VERSION:=11.10.0
PKG_RELEASE:=2

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_SOURCE_URL:=https://libvirt.org/sources/
PKG_HASH:=skip

PKG_MAINTAINER:=jjm2473 <jjm2473@gmail.com>
PKG_LICENSE:=LGPL-2.1-or-later
PKG_LICENSE_FILES:=COPYING COPYING.LESSER
PKG_CPE_ID:=cpe:/a:redhat:libvirt


PKG_BUILD_DEPENDS:=acl augeas curl cyrus-sasl e2fsprogs fuse3 gnutls \
	libbsd libcap-ng libjson-c libnl libpcap libpciaccess libssh2 libtasn1 libtirpc libudev-zero libxml2 \
	lvm2 parted readline rpcsvc-proto util-linux libxslt/host

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/meson.mk

define Package/libvirt
  SECTION:=libs
  CATEGORY:=Libraries
  TITLE:=libvirt
  DEPENDS:=+bridge +dmidecode +glib2 +gnutls-utils +libacl +libblkid +libbsd +libcap-ng +libcurl \
	+libfuse3 +libgnutls +libjson-c +libnl-core +libparted +libpcap \
	+libpciaccess +libreadline +libsasl2 +libssh2 +libtirpc +libudev-zero +libxml2 +lvm2
  URL:=https://libvirt.org/
endef

define Package/libvirt/description
  Virtualization API for several hypervisor and container systems
endef

define Package/libvirt/install
	$(INSTALL_DIR) $(1)/usr/sbin
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_DIR) $(1)/etc/libvirt
	$(INSTALL_DIR) $(1)/etc/sasl2
	$(INSTALL_DIR) $(1)/usr/share/libvirt
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/sbin/* $(1)/usr/sbin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/* $(1)/usr/bin/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/lib/*.so.* $(1)/usr/lib/
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/lib/*.so $(1)/usr/lib/
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/libvirt $(1)/usr/lib/
	$(CP) $(PKG_INSTALL_DIR)/etc/libvirt/* $(1)/etc/libvirt/
	$(INSTALL_DATA) $(PKG_INSTALL_DIR)/etc/sasl2/libvirt.conf $(1)/etc/sasl2/
	$(CP) $(PKG_INSTALL_DIR)/usr/share/libvirt/{cpu_map,schemas} $(1)/usr/share/libvirt/
	$(INSTALL_BIN) ./files/libvirt.init $(1)/etc/init.d/
endef

define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/include
	$(INSTALL_DIR) $(1)/usr/share/libvirt
	$(CP) $(PKG_INSTALL_DIR)/usr/include/libvirt $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/* $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/share/libvirt/api $(1)/usr/share/libvirt
	$(SED) 's,=/usr,=$(STAGING_DIR)/usr,g' $(1)/usr/lib/pkgconfig/*.pc
endef

MESON_ARGS += \
	-Db_lto=true \
	--libexec=/usr/lib/libvirt \
	-Dno_git=true \
	-Daudit=disabled \
	-Ddocs=enabled \
	-Dfirewalld=disabled \
	-Dfirewall_backend_priority=nftables \
	-Dinit_script=none \
	-Dbash_completion=disabled \
	-Dnetcf=disabled \
	-Dpm_utils=disabled \
	-Dpolkit=disabled \
	-Dselinux=disabled \
	-Dwireshark_dissector=disabled \
	-Ddriver_esx=disabled \
	-Ddriver_interface=enabled \
	-Ddriver_libvirtd=enabled \
	-Ddriver_libxl=disabled \
	-Ddriver_lxc=enabled \
	-Ddriver_network=enabled \
	-Ddriver_openvz=disabled \
	-Ddriver_qemu=enabled \
	-Ddriver_vbox=disabled \
	-Ddriver_vmware=disabled \
	-Dstorage_dir=enabled \
	-Dstorage_disk=enabled \
	-Dstorage_fs=enabled \
	-Dstorage_lvm=enabled \
	-Dstorage_mpath=auto \
	-Dstorage_scsi=enabled \
	-Dstorage_vstorage=enabled \
	-Dstorage_zfs=enabled

$(eval $(call BuildPackage,libvirt))
