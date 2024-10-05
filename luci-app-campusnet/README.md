# luci-app-campusnet

![GitHub License](https://img.shields.io/github/license/nicholas9698/luci-app-campusnet#pic_center)

适用于 UJN 等院校的联通校园网自动验证插件

本项目仅提供了[x86架构的ipk包](https://github.com/nicholas9698/luci-app-campusnet/releases)，其他平台可按照以下流程自行编译

> 多拨版暂未开发，相关脚本见 (依赖于 luci-app-syncdial)
> 
> ![Static Badge](https://img.shields.io/badge/nicholas9698-openwrt--campusnetwork--CU-blue?logo=github&link=https%3A%2F%2Fgithub.com%2Fnicholas9698%2Fopenwrt-campusnetwork-CU)


## LEDE 或 OpenWrt 编译

克隆本项目至 lede 或 openwrt 的 `feeds/luci/applications/`

```shell
cd feeds/luci/applications/

git clone https://github.com/nicholas9698/luci-app-campusnet.git
```

返回 lede 或 openwrt 根目录，然后使用以下命令编译本插件

```shell
cd lede

./scripts/feeds update -a

./scripts/feeds install -a

make package/feeds/luci/luci-app-campusnet/compile V=s
```

编译的 ipk 包将在 `bin/packages/target/luci/` 中生成
