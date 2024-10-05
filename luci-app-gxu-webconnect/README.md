# 广西大学 校园网Openwrt登录插件

- 在插件内填入参数，即可自动登录校园网

![show](https://github.com/Atomseek/luci-app-gxu-webconnect/blob/master/show.png)
## 使用方法：
### 方法一（推荐）
到[Releases](https://github.com/Atomseek/luci-app-gxu-webconnect/releases) 下载最新编译ipk，上传到路由器安装即可   
安装教程可以参考[这个视频](https://www.bilibili.com/video/av464065982/)

### 方法二
自行编译到固件内

## 原理：
学校校园网的登录命令是一句get请求，简单的把账号信息嵌入进去，再用wget发送请求即可。  
登录命令在源码的/root/etc/gxuwc.sh中，其他学校的朋友可以自行修改。  
安装ipk到路由器后，你也可以在路由器中找到这个文件/etc/gxuwc.sh 自行修改登录命令。  
关于如何获取登录命令网上有很多教程了，这里不再赘述。