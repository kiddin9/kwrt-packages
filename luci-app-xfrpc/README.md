## luci-app-xfrpc
该项目为xfrpc的luci配置界面

## 视频演示

<div align="center">
<a href="https://www.bilibili.com/video/BV1Yr421w7Ep/?vd_source=b303f6e8e0ed18809d8752d41ab1de7d">
	<img width="800" alt="luci-app-xfrpc_intro_video" src="https://github.com/liudf0716/luci-app-xfrpc/assets/1182593/554d0457-0960-4a53-b518-7fbb6c72e605">
</a>
</div>



## 界面效果

![image](https://github.com/liudf0716/luci-app-xfrpc/assets/1182593/4fa8e80a-1bbb-4c81-aecb-79d508fc8f65)

![image](https://github.com/liudf0716/luci-app-xfrpc/assets/1182593/626df1fd-f81b-4294-b11b-49814b743042)

![image](https://github.com/liudf0716/luci-app-xfrpc/assets/1182593/d3d5d0fc-c44f-41b9-8201-17d681888508)

![image](https://github.com/liudf0716/luci-app-xfrpc/assets/1182593/6aa12c2c-bb84-4da5-bad4-d8fb645ed8b4)

## 如何集成到openwrt中编译

1. 复制仓库中的文件到如下目录，并执行安装

复制项目代码到目录
```
feeds/luci/applications/luci-app-xfrpc/
```

集成项目到luci中
```
./scripts/feeds install luci -a
```

2. 选择路径

`make menuconfig`

LuCI > 3. Applications > luci-app-xfrpc

3. 编译openwrt固件

```
make -j4
```

4. 单独编译

```
make package/luci-app-xfrpc/compile
```

## 联系方式

QQ群：331230369 

## 如何支持我的开源项目？

如果你觉得我的项目对你有帮助，或者你也认同开源精神，欢迎通过以下方式支持我：

1. **Star和Fork项目**：在GitHub上给我的项目加星和Fork。
2. **提出反馈和建议**：通过提交issue或pull request来帮助改进项目。
3. **打赏支持**：通过支付宝或者微信打赏我，帮助我投入更多时间和资源进行开发。

<p align="center">
  <img src="https://github.com/liudf0716/apfree-wifidog/assets/1182593/4f95e99f-c25b-43d6-ba49-f190cb9c9c30" alt="支付宝打赏" width="150" />
</p>
<p align="center">
  <img src="https://github.com/liudf0716/apfree-wifidog/assets/1182593/0754800e-2875-475d-b4c1-dea925df6fff" alt="微信打赏" width="150"/>
</p>

