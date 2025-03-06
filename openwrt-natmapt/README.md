# openwrt-natmap
TCP/UDP port mapping for full cone NAT

> [NATMap][] project is used to establish a TCP/UDP port mapping from ISP NAT public address to local private address. If all layers of NAT are full cones (NAT-1), any host can access internal services through the mapped public address.

## Features included outside of NATMap
- [x] Automatically configure the Firewall
- [x] Transparent Port forward (Forward port = 0)
- [x] Refresh the listen port of the BT Client (Forward port = 0)
- [x] Port update notify script
- [x] A Record update script
- [x] AAAA Record update script
- [x] SRV Record update script
- [x] HTTPS Record update script
- [ ] SVCB Record update script

## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/)\
And LuCI can be found here [luci-app-natmapt][]

## Build

```shell
# Take the x86_64 platform as an example
tar xjf openwrt-sdk-21.02.3-x86-64_gcc-8.4.0_musl.Linux-x86_64.tar.xz
# Go to the SDK root dir
cd OpenWrt-sdk-*-x86_64_*
# First run to generate a .config file
make menuconfig
./scripts/feeds update -a
./scripts/feeds install -a
# Get Makefile
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/openwrt-natmapt.git package/natmapt
pushd package/natmapt
umask 022
git checkout
popd
# Select the package Network -> natmapt
make menuconfig
# Start compiling
make package/natmapt/compile V=99
```

## Collaborators

[Ray Wang](https://github.com/heiher)\
[Richard Yu](https://github.com/ysc3839)\
[Anya Lin](https://github.com/muink)

[NATMap]: https://github.com/heiher/natmap
[luci-app-natmapt]: https://github.com/muink/luci-app-natmapt

## License
This project is licensed under the MIT License
