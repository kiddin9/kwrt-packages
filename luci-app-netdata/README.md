# LuCI Netdata
> [Netdata][] is high-fidelity infrastructure monitoring and troubleshooting.
Open-source, free, preconfigured, opinionated, and always real-time.

### Screenshots

![config](.img/config.png "config")  
![netdata](.img/netdata.png "netdata")  

### How to install

1. Goto ~~[releases](https://github.com/muink/luci-app-netdata/tree/releases)~~ [here](https://fantastic-packages.github.io/packages/)
2. Download the latest version of ipk
3. Login router and goto **System --> Software**
4. Upload and install ipk
5. Reboot if the app is not automatically added in page
6. Goto **Status --> Netdata**
7. If after program update. LuCI is not working properly, please reinstall luci-app-netdata.
8. After you upgrade Netdata, you need to reinstall netdata and luci-app-netdata.

### Build

- Compile from OpenWrt/LEDE SDK

```
# Take the x86_64 platform as an example
tar xjf openwrt-sdk-21.02.3-x86-64_gcc-8.4.0_musl.Linux-x86_64.tar.xz
# Go to the SDK root dir
cd OpenWrt-sdk-*-x86_64_*
# First run to generate a .config file
make menuconfig
./scripts/feeds update -a
./scripts/feeds install -a
# Get Makefile
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/luci-app-netdata.git package/luci-app-netdata
pushd package/luci-app-netdata
umask 022
git checkout
popd
# Select the package LuCI -> Applications -> luci-app-netdata
make menuconfig
# Start compiling
make package/luci-app-netdata/compile V=99
```

[Netdata]: https://github.com/netdata/netdata

### License

- This project is licensed under the [GPL-3.0](https://www.gnu.org/licenses/gpl-3.0.html)
