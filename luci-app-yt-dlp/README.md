## luci-app-yt-dlp
该项目是yt-dlp的luci界面，通过该界面可以下载youtube、Twitter、B站等yt-dlp支持下载的视频网站。

### 视频演示

<div align="center">
<a href="https://www.bilibili.com/video/BV1jx421U7h4/?vd_source=b303f6e8e0ed18809d8752d41ab1de7d">
	<img width="972" alt="luci-app-yt-dlp_intro_video" src="luci-app-yt-dlp_intro.png">
</a>
</div>


## 如何集成到openwrt中编译

1. 复制仓库中的文件到如下目录，并执行安装

```
feeds/luci/applications/luci-app-yt-dlp/
./scripts/feeds install luci -a
```

2. 选择路径

`make menuconfig`

LuCI > 3. Applications > luci-app-yt-dlp

3. 编译openwrt固件

```
make -j4
```

4. 单独编译

```
make package/luci-app-yt-dlp/compile
```

## 联系方式

QQ群：331230369 
