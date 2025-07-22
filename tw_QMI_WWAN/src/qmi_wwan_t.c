/*
 * Copyright (c) 2012  Bjørn Mork <bjorn@mork.no>
 *
 * The probing code is heavily inspired by cdc_ether, which is:
 * Copyright (C) 2003-2005 by David Brownell
 * Copyright (C) 2006 by Ole Andre Vadla Ravnas (ActiveSync)
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * version 2 as published by the Free Software Foundation.
 */

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/version.h>
#include <linux/netdevice.h>
#include <linux/ethtool.h>
#include <linux/etherdevice.h>
#include <linux/mii.h>
#include <linux/usb.h>
#include <linux/usb/cdc.h>
#include <linux/usb/usbnet.h>
#include <linux/usb/cdc-wdm.h>
#if 1
#include <linux/if_arp.h>
#endif
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 15, 0))
#include <linux/wwan.h>
#endif

/* This driver supports wwan (3G/LTE/?) devices using a vendor
 * specific management protocol called Qualcomm MSM Interface (QMI) -
 * in addition to the more common AT commands over serial interface
 * management
 *
 * QMI is wrapped in CDC, using CDC encapsulated commands on the
 * control ("master") interface of a two-interface CDC Union
 * resembling standard CDC ECM.  The devices do not use the control
 * interface for any other CDC messages.  Most likely because the
 * management protocol is used in place of the standard CDC
 * notifications NOTIFY_NETWORK_CONNECTION and NOTIFY_SPEED_CHANGE
 *
 * Alternatively, control and data functions can be combined in a
 * single USB interface.
 *
 * Handling a protocol like QMI is out of the scope for any driver.
 * It is exported as a character device using the cdc-wdm driver as
 * a subdriver, enabling userspace applications ("modem managers") to
 * handle it.
 *
 * These devices may alternatively/additionally be configured using AT
 * commands on a serial interface
 */

/* driver specific data */
struct qmi_wwan_state {
	struct usb_driver *subdriver;
	atomic_t pmcount;
	unsigned long unused;
	struct usb_interface *control;
	struct usb_interface *data;
};

enum qmi_wwan_flags {
	QMI_WWAN_FLAG_RAWIP = 1 << 0,
};

/* default ethernet address used by the modem */
static const u8 default_modem_addr[ETH_ALEN] = {0x02, 0x50, 0xf3};

static const u8 buggy_fw_addr[ETH_ALEN] = {0x00, 0xa0, 0xc6, 0x00, 0x00, 0x00};

#if 1
static int rt_debug = 0;
static void printk_hex(u8 *buf,int buf_size);

static void printk_hex(u8 *buf,int buf_size)
{
	if(rt_debug)
	{
    	int i,j;
   		int total_size = 0;
    	int line_cout =  buf_size>>4;
    	if((buf_size&0x0000000f)!=0)
        	line_cout++;

    	for(i=0;i<line_cout;i++)
    	{
        	printk("\n%d:",total_size);
        	for(j=0;j<16;j++)
        	{
            	total_size++;
            	printk("%02X ",buf[(i<<4)+j]);
            	if(((i<<4)+1+j)==buf_size)
            	{
                	printk("\n");
                	return;
            	}
        	}
    	}
	}   
}
#endif
/* Make up an ethernet header if the packet doesn't have one.
 *
 * A firmware bug common among several devices cause them to send raw
 * IP packets under some circumstances.  There is no way for the
 * driver/host to know when this will happen.  And even when the bug
 * hits, some packets will still arrive with an intact header.
 *
 * The supported devices are only capably of sending IPv4, IPv6 and
 * ARP packets on a point-to-point link. Any packet with an ethernet
 * header will have either our address or a broadcast/multicast
 * address as destination.  ARP packets will always have a header.
 *
 * This means that this function will reliably add the appropriate
 * header iff necessary, provided our hardware address does not start
 * with 4 or 6.
 *
 * Another common firmware bug results in all packets being addressed
 * to 00:a0:c6:00:00:00 despite the host address being different.
 * This function will also fixup such packets.
 */
static int qmi_wwan_rx_fixup(struct usbnet *dev, struct sk_buff *skb)
{
#if 1
	struct qmi_wwan_state *info = (void *)&dev->data;
	bool rawip = info->unused & QMI_WWAN_FLAG_RAWIP;
#endif	
	__be16 proto;

	/* This check is no longer done by usbnet */
	if (skb->len < dev->net->hard_header_len)
		return 0;

	switch (skb->data[0] & 0xf0) {
	case 0x40:
		proto = htons(ETH_P_IP);
		break;
	case 0x60:
		proto = htons(ETH_P_IPV6);
		break;
	case 0x00:
#if 1
		if (rawip)
			return 0;
#endif	
		if (is_multicast_ether_addr(skb->data))
			return 1;
		/* possibly bogus destination - rewrite just in case */
		skb_reset_mac_header(skb);
		goto fix_dest;
	default:
		/* pass along other packets without modifications */
		return 1;
	}
	if (skb_headroom(skb) < ETH_HLEN)
		return 0;
	skb_push(skb, ETH_HLEN);
	skb_reset_mac_header(skb);
	eth_hdr(skb)->h_proto = proto;
#if (LINUX_VERSION_CODE > KERNEL_VERSION( 3,16,0 ))
	eth_zero_addr(eth_hdr(skb)->h_source);
#else
	memset(eth_hdr(skb)->h_source,0,ETH_ALEN);
#endif
fix_dest:
	memcpy(eth_hdr(skb)->h_dest, dev->net->dev_addr, ETH_ALEN);
	return 1;
}
#if 1
static struct sk_buff *qmi_wwan_tx_fixup(struct usbnet *dev, struct sk_buff *skb, gfp_t flags);

struct sk_buff *qmi_wwan_tx_fixup(struct usbnet *dev, struct sk_buff *skb, gfp_t flags)
{
	// Skip Ethernet header from message
	//printk("%s:get into ...",__func__);
	if (skb_pull(skb, ETH_HLEN)) {
		printk_hex(skb->data,skb->len);
		return skb;
	} else {
		dev_err(&dev->intf->dev,  "Packet Dropped ");
	}

	// Filter the packet out, release it
	dev_kfree_skb_any(skb);
	return NULL;
}
static void qmi_wwan_netdev_setup(struct net_device *net)
{
	struct usbnet *dev = netdev_priv(net);
	struct qmi_wwan_state *info = (void *)&dev->data;

	if (info->unused & QMI_WWAN_FLAG_RAWIP) {
		net->header_ops      = NULL;  /* No header */
		net->type            = ARPHRD_NONE;
		net->hard_header_len = 0;
		net->addr_len        = 0;
		net->flags           = IFF_POINTOPOINT | IFF_NOARP | IFF_MULTICAST;
		netdev_dbg(net, "mode: raw IP\n");
	} else if (!net->header_ops) { /* don't bother if already set */
		ether_setup(net);
		netdev_dbg(net, "mode: Ethernet\n");
	}

	/* recalculate buffers after changing hard_header_len */
	usbnet_change_mtu(net, net->mtu);
}
static ssize_t raw_ip_show(struct device *d, struct device_attribute *attr, char *buf)
{
	struct usbnet *dev = netdev_priv(to_net_dev(d));
	struct qmi_wwan_state *info = (void *)&dev->data;

	return sprintf(buf, "%c\n", info->unused & QMI_WWAN_FLAG_RAWIP ? 'Y' : 'N');
}

static ssize_t raw_ip_store(struct device *d,  struct device_attribute *attr, const char *buf, size_t len)
{
	struct usbnet *dev = netdev_priv(to_net_dev(d));
	struct qmi_wwan_state *info = (void *)&dev->data;
	bool enable;
	int ret;

	if (kstrtobool(buf, &enable))
		return -EINVAL;

	/* no change? */
	if (enable == (info->unused & QMI_WWAN_FLAG_RAWIP))
		return len;
#if 0
	if (!rtnl_trylock())
		return restart_syscall();
#endif

	/* we don't want to modify a running netdev */
	if (netif_running(dev->net)) {
		netdev_err(dev->net, "Cannot change a running device\n");
		ret = -EBUSY;
		goto err;
	}

	/* let other drivers deny the change */
	ret = call_netdevice_notifiers(NETDEV_PRE_TYPE_CHANGE, dev->net);
	ret = notifier_to_errno(ret);
	if (ret) {
		netdev_err(dev->net, "Type change was refused\n");
		goto err;
	}

	if (enable)
		info->unused |= QMI_WWAN_FLAG_RAWIP;
	else
		info->unused &= ~QMI_WWAN_FLAG_RAWIP;
	qmi_wwan_netdev_setup(dev->net);
	call_netdevice_notifiers(NETDEV_POST_TYPE_CHANGE, dev->net);
	ret = len;
err:
#if 0
	rtnl_unlock();
#endif
	return ret;
}
#if (LINUX_VERSION_CODE < KERNEL_VERSION( 4,0,0 ))
#define __ATTR_RW(_name) __ATTR(_name, (S_IWUSR | S_IRUGO),		\
			 _name##_show, _name##_store)
#define DEVICE_ATTR_RW(_name) \
	struct device_attribute dev_attr_##_name = __ATTR_RW(_name)
#endif

static DEVICE_ATTR_RW(raw_ip);

static struct attribute *qmi_wwan_sysfs_attrs[] = {
	&dev_attr_raw_ip.attr,
	NULL,
};
/*********************************************************************************
 * /sys/module/qmi_wwan_qiao/drivers/usb:qmi_wwan/1-9:1.4/net/wwan0/qmi# cat raw_ip 
 * Y
 * *******************************************************************************/
static struct attribute_group qmi_wwan_sysfs_attr_group = {
	.name = "qmi",
	.attrs = qmi_wwan_sysfs_attrs,
};
#endif

/* very simplistic detection of IPv4 or IPv6 headers */
static bool possibly_iphdr(const char *data)
{
	return (data[0] & 0xd0) == 0x40;
}
#if (LINUX_VERSION_CODE < KERNEL_VERSION( 2,6,33 ))
/* disallow addresses which may be confused with IP headers */
static int qmi_wwan_mac_addr(struct net_device *dev, void *p)
{
	int ret;
	struct sockaddr *addr = p;

	ret = eth_prepare_mac_addr_change(dev, p);
	if (ret < 0)
		return ret;
	if (possibly_iphdr(addr->sa_data))
		return -EADDRNOTAVAIL;
	eth_commit_mac_addr_change(dev, p);
	return 0;
}
#endif
static const struct net_device_ops qmi_wwan_netdev_ops = {
	.ndo_open		= usbnet_open,
	.ndo_stop		= usbnet_stop,
	.ndo_start_xmit		= usbnet_start_xmit,
	.ndo_tx_timeout		= usbnet_tx_timeout,
	.ndo_change_mtu		= usbnet_change_mtu,
#if (LINUX_VERSION_CODE < KERNEL_VERSION( 2,6,33 ))
	.ndo_set_mac_address	= qmi_wwan_mac_addr,
#endif
	.ndo_validate_addr	= eth_validate_addr,
};

/* using a counter to merge subdriver requests with our own into a
 * combined state
 */
static int qmi_wwan_manage_power(struct usbnet *dev, int on)
{
	struct qmi_wwan_state *info = (void *)&dev->data;
	int rv;

	dev_dbg(&dev->intf->dev, "%s() pmcount=%d, on=%d\n", __func__,
		atomic_read(&info->pmcount), on);

	if ((on && atomic_add_return(1, &info->pmcount) == 1) ||
	    (!on && atomic_dec_and_test(&info->pmcount))) {
		/* need autopm_get/put here to ensure the usbcore sees
		 * the new value
		 */
		rv = usb_autopm_get_interface(dev->intf);
		dev->intf->needs_remote_wakeup = on;
		if (!rv)
			usb_autopm_put_interface(dev->intf);
	}
	return 0;
}

static int qmi_wwan_cdc_wdm_manage_power(struct usb_interface *intf, int on)
{
	struct usbnet *dev = usb_get_intfdata(intf);

	/* can be called while disconnecting */
	if (!dev)
		return 0;
	return qmi_wwan_manage_power(dev, on);
}

/* collect all three endpoints and register subdriver */
static int qmi_wwan_register_subdriver(struct usbnet *dev)
{
	int rv;
	struct usb_driver *subdriver = NULL;
	struct qmi_wwan_state *info = (void *)&dev->data;

	/* collect bulk endpoints */
	rv = usbnet_get_endpoints(dev, info->data);
	if (rv < 0)
		goto err;

	/* update status endpoint if separate control interface */
	if (info->control != info->data)
		dev->status = &info->control->cur_altsetting->endpoint[0];

	/* require interrupt endpoint for subdriver */
	if (!dev->status) {
		rv = -EINVAL;
		goto err;
	}

	/* for subdriver power management */
	atomic_set(&info->pmcount, 0);

	/* register subdriver */
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 15, 0))
	subdriver = usb_cdc_wdm_register(info->control, &dev->status->desc,
					 4096, WWAN_PORT_QMI, &qmi_wwan_cdc_wdm_manage_power);
#else
	subdriver = usb_cdc_wdm_register(info->control, &dev->status->desc,
					 4096, &qmi_wwan_cdc_wdm_manage_power);
#endif
	if (IS_ERR(subdriver)) {
		dev_err(&info->control->dev, "subdriver registration failed\n");
		rv = PTR_ERR(subdriver);
		goto err;
	}

	/* prevent usbnet from using status endpoint */
	dev->status = NULL;

	/* save subdriver struct for suspend/resume wrappers */
	info->subdriver = subdriver;

err:
	return rv;
}

static int qmi_wwan_bind(struct usbnet *dev, struct usb_interface *intf)
{
	int status = -1;
	u8 *buf = intf->cur_altsetting->extra;
	int len = intf->cur_altsetting->extralen;
	struct usb_interface_descriptor *desc = &intf->cur_altsetting->desc;
	struct usb_cdc_union_desc *cdc_union = NULL;
	struct usb_cdc_ether_desc *cdc_ether = NULL;
	u32 found = 0;
	struct usb_driver *driver = driver_of(intf);
	struct qmi_wwan_state *info = (void *)&dev->data;

	BUILD_BUG_ON((sizeof(((struct usbnet *)0)->data) <
		      sizeof(struct qmi_wwan_state)));

	/* set up initial state */
	info->control = intf;
	info->data = intf;
	info->unused = QMI_WWAN_FLAG_RAWIP;
	
#if (LINUX_VERSION_CODE < KERNEL_VERSION( 4,0,0 ))	
	if (dev->driver_info->data &&
	    !test_bit(intf->cur_altsetting->desc.bInterfaceNumber, &dev->driver_info->data)) {
		dev_info(&intf->dev, "not on our whitelist - ignored");
		status = -ENODEV;
		goto err;
	}
#endif	

	/* and a number of CDC descriptors */
	while (len > 3) {
		struct usb_descriptor_header *h = (void *)buf;

		/* ignore any misplaced descriptors */
		if (h->bDescriptorType != USB_DT_CS_INTERFACE)
			goto next_desc;

		/* buf[2] is CDC descriptor subtype */
		switch (buf[2]) {
		case USB_CDC_HEADER_TYPE:
			if (found & 1 << USB_CDC_HEADER_TYPE) {
				dev_dbg(&intf->dev, "extra CDC header\n");
				goto err;
			}
			if (h->bLength != sizeof(struct usb_cdc_header_desc)) {
				dev_dbg(&intf->dev, "CDC header len %u\n",
					h->bLength);
				goto err;
			}
			break;
		case USB_CDC_UNION_TYPE:
			if (found & 1 << USB_CDC_UNION_TYPE) {
				dev_dbg(&intf->dev, "extra CDC union\n");
				goto err;
			}
			if (h->bLength != sizeof(struct usb_cdc_union_desc)) {
				dev_dbg(&intf->dev, "CDC union len %u\n",
					h->bLength);
				goto err;
			}
			cdc_union = (struct usb_cdc_union_desc *)buf;
			break;
		case USB_CDC_ETHERNET_TYPE:
			if (found & 1 << USB_CDC_ETHERNET_TYPE) {
				dev_dbg(&intf->dev, "extra CDC ether\n");
				goto err;
			}
			if (h->bLength != sizeof(struct usb_cdc_ether_desc)) {
				dev_dbg(&intf->dev, "CDC ether len %u\n",
					h->bLength);
				goto err;
			}
			cdc_ether = (struct usb_cdc_ether_desc *)buf;
			break;
		}

		/* Remember which CDC functional descriptors we've seen.  Works
		 * for all types we care about, of which USB_CDC_ETHERNET_TYPE
		 * (0x0f) is the highest numbered
		 */
		if (buf[2] < 32)
			found |= 1 << buf[2];

next_desc:
		len -= h->bLength;
		buf += h->bLength;
	}

	/* Use separate control and data interfaces if we found a CDC Union */
	if (cdc_union) {
		info->data = usb_ifnum_to_if(dev->udev,
					     cdc_union->bSlaveInterface0);
		if (desc->bInterfaceNumber != cdc_union->bMasterInterface0 ||
		    !info->data) {
			dev_err(&intf->dev,
				"bogus CDC Union: master=%u, slave=%u\n",
				cdc_union->bMasterInterface0,
				cdc_union->bSlaveInterface0);
			goto err;
		}
	}

	/* errors aren't fatal - we can live with the dynamic address */
	if (cdc_ether) {
		dev->hard_mtu = le16_to_cpu(cdc_ether->wMaxSegmentSize);
		usbnet_get_ethernet_addr(dev, cdc_ether->iMACAddress);
	}

	/* claim data interface and set it up */
	if (info->control != info->data) {
		status = usb_driver_claim_interface(driver, info->data, dev);
		if (status < 0)
			goto err;
	}

	status = qmi_wwan_register_subdriver(dev);
	if (status < 0 && info->control != info->data) {
		usb_set_intfdata(info->data, NULL);
		usb_driver_release_interface(driver, info->data);
	}
#if 1
	/* make MAC addr easily distinguishable from an IP header */
	if (possibly_iphdr(dev->net->dev_addr)) {
		u8 addr[ETH_ALEN];
		memcpy(addr, dev->net->dev_addr, ETH_ALEN);
		addr[0] |= 0x02;	/* set local assignment bit */
		addr[0] &= 0xbf;	/* clear "IP" bit */
#if (LINUX_VERSION_CODE >= KERNEL_VERSION(5, 15, 0))
		eth_hw_addr_set(dev->net, addr);
#else
		memcpy(dev->net->dev_addr, addr, ETH_ALEN);
#endif
	}
#else
	/* Never use the same address on both ends of the link, even if the
	 * buggy firmware told us to. Or, if device is assigned the well-known
	 * buggy firmware MAC address, replace it with a random address,
	 */
	if (ether_addr_equal(dev->net->dev_addr, default_modem_addr) ||
	    ether_addr_equal(dev->net->dev_addr, buggy_fw_addr))
		eth_hw_addr_random(dev->net);

	/* make MAC addr easily distinguishable from an IP header */
	if (possibly_iphdr(dev->net->dev_addr)) {
		dev->net->dev_addr[0] |= 0x02;	/* set local assignment bit */
		dev->net->dev_addr[0] &= 0xbf;	/* clear "IP" bit */
	}
#endif
#if 1

	dev->net->flags |= IFF_NOARP;
		usb_control_msg(
			interface_to_usbdev(intf),
			usb_sndctrlpipe(interface_to_usbdev(intf), 0),
			0x22, //USB_CDC_REQ_SET_CONTROL_LINE_STATE
			0x21, //USB_DIR_OUT | USB_TYPE_CLASS | USB_RECIP_INTERFACE
			1, //active CDC DTR
			intf->cur_altsetting->desc.bInterfaceNumber,
			NULL, 0, 10000);
#endif
	dev->net->netdev_ops = &qmi_wwan_netdev_ops;
#if 1
	dev->net->sysfs_groups[0] = &qmi_wwan_sysfs_attr_group;
#endif
err:
	return status;
}

static void qmi_wwan_unbind(struct usbnet *dev, struct usb_interface *intf)
{
	struct qmi_wwan_state *info = (void *)&dev->data;
	struct usb_driver *driver = driver_of(intf);
	struct usb_interface *other;

	if (info->subdriver && info->subdriver->disconnect)
		info->subdriver->disconnect(info->control);

	/* allow user to unbind using either control or data */
	if (intf == info->control)
		other = info->data;
	else
		other = info->control;

	/* only if not shared */
	if (other && intf != other) {
		usb_set_intfdata(other, NULL);
		usb_driver_release_interface(driver, other);
	}

	info->subdriver = NULL;
	info->data = NULL;
	info->control = NULL;
}

/* suspend/resume wrappers calling both usbnet and the cdc-wdm
 * subdriver if present.
 *
 * NOTE: cdc-wdm also supports pre/post_reset, but we cannot provide
 * wrappers for those without adding usbnet reset support first.
 */
static int qmi_wwan_suspend(struct usb_interface *intf, pm_message_t message)
{
	struct usbnet *dev = usb_get_intfdata(intf);
	struct qmi_wwan_state *info = (void *)&dev->data;
	int ret;

	/* Both usbnet_suspend() and subdriver->suspend() MUST return 0
	 * in system sleep context, otherwise, the resume callback has
	 * to recover device from previous suspend failure.
	 */
	ret = usbnet_suspend(intf, message);
	if (ret < 0)
		goto err;

	if (intf == info->control && info->subdriver &&
	    info->subdriver->suspend)
		ret = info->subdriver->suspend(intf, message);
	if (ret < 0)
		usbnet_resume(intf);
err:
	return ret;
}

static int qmi_wwan_resume(struct usb_interface *intf)
{
	struct usbnet *dev = usb_get_intfdata(intf);
	struct qmi_wwan_state *info = (void *)&dev->data;
	int ret = 0;
	bool callsub = (intf == info->control && info->subdriver &&
			info->subdriver->resume);

	if (callsub)
		ret = info->subdriver->resume(intf);
	if (ret < 0)
		goto err;
	ret = usbnet_resume(intf);
	if (ret < 0 && callsub)
		info->subdriver->suspend(intf, PMSG_SUSPEND);
err:
	return ret;
}

static const struct driver_info	qmi_wwan_info = {
	.description	= "WWAN/QMI device",
	.flags		= FLAG_WWAN,
	.bind		= qmi_wwan_bind,
	.unbind		= qmi_wwan_unbind,
	.manage_power	= qmi_wwan_manage_power,
	.rx_fixup       = qmi_wwan_rx_fixup,
#if 1
	.tx_fixup       = qmi_wwan_tx_fixup,
#endif
};

#define HUAWEI_VENDOR_ID	0x12D1

/* map QMI/wwan function by a fixed interface number */
#if (LINUX_VERSION_CODE < KERNEL_VERSION( 4,0,0 ))

static const struct driver_info	qmi_wwan_force_int0 = {
	.description	= "Qualcomm WWAN/QMI device",
	.flags		= FLAG_WWAN,
	.bind		= qmi_wwan_bind,
	.unbind		= qmi_wwan_unbind,
	.manage_power	= qmi_wwan_manage_power,
	.data		= BIT(0), /* interface whitelist bitmap */
	.rx_fixup       = qmi_wwan_rx_fixup,
	.tx_fixup       = qmi_wwan_tx_fixup,
};

static const struct driver_info	qmi_wwan_force_int1 = {
	.description	= "Qualcomm WWAN/QMI device",
	.flags		= FLAG_WWAN,
	.bind		= qmi_wwan_bind,
	.unbind		= qmi_wwan_unbind,
	.manage_power	= qmi_wwan_manage_power,
	.data		= BIT(1), /* interface whitelist bitmap */
};

static const struct driver_info qmi_wwan_force_int2 = {
	.description	= "Qualcomm WWAN/QMI device",
	.flags		= FLAG_WWAN,
	.bind		= qmi_wwan_bind,
	.unbind		= qmi_wwan_unbind,
	.manage_power	= qmi_wwan_manage_power,
	.data		= BIT(2), /* interface whitelist bitmap */
};

static const struct driver_info	qmi_wwan_force_int3 = {
	.description	= "Qualcomm WWAN/QMI device",
	.flags		= FLAG_WWAN,
	.bind		= qmi_wwan_bind,
	.unbind		= qmi_wwan_unbind,
	.manage_power	= qmi_wwan_manage_power,
	.data		= BIT(3), /* interface whitelist bitmap */
};

static const struct driver_info	qmi_wwan_force_int4 = {
	.description	= "Qualcomm WWAN/QMI device",
	.flags		= FLAG_WWAN,
	.bind		= qmi_wwan_bind,
	.unbind		= qmi_wwan_unbind,
	.manage_power	= qmi_wwan_manage_power,
	.data		= BIT(4), /* interface whitelist bitmap */
	.rx_fixup       = qmi_wwan_rx_fixup,
	.tx_fixup       = qmi_wwan_tx_fixup,
};
/* map QMI/wwan function by a fixed interface number */
#define QMI_FIXED_INTF(vend, prod, num) \
		.match_flags        = USB_DEVICE_ID_MATCH_DEVICE | USB_DEVICE_ID_MATCH_INT_INFO, \
		.idVendor           = vend, \
		.idProduct          = prod, \
		.bInterfaceClass    = 0xff, \
		.bInterfaceSubClass = 0xff, \
		.bInterfaceProtocol = 0xff, \
		.driver_info        = (unsigned long)&qmi_wwan_force_int##num,
#else
#define QMI_FIXED_INTF(vend, prod, num) \
	USB_DEVICE_INTERFACE_NUMBER(vend, prod, num), \
	.driver_info = (unsigned long)&qmi_wwan_info
#endif

static const struct usb_device_id products[] = {
#if 0	
	/* 1. CDC ECM like devices match on the control interface */
	{	/* Huawei E392, E398 and possibly others sharing both device id and more... */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 1, 9),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Vodafone/Huawei K5005 (12d1:14c8) and similar modems */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 1, 57),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* HUAWEI_INTERFACE_NDIS_CONTROL_QUALCOMM */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 0x01, 0x69),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},

	/* 2. Combined interface devices matching on class+protocol */
	{	/* Huawei E367 and possibly others in "Windows mode" */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 1, 7),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Huawei E392, E398 and possibly others in "Windows mode" */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 1, 17),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* HUAWEI_NDIS_SINGLE_INTERFACE_VDF */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 0x01, 0x37),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* HUAWEI_INTERFACE_NDIS_HW_QUALCOMM */
		USB_VENDOR_AND_INTERFACE_INFO(HUAWEI_VENDOR_ID, USB_CLASS_VENDOR_SPEC, 0x01, 0x67),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Pantech UML290, P4200 and more */
		USB_VENDOR_AND_INTERFACE_INFO(0x106c, USB_CLASS_VENDOR_SPEC, 0xf0, 0xff),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Pantech UML290 - newer firmware */
		USB_VENDOR_AND_INTERFACE_INFO(0x106c, USB_CLASS_VENDOR_SPEC, 0xf1, 0xff),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Novatel USB551L and MC551 */
		USB_DEVICE_AND_INTERFACE_INFO(0x1410, 0xb001,
		                              USB_CLASS_COMM,
		                              USB_CDC_SUBCLASS_ETHERNET,
		                              USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Novatel E362 */
		USB_DEVICE_AND_INTERFACE_INFO(0x1410, 0x9010,
		                              USB_CLASS_COMM,
		                              USB_CDC_SUBCLASS_ETHERNET,
		                              USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Novatel Expedite E371 */
		USB_DEVICE_AND_INTERFACE_INFO(0x1410, 0x9011,
		                              USB_CLASS_COMM,
		                              USB_CDC_SUBCLASS_ETHERNET,
		                              USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Dell Wireless 5800 (Novatel E362) */
		USB_DEVICE_AND_INTERFACE_INFO(0x413C, 0x8195,
					      USB_CLASS_COMM,
					      USB_CDC_SUBCLASS_ETHERNET,
					      USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Dell Wireless 5800 V2 (Novatel E362) */
		USB_DEVICE_AND_INTERFACE_INFO(0x413C, 0x8196,
					      USB_CLASS_COMM,
					      USB_CDC_SUBCLASS_ETHERNET,
					      USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* Dell Wireless 5804 (Novatel E371) */
		USB_DEVICE_AND_INTERFACE_INFO(0x413C, 0x819b,
					      USB_CLASS_COMM,
					      USB_CDC_SUBCLASS_ETHERNET,
					      USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* ADU960S */
		USB_DEVICE_AND_INTERFACE_INFO(0x16d5, 0x650a,
					      USB_CLASS_COMM,
					      USB_CDC_SUBCLASS_ETHERNET,
					      USB_CDC_PROTO_NONE),
		.driver_info        = (unsigned long)&qmi_wwan_info,
	},
	{	/* HP lt4112 LTE/HSPA+ Gobi 4G Module (Huawei me906e) */
		USB_DEVICE_AND_INTERFACE_INFO(0x03f0, 0x581d, USB_CLASS_VENDOR_SPEC, 1, 7),
		.driver_info = (unsigned long)&qmi_wwan_info,
	},
#endif
	/* 3. Combined interface devices matching on interface number */
	{QMI_FIXED_INTF(0x2077, 0x2002, 4)},	/* T&W 9x07 module---TW04C*/
	{QMI_FIXED_INTF(0x2077, 0x2003, 4)},	/* T&W 9605 module---TW12G*/
	{QMI_FIXED_INTF(0x2077, 0x2004, 4)},	/* T&W SDX55 module---TW510M*/
	{QMI_FIXED_INTF(0x05c6, 0x9025, 4)},	/* QUALCOMM*/
	{ }					/* END */
};
MODULE_DEVICE_TABLE(usb, products);

static int qmi_wwan_probe(struct usb_interface *intf,
			  const struct usb_device_id *prod)
{
	struct usb_device_id *id = (struct usb_device_id *)prod;

	/* Workaround to enable dynamic IDs.  This disables usbnet
	 * blacklisting functionality.  Which, if required, can be
	 * reimplemented here by using a magic "blacklist" value
	 * instead of 0 in the static device id table
	 */

	if (!id->driver_info) {
		dev_dbg(&intf->dev, "setting defaults for dynamic device id\n");
		id->driver_info = (unsigned long)&qmi_wwan_info;
	}

	return usbnet_probe(intf, id);
}

static struct usb_driver qmi_wwan_driver = {
	.name		      = "qmi_wwan_t",
	.id_table	      = products,
	.probe		      = qmi_wwan_probe,
	.disconnect	      = usbnet_disconnect,
	.suspend	      = qmi_wwan_suspend,
	.resume		      =	qmi_wwan_resume,
	.reset_resume         = qmi_wwan_resume,
	.supports_autosuspend = 1,
//	.disable_hub_initiated_lpm = 1,
};


static int __init qmi_wwan_init(void)
{
	/* we remap struct (cdc_state) so we should be compatible */
	BUILD_BUG_ON(sizeof(struct cdc_state) != sizeof(struct qmi_wwan_state));

	return usb_register(&qmi_wwan_driver);
}
module_init(qmi_wwan_init);

static void __exit qmi_wwan_exit(void)
{
	usb_deregister(&qmi_wwan_driver);
}
module_exit(qmi_wwan_exit);

//module_usb_driver(qmi_wwan_driver);

MODULE_AUTHOR("Bjørn Mork <bjorn@mork.no>");
MODULE_DESCRIPTION("Qualcomm MSM Interface (QMI) WWAN driver");
MODULE_LICENSE("GPL");
