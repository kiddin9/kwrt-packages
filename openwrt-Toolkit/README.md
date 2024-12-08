Toolkit for OpenWrt/LEDE
===

简介
---

 本项目是 [Toolkit][1] 运行在 OpenWrt/LEDE 上的软件包，目前包含 DNSPing 和 FileHash  
 当前版本: 0.4.0.2-2  

编译
---

 - 从 OpenWrt/LEDE 的 [SDK][S] 编译

   ```bash
   # 以 ar71xx 平台为例，此处文件名为示例，仅供参考，请以实际文件名为准
   # 有对应平台的 SDK 即可编译软件包，不仅限于 ar71xx
   tar xjf OpenWrt-SDK-ar71xx-for-linux-x86_64-gcc-4.8-linaro_uClibc-0.9.33.2.tar.bz2
   # 进入 SDK 根目录
   cd OpenWrt-SDK-ar71xx-*
   # 首先验证 SDK 是否需要 ccache
   cat .config | grep CONFIG_CCACHE
   # 如果返回结果为 "y"，则需要使用系统软件包管理器，如 yum、apt-get，安装 ccache
   # 获取 Makefile
   git clone --depth 1 --branch master --single-branch https://github.com/wongsyrone/openwrt-Toolkit.git package/Toolkit
   # 选择要编译的包 Network -> Toolkit 并进行个人定制，或者保持默认
   # 这时根据提供的选项确认依赖已经被选中
   make menuconfig
   # 开始编译
   make package/Toolkit/compile V=99
   # 编译结束之后从 bin 文件夹复制本程序的 ipk 文件到设备中，使用 opkg 进行安装
   ```

 - 从 OpenWrt/LEDE 的代码树编译

 也可将本项目文件夹命名为 `Toolkit` 直接放置于 OpenWrt/LEDE 代码树的 `package` 文件夹下，之后按照编译的正常步骤进行，最后可在 bin 目录中找到编译好的软件包。下面简述编译步骤

   ```bash
   # 获取OpenWrt/LEDE代码树，根据需求选择稳定版（如Chaos Calmer 15.05）或开发版Trunk
   # 如果是 Trunk 使用
   git clone git://git.openwrt.org/openwrt.git
   # 如果是 Chaos Calmer 15.05 稳定版使用
   git clone git://git.openwrt.org/15.05/openwrt.git
   # 进入代码树根目录
   cd openwrt
   # 获取 Makefile
   git clone --depth 1 --branch master --single-branch https://github.com/wongsyrone/openwrt-Toolkit.git package/Toolkit
   # 首先选择目标平台以及设备型号
   # 接下来选择要编译的包 Network -> Toolkit 并进行个人定制，或者保持默认
   make menuconfig
   # 如果只想编译 Toolkit 使用
   make package/Toolkit/{prepare,compile} V=99
   # 如果想编译集成好 Toolkit 的固件使用
   make V=99
   ```

----------

  [1]: https://github.com/muink/Toolkit
  [2]: https://github.com/muink/Toolkit/tree/master/Documents
  [S]: http://wiki.openwrt.org/doc/howto/obtain.firmware.sdk
