# 编译K3的屏幕控制组件

使用OpenWrt Snapshot源码编译[lwz322/k3screenctrl](https://github.com/lwz322/k3screenctrl)使用的编译文件，在这里添加了[luci-app-k3screenctrl](https://github.com/lwz322/luci-app-k3screenctrl)的config文件`/file/k3screenctrl`，具体的介绍可以参考上面的链接

因为配套的相关程序的更新，与其他作者的k3screenctrl以及luci-app不兼容

# k3screenctrl_build

 build k3screenctrl via OpenWrt Snapshot source and support luci-app-k3screenctrl
 
 
## 考察K3的DENPENDS

看了文档和官方的./targe/linux/image/Makefile以及coolsnowwolf/lede下的提交记录，官方文档有对DEPENDS的[说明](https://openwrt.org/docs/guide-developer/packages) 

> ## Dependency Types
>
> Various types of dependencies can be specified, which require a bit of explanation for their differences. More documentation is available at [Using Dependencies](https://openwrt.org/docs/guide-developer/dependencies)
>
> | +<foo>     | Package will depend on package <foo> and will select it when selected. |
> | ---------- | ------------------------------------------------------------ |
> | <foo>      | Package will depend on package <foo> and will be invisible until <foo> is selected. |
> | @FOO       | Package depends on the config symbol CONFIG_FOO and will be invisible unless CONFIG_FOO is set. This usually used for depending on certain Linux versions or targets, e.g. @TARGET_foo will make a package only available for target foo. You can also use boolean expressions for complex dependencies, e.g. @(!TARGET_foo&&!TARGET_bar) will make the package unavailable for foo and bar. |
> | +FOO:<bar> | Package will depend on <bar> if CONFIG_FOO is set, and will select <bar> when it is selected itself. The typical use case would be if there compile time options for this package toggling features that depend on external libraries. ![:!:](https://openwrt.org/lib/images/smileys/icon_exclaim.gif) Note that the + replaces the @. ![:!:](https://openwrt.org/lib/images/smileys/icon_exclaim.gif) There is limited support for boolean operators here compared to the @ type above. Negation ! is only supported to negate the whole condition. Parentheses are ignored, so use them only for readability. Like C, && has a higher precedence than \|\|. So +(YYY\|\|FOO&&BAR):package will select package if CONFIG_YYY is set or if both CONFIG_FOO and CONFIG_BAR are set. |
> | @FOO:<bar> | Package will depend on <bar> if CONFIG_FOO is set, and will be invisible until <bar> is selected when CONFIG_FOO is set. |
>
> Some typical config symbols for (conditional) dependencies are:
>
> | TARGET_<foo>                      | Target <foo> is selected                                     |
> | --------------------------------- | ------------------------------------------------------------ |
> | TARGET_<foo>_<bar>                | If the target <foo> has subtargets, subtarget <foo> is selected. If not, profile <foo> is selected. This is in addition to TARGET_<foo> |
> | TARGET_<foo>_<bar>_<baz>          | Target <foo> with subtarget <bar> and profile <baz> is selected. |
> | LINUX_3_X                         | Linux version used is 3.x.*                                  |
> | LINUX_2_6_X                       | Linux version used is 2.6.x.* (:1: only used for backfire and earlier) |
> | LINUX_2_4                         | Linux version is 2.4 (![:!:](https://openwrt.org/lib/images/smileys/icon_exclaim.gif) only used in backfire and earlier, and only for target brcm-2.4) |
> | USE_UCLIBC, USE_GLIBC, USE_EGLIBC | To (not) depend on a certain libc.                           |
> | BROKEN                            | Package doesn't build or work, and should only be visible if “Show broken targets/packages” is selected. Prevents the package from failing builds by accidentally selecting it. |
> | IPV6                              | IPv6 support in packages is selected.                        |
>
> Note that the syntax above applies to the `DEPENDS` field only.

用官方代码的master，19.07.4，19.07.3，以及coolsnowwolf/lede测试了下

|                       | master                    | 19.07.4           | lean/lede                 | older             |
| --------------------- | ------------------------- | ----------------- | ------------------------- | ----------------- |
| image/Makefile        | phicomm_k3                | phicomm-k3        | phicomm-k3                | phicomm-k3        |
| menuconfig            | bcm53xx引入subtarget      |                   | 引入subtarget             |                   |
| k3screenctrl/Makefile | generic_DEVICE_phicomm_k3 | DEVICE_phicomm-k3 | generic_DEVICE_phicomm-k3 | DEVICE_phicomm-k3 |

考虑到用lede安装这个分支的k3screenctrl的人也挺多的，还是照顾兼容性吧，所以综合下上面几种情况写成

```makefile
DEPENDS:=@(TARGET_bcm53xx_generic_DEVICE_phicomm_k3||TARGET_bcm53xx_generic_DEVICE_phicomm-k3||TARGET_bcm53xx_DEVICE_phicomm-k3)
```
