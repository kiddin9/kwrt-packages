# luci-app-cns-server

## 说明

   一个管理CNS的LUCI界面
   实现CNS的多配置文件、更新、自动开放防火墙端口的功能

   CNS作者仓库：https://github.com/mmmdbybyd/CNS

## 使用方法
```
    1、从release下载luci-app-cns-server_all.ipk luci-i18n-cns-zh-cn.ipk 到你的路由器
    2、执行opkg install luci-app-cns-server_all.ipk luci-i18n-cns-zh-cn.ipk 安装即可

```

## 编译方法
```Brach
    cd package/
    #下载源码
    git clone https://github.com/hczjxhdyz/luci-app-cns-server.git
    #回到源码根目录
    cd ../
    #返回lede目录进入编译菜单选择 luci-app-cns-server
    make menuconfig 
    #执行编译命令
    make -j1 package/luci-app-cns-server/compile
```
