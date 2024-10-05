# Luci App For [SakuraFrp](https://www.natfrp.com/)
 自写的 [SakuraFrp](https://www.natfrp.com/) 的luci界面
 
## 用法
1. 在 [SakuraFrp](https://www.natfrp.com/) 注册账号，获取访问密钥
2. 在 [Releases](https://github.com/WinterOfBit/luci-app-sakurafrp/releases)页面下载最新编译ipk文件（当然自己编译也行）
3. 自己想办法上传安装
4. 在Services/SakuraFrp找到并进入主页（配置页）![主页](/scrennshots/index.png) 填入访问密钥，并勾选运行SakuraFrp，点击保存&应用
5. 进入隧道列表 ![隧道列表](/scrennshots/tunnels.png) 点击刷新隧道列表
6. 隧道列表刷新后对要启用的隧道选中“启用”复选框 ![隧道列表](/scrennshots/tunnels_refreshed.png) 然后点击保存&应用
7. 现在你可以点击重启Frpc按钮，插件会自动安装并启动Frpc。你可以在日志页查看输出 ![日志](/scrennshots/log.png)

## 说明
- 隧道高级修改、隧道创建删除功能未接入，等一手API awa。如有需求请跳转手动修改页，手动修改frpc.ini文件
- 隧道域名、ip获取功能未接入，等一手API awa。当前就在日志输出看吧！
- 每次更改启用隧道并启动一次frpc后，frpc.ini内容会被覆写！

## 声明：本插件完全开源，不会保存或传输用户的任何信息
## 欢迎提交Issues PR!