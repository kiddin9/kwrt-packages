# openwrt-einat-ebpf
eBPF-based Endpoint-Independent NAT

> The [einat-ebpf][] is a eBPF application implements an "Endpoint-Independent Mapping" and "Endpoint-Independent Filtering" NAT(network address translation) on TC egress and ingress hooks.

## Requirements
- Target Linux kernel >= 5.15
- Target Linux kernel has the following kernel configuration enabled
```
CONFIG_BPF_EVENTS=y
CONFIG_DEBUG_KERNEL=y
CONFIG_DEBUG_INFO=y
CONFIG_DEBUG_INFO_REDUCED=n
CONFIG_DEBUG_INFO_BTF=y
```
- You can install `kmod-ikconfig`, use command `zcat /proc/config.gz | grep -E "(CONFIG_BPF_EVENTS|CONFIG_DEBUG_KERNEL|CONFIG_DEBUG_INFO|CONFIG_DEBUG_INFO_REDUCED|CONFIG_DEBUG_INFO_BTF|CONFIG_BPF_SYSCALL|CONFIG_BPF_JIT)"` to confirm
- If it does not match, you need add the following configuration to the `.config` and rebuild the target kernel
```
CONFIG_KERNEL_BPF_EVENTS=y
CONFIG_KERNEL_DEBUG_KERNEL=y
CONFIG_KERNEL_DEBUG_INFO=y
CONFIG_KERNEL_DEBUG_INFO_REDUCED=n
CONFIG_KERNEL_DEBUG_INFO_BTF=y
```
- Currently are known [immortalwrt][] and [fantastic-rebuild][] is enabled these options


## Releases
You can find the prebuilt-ipks [here](https://fantastic-packages.github.io/packages/) \
And LuCI can be found here [luci-app-einat][]

## Additional Features

Support for enabling additional features at build. Including but not limited to `ipv6, static, ...` \
For details, see [define Package/$(PKG_NAME)/config](https://github.com/muink/openwrt-einat-ebpf/blob/master/Makefile#L89)

## Build

```shell
# Build system setup
# Please refer to [Build system setup](https://openwrt.org/docs/guide-developer/toolchain/install-buildsystem)
sudo apt install clang libelf-dev zlib1g-dev
# Take the x86_64 platform as an example
tar xjf rebuild-sdk-23.05.3-x86-64_gcc-12.3.0_musl.Linux-x86_64.tar.xz
# Go to the SDK root dir
cd rebuild-sdk-*-x86_64_*
# Install prebuilt llvm-bpf
tar xjf llvm-bpf-*.Linux-x86_64.tar.xz
# First run to generate a .config file
./scripts/feeds update -a
./scripts/feeds install -a
make menuconfig
# Get Makefile
git clone --depth 1 --branch master --single-branch --no-checkout https://github.com/muink/openwrt-einat-ebpf.git package/einat-ebpf
pushd package/einat-ebpf
umask 022
git checkout
popd
# Select the package Network -> Routing and Redirection -> einat-ebpf
make menuconfig
# Start compiling
make package/einat-ebpf/compile V=s BUILD_LOG=y -j$(nproc)
```

[einat-ebpf]: https://github.com/EHfive/einat-ebpf
[luci-app-einat]: https://github.com/muink/luci-app-einat
[immortalwrt]: https://github.com/immortalwrt/immortalwrt
[fantastic-rebuild]: https://github.com/fantastic-packages/rebuild

## License
This project is licensed under the [GPL-2.0](https://www.gnu.org/licenses/gpl-2.0.html)
