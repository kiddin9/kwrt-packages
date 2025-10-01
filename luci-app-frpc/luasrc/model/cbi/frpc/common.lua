-- Copyright 2019 Xingwang Liao <kuoruan@gmail.com> #modify by superzjg@gmail.com 20240810
-- Licensed to the public under the MIT License.

local uci = require "luci.model.uci".cursor()
local util = require "luci.util"
local fs = require "nixio.fs"
local sys = require "luci.sys"

local m, s, o
local server_table = { }

uci:foreach("frpc", "server", function(s)
	if s.alias then
		server_table[s[".name"]] = s.alias
	else
		if not s.serverAddr then
			s.serverAddr = "0.0.0.0"
		end
		if not s.serverPort then
			s.serverPort = "7000"
		end
		local ip = s.serverAddr
		if s.serverAddr:find(":") then
			ip = "[%s]" % s.serverAddr
		end
		server_table[s[".name"]] = "%s:%s" % { ip, s.serverPort }
	end
end)

local function frpc_version()
	local file = uci:get("frpc", "main", "client_file")

	if not file or file == "" or not fs.stat(file) then
		return "<em style=\"color: red;\">%s</em>" % translate("可执行文件无效")
	end

	if not fs.access(file, "rwx", "rx", "rx") then
		fs.chmod(file, 755)
	end

	local version = util.trim(sys.exec("%s -v 2>/dev/null" % file))
	if version == "" then
		return "<em style=\"color: red;\">%s</em>" % translate("未能获取到版本信息")
	end
	if version < "0.52.0" then
		return "<em style=\"color: red;\">%s</em>" % translatef("升级至 0.52.0 或以上才支持 toml 配置文件，当前版本：%s", version)
	end
	return translatef("版本: %s", version)
end

m = Map("frpc", "%s - %s" % { translate("Frpc"), translate("通用设置") },
"<p>%s</p><p>%s</p>" % {
	translate("Frp 是一个可用于内网穿透的高性能的反向代理应用。"),
	translatef("获取更多信息，请访问： %s",
		"<a href=\"https://github.com/fatedier/frp\" target=\"_blank\">https://github.com/fatedier/frp</a>；官方文档：<a href=\"https://gofrp.org/zh-cn/\" target=\"_blank\">gofrp.org</a>")
})

m:append(Template("frpc/status_header"))

s = m:section(NamedSection, "main", "frpc")
s.addremove = false
s.anonymous = true

s:tab("general", translate("常规选项"))
s:tab("advanced", translate("高级选项"))
s:tab("manage", translate("管理选项"))

o = s:taboption("general", Flag, "enabled", translate("启用"))

o = s:taboption("general", Value, "client_file", translate("可执行文件路径"), frpc_version())
o.datatype = "file"
o.rmempty = false
o.default = "/usr/bin/frpc"

o = s:taboption("general", ListValue, "server", translate("服务端"))
o:value("", translate("无"))
for k, v in pairs(server_table) do
	o:value(k, v)
end

o = s:taboption("general", ListValue, "run_user", translate("以用户身份运行"))
o:value("", translate("-- 默认 --"))
local user
for user in util.execi("cat /etc/passwd | cut -d':' -f1") do
	o:value(user)
end

o = s:taboption("general", Flag, "enable_logging", translate("日志配置"),
	translate("Frp 运行日志设置。不含 luci-app 日志（此部分在“系统日志”查看）"))

o = s:taboption("general", Flag, "std_redirect", translate("重定向标准输出"),
	translate("Frp的标准输出、标准错误重定向到日志文件"))
o:depends("enable_logging", "1")

o = s:taboption("general", Value, "log__to", translate("日志文件"),translate("填写文件路径，留空相当于填入 console（日志打印在标准输出中）"))
o:depends("enable_logging", "1")
o.default = "/var/log/frpc.log"

o = s:taboption("general", ListValue, "log__level", translate("日志等级"),translate("留空默认：info"))
o:depends("enable_logging", "1")
o:value("", translate("（空）"))
o:value("trace", translate("追踪"))
o:value("debug", translate("调试"))
o:value("info", translate("信息"))
o:value("warn", translate("警告"))
o:value("error", translate("错误"))

o = s:taboption("general", Value, "log__maxDays", translate("日志保存天数"),translate("留空默认 3 天（不含当天），会按日期命名文件，1天1个"))
o:depends("enable_logging", "1")
o.datatype = "uinteger"
o.placeholder = '3'

o = s:taboption("general", Flag, "log__disablePrintColor", translate("禁用日志颜色"),
	translate("当日志文件为 console 时禁用日志颜色，默认不禁用"))
o:depends("enable_logging", "1")
o.enabled= "true"
o.disabled = ""

o = s:taboption("advanced", ListValue, "loginFailExit", translate("首次登录失败后"))
o:value("", translate("-- 默认 --"))
o:value("false", translate("持续登录"))
o:value("true", translate("退出程序"))

o = s:taboption("advanced", Value, "transport__poolCount", translate("连接池大小"),
	translate("提前建立多少个连接，默认值：0"))
o.datatype = "uinteger"
o.placeholder = '0'

o = s:taboption("advanced", Value, "user", translate("Frpc用户名"),
	translate("设置后代理名称将变为{user}.{proxy}，例如：user1.ssh"))

o = s:taboption("advanced", Value, "transport__protocol", translate("通信协议"),
	translate("和服务端通信所使用的协议，留空默认：tcp，还可选quic、kcp、websocket、wss..."))
o:value("", translate("（空）"))
o:value("tcp")
o:value("kcp")
o:value("websocket")
o:value("quic")
o:value("wss")

o = s:taboption("advanced", Value, "transport__quic__keepalivePeriod", translate("quic keepalive间隔秒数"))
o.datatype = "integer"
o:depends("transport__protocol", "quic")
o.placeholder = '10'
o = s:taboption("advanced", Value, "transport__quic__maxIdleTimeout", translate("quic最大空闲超时秒数"))
o.datatype = "integer"
o:depends("transport__protocol", "quic")
o.placeholder = '30'
o = s:taboption("advanced", Value, "transport__quic__maxIncomingStreams", translate("quic最大并发stream数"))
o.datatype = "uinteger"
o:depends("transport__protocol", "quic")
o.placeholder = '100000'

o = s:taboption("advanced", Value, "transport__proxyURL", translate("代理地址"),
	translate("通过 http、socks5 或 ntlm 代理连接 frps，例如：socks5://user:passwd@192.168.1.128:1080"))
o:depends("transport__protocol", "")
o:depends("transport__protocol", "tcp")

o = s:taboption("advanced", Flag, "transport__tls__enable", translate("禁用 TLS"),
	translate("Frpc 默认通过 TLS 加密连接 Frps。若不配置证书，将使用自动生成的证书"))
o.enabled= "false"
o.disabled = ""

o = s:taboption("advanced", Flag, "transport__tls__disableCustomTLSFirstByte", translate("不禁用TLS自定义字节"),
	translate("默认禁用 TLS 第一个自定义字节 0x17，<font style='color:red'>安全性更强，但可能无法和 vhostHTTPSPort 端口复用</font>"))
o.enabled= "false"
o.disabled = ""
o:depends("transport__tls__enable", "")

o = s:taboption("advanced", Value, "transport__tls__certFile", translate("TLS客户端证书文件路径"))
o:depends("transport__tls__enable", "")
o.datatype = "file"

o = s:taboption("advanced", Value, "transport__tls__keyFile", translate("TLS客户端密钥文件路径"))
o:depends("transport__tls__enable", "")
o.datatype = "file"

o = s:taboption("advanced", Value, "transport__tls__trustedCaFile", translate("TLS CA证书路径"))
o:depends("transport__tls__enable", "")
o.datatype = "file"

o = s:taboption("advanced", Value, "transport__tls__serverName", translate("TLS Server名称"))
o:depends("transport__tls__enable", "")

o = s:taboption("advanced", Value, "dnsServer", translate("DNS 服务器"))
o.datatype = "host"

o = s:taboption("advanced", Value, "natHoleStunServer", translate("Stun 服务器"),
	translate("xtcp 打洞所需的 stun 服务器地址。留空使用默认地址，当其不可用时，指定新地址"))
o.placeholder = "stun.easyvoip.com:3478"

o = s:taboption("advanced", Value, "transport__heartbeatInterval", translate("心跳间隔"),
	translate("向服务端发送心跳包的间隔时间（秒），负数关闭，默认-1。若Frps低于v0.39.0或关闭了frp默认开启的TCP复用（tcpmux），则建议配置（常规值30）"))
o.datatype = "integer"
o.placeholder = "-1"

o = s:taboption("advanced", Value, "transport__heartbeatTimeout", translate("心跳超时"),
	translate("与服务端心跳的超时时间（秒），负数关闭"))
o.datatype = "integer"
--o.placeholder = "90"

o = s:taboption("advanced", DynamicList, "com_extra_options", translate("额外选项"),
	translate("点击添加列表，一行一条，将写入通用参数末尾，格式错误会导致服务启动失败"))
o.placeholder = "option = value"

o = s:taboption("manage", Value, "webServer__addr", translate("管理地址"), translate("默认本机访问；要远程访问按需设置"))
o.datatype = "host"
o.placeholder = "127.0.0.1"
o = s:taboption("manage", Value, "webServer__port", translate("管理端口"))
o.datatype = "port"

o = s:taboption("manage", Value, "webServer__user", translate("管理用户"))

o = s:taboption("manage", Value, "webServer__password", translate("管理密码"))
o.password = true

return m
