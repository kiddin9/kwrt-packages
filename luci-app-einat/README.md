# luci-app-einat

> [einat-ebpf][] project is an eBPF application implements an "Endpoint-Independent Mapping" and "Endpoint-Independent Filtering" NAT(network address translation) on TC egress and ingress hooks.

## Depends

1. [openwrt-einat-ebpf][]

## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/)

## Build

```shell
# Take the x86_64 platform as an example
tar xjf openwrt-sdk-23.05.3-x86-64_gcc-12.3.0_musl.Linux-x86_64.tar.xz
# Go to the SDK root dir
cd OpenWrt-sdk-*-x86_64_*
# First run to generate a .config file
make menuconfig
./scripts/feeds update -a
./scripts/feeds install -a
# Get Makefile
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/luci-app-einat.git package/luci-app-einat
pushd package/luci-app-einat
umask 022
git checkout
popd
# Select the package LuCI -> Applications -> luci-app-einat
make menuconfig
# Start compiling
make package/luci-app-einat/compile V=99
```

[einat-ebpf]: https://github.com/EHfive/einat-ebpf
[openwrt-einat-ebpf]: https://github.com/muink/openwrt-einat-ebpf

## License

This project is licensed under the MIT license
