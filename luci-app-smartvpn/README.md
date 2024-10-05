# luci-app-smartvpn

SmartVPN is an OpenWrt network extension package. It uses SoftEther service to set up cross-regional VPN, and routing network traffic by predefined domain whitelists. SmartVPN is ideal for unblocking the  GFW(great firewall) from the network layer.  It also can be used to connect multiple branch office‘s networks with public wideband networks.

SmartVPN是一个OpenWrt路由插件，其核心功能是通过SoftEther进行跨地域组网，并通过域名白名单来实现智能路由。可通过它实现多出口的海外网络加速访问，或让企业多个分支机构之间通过普通的公共宽带网络实现互联互通。

SmartVPN是让局域网内各类网络设备无需配置科学上网的理想解工具。本项目成功应用于多个企业构建个人和公司之前的远程办公环境，并为公司开发人员访问海外开发资源提供极大的便利。

## 工作原理

SmartVPN通过SoftEther构建加密通道构建海外出口，并通过域名白名单控制mwan3路由规则智能路由，让访问内地、香港和海外的网络流量分别使用不同的网络出口，从而让局域网的所有网络设备都可以高效科学上网。SmartVPN系统支持三个路由出口：

* 内地出口eth0：默认互联网出口，对应的白名单域名使用119.29.29.29作为原始DNS（可通过配置修改）。
* 香港出口tap_hub01：香港互联网出口，对应的白名单域名使用1.1.1.1作为原始DNS。
* 海外出口tap_hub02：默认海外出口，对应的白名单域名使用8.8.8.8作为原始DNS。

系统使用白名单方式工作，每个出口对应一个白名单，与白名单域名或ip网段吻合的主机将通过对应的路由出口访问。不在任何白名单的主机则通过默认互联网出口访问，其原始DNS也由默认互联网出口提供。海外出口内置了接近7千个内地不能访问的白名单域名，因此使用者无需对白名单做特殊设置就能够满足大部分科学上网需求。

![image-20220526100218105](README.assets/image-20220526100218105.png)

需要科学上网的网络设备需要把DNS和默认网关指向安装了SmartVPN插件的OpenWrt路由。当网络设备查询DNS获取ip地址时，OpenWrt上的dnsmasq服务会根据白名单向对应的原始DNS获得主机ip。dnsmasq把查询到的ip返回查询者的同时，会把ip加入到对应的ipset。这样所有访问该ip的数据包都会被打上对应的标记。路由上的mwan3插件将会识别ipset打上标记的数据包，从而判定数据包应该经由哪个出口访问外部网络。

虽然海外出口可以通过OpenVPN等常用的VPN工具搭建，但考虑到这些常用的VPN通道容易受到干扰甚至屏蔽，SmartVPN采用更加安全可靠的SoftEther来搭建出口通道。上图中的tap_hub01和tap_hub02是通过SoftEther提供的两个虚拟网卡接口。SoftEther并不是用常规的VPN协议，安全性和隐蔽性都很好。有关SoftEther的内容可以通过官方网站了解：https://www.softether.org/

由于SmartVPN的使用需要与SoftEther配合使用，需要有较为丰富的路由配置和网络基础知识才能操作的起来。**本项目仅提供给喜欢折腾的朋友参考**。

## 安装SmartVPN

### 方法一：使用安装包

* 安装核心依赖环境

```sh
opkg update
opkg install dnsmasq-full
opkg install softether-server
```

* 安装其它依赖环境（通常路由器已经默认安装）

```sh
opkg install mwan3 luci-app-mwan3
opkg install nlbwmon luci-app-nlbwmon
opkg install collectd collectd-mod-thermal luci-app-statistics
```

* 下载 package-release 目录下的安装包到OpenWrt路由器，然后在OpenWrt上运行

```sh
opkg install luci-app-smartvpn...        # 安装插件主题（英文界面）
opkg install luci-i18n-smartvpn-zh-...   # 安装插件语言包（cn为简体，tw为繁体）
```

### 方法二：烧录到OpenWrt固件中

此方法需要懂得OpenWrt编译和固件烧录。

* 准备好OpenWrt编译环境，并经测试可成功构建OpenWrt固件
* 下载源代码并添加到openwrt源码目录： ./feeds/luci/application
* 把SmartVPN注册到package中

```sh
./scripts/feeds update luci
./scripts/feeds install -a -p luci
```

* 把SamrtVPN运行时依赖的模块添加到OpenWrt构件清单中：使用`make menuconfig`命令把以下模块添加到构件环境中：

```sh
# 确保OpenWrt构件中包括SmartVPN所需要的以下模块
- dnsmasq-full               # 需要先去掉原来默认的dnsmasq模块
- openssh-sftp-server
- ipepf3                     # 网络测速工具（建议添加）
- softether-server
- smartvpn
- mwan3
- nlbwmon
- collectd
- collectd-mod-exec
- collectd-mod-ping
- collectd-mod-thermal
- luci > translate: 简体+繁体  # 让luci界面支持简体和繁体中文
- luci-app-smatvpn
- luci-app-mwan3
- luci-app-nlbmon
- luci-app-statistic
```

* 如果您你在构建OpenWrt固件的时候已经完成了SoftEther的组网，可以把已经验证可用的SoftEther的配置文件替换掉默认配置文件：root/usr/smartvpn/service/vpn_server.config

经过以上设置后就可以按照正常方式构建OpenWrt固件，然后把固件烧录到路由器上。

### 单独编译安装包

在已经搭建好OpenWrt编译环境的情况下，可以单独编译SmartVPN的安装包。按照方法二的说明把SmartVPN注册到package中后，运行一下命令：

```
make package/feeds/luci/luci-app-smartvpn/clean
make package/feeds/luci/luci-app-smartvpn/compile
```

## 配置SmartVPN

* 搭建香港和美国SoftEther服务器

在香港和美国各组用一个VPS，建议VPS选择最低配置就可以了。在VPS上安装SoftEther服务。按照概述中图片所示，为服务器创建虚拟Hub，并在虚拟hub上开启SecureNAT功能，SecureNAT的ip按图示设置即可。网上有许多SoftEther的安装教程，这里推荐一个比较简单的：[SoftEther安装配置教程](https://www.lixh.cn/archives/2647.html)。

* 把OpenWrt上的SoftEther与香港和美国的SoftEther桥接

使用SoftEther管理客户端与OpenWrt上的SoftEther连接（首次链接无需密码）。为SoftEther创建连个虚拟hub分别为：`HUB01`和`HUB02`。为`HUB01`新建一个tap桥接设备`tap_hub01`，为`HUB02`新建一个tap桥接设备`tap_hub012`。

把HUB01和HUB02分别与香港和美国的虚拟hub通过级联方式连接起来。这样在OpenWrt就可以通过对应的tap网卡访问香港或美国SoftEther服务器上的SecureNAT对应的ip，并通过SecureNAT访问当地的互联网了。

配置好SoftEther后重启OpenWrt路由，检查SoftEther服务是否正常，虚拟HUB01和HUB02是否正确级联到对应的海外服务器。

* 设置tap网卡

进入OpenWrt路由的Interface（接口）管理界面，找到SmartVPN安装好的两个网卡接口vpnhub01和vpnhub02，分别对其进行设置：

```
vpnhub01：
	ip设置为：192.168.27.y   # y的建议取值范围为31～249
	网关设置为：192.168.27.2  # 香港SoftEther的SecureNAT服务ip
	
vpnhub02：
	ip设置为：192.168.29.y   # y的建议取值范围为31～249
	网关设置为：192.168.29.1  # 美国SoftEther的SecureNAT服务ip		
```

设置好后可以通过尝试分别ping以下两个网关的ip，能够ping说明出口路由已经正确配置。当有多个安装了SmartVPN的路由器要链接到相同的香港或美国服务器时y的取值必须不同。

> 有经验的网络管理员可以按照自己的要求来配置SoftEther，构件所需要的SoftEther组网方案，配置tap网卡的ip和网关的。例如可以多个路由共享一套海外网出口，把多个路由的局域网相互连通，组建跨地狱的“局域网”等。

## 使用SmartVPN

系统安装完成后在OpenWrt的Web管理界面中的网络菜单中会出现“SmartVPN“入口。以下是管理界面的“概览”页面：

![image-20220524122428829](README.assets/image-20220524122428829.png)

* 信息

`状态`显示的是SmartVPN服务的启动状态和版本。ip显示的是相应路由出口白名单中当前匹配的ip地址数量，其中snapshot显示的是最近一次保存的快照中匹配ip的数量。

保存快照按钮的作用是把当前白名单的命中ip清单保存起来。恢复快照按钮的作用把之前保存的ip快照恢复到命中ip池中。软重启按钮的作用是在不清空命中ip的情况下重启服务。

**建议使用软重启来让修改后的百名单生效**。因为这样可以确保之前的DNS查询命中的ip依然获得正确的路由。

* 设置

勾选或取消勾选“已启用”，然后点击页面底部“保存并应用”按钮可以启动或停止SmartVPN服务。通过这种方法启动Smart VPN服务后，所有白名单的命中ip清单将会被清空。此时，可以通过恢复快照功能恢复之前保存的命中ip清单。

内地DNS为内地出口白名单使用的DNS服务器地址。系统安装时默认把该地址设置为DNS设置为119.29.29.29。该地址是DNSPod服务商的DNS地址。你可以把它修改为更加快速的本地宽带提供的DNS服务器地址。注意绝对不能够把它设置为OpenWrt路由器的局域网地址。

初始化命令用于恢复SmartVPN的默认设置。本功能可能会冲掉现有的SoftEther和tap网卡的配置，请谨慎使用。具体的初始化命令含义如下：

```
all：恢复所有设置（相当于重新安装SmartVPN服务）
network：仅恢复默认网络设置（tap网卡和防火墙设置）
vpnserver：仅恢复softether服务配置
mwan3：仅恢复mwan3服务配置
```

* 用户配置

用于批量设置SmartVPN，提供给具有大量分支机构的企业快速部署之用。企业各个分支机构可以通过SamrtVPN科学上网的同时实现分支机构之间的互联互通。本功能为保留功能，在此不做介绍。

* 修改主机清单

除了“概览”页面以外，Smart VPN还有三个主机清单（白名单）设置页面：内地主机、香港主机和海外主机。

![image-20220524230816936](README.assets/image-20220524230816936.png)

SmartVPN已经在海外主机清单中内置了接近7千个被内地屏蔽的域名。因此仅当发现个别网站无法正常访问的时候才需要把对应的域名放入香港或海外主机清单中。通常会添再次添加一些从香港访问比较快的主机，从而避免绕道美国访问它们。

主机清单可以使用域名或网段来表示。域名使用点开头，例如`.github.com`表示该匹配域名及其所有的子域名；网段CIDR格式（掩码位长度）表示，例如`23.0.0.0/8`表示以23开头的所有网络ip。这里填写的主机清单会在系统升级的时候保留。

三个出口的白名单的优先级为从左到右，内地主机优先级最高。内地主机清单通常不需要设置，它仅用于确保之中的域名通过默认互联网出口进行访问。

主机清单修改后需要重启SmartVPN服务后才会生效。建议使用“软重启”按钮来重启服务。
