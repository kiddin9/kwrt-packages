-- Copyright 2019 Xingwang Liao <kuoruan@gmail.com> #modify by superzjg@gmail.com 20240810
-- Licensed to the public under the MIT License.

local dsp = require "luci.dispatcher"

local m, s, o

local sid = arg[1]

m = Map("frpc", "%s - %s" % { translate("Frpc"), translate("编辑服务端") })
m.redirect = dsp.build_url("admin/services/frpc/servers")

if m.uci:get("frpc", sid) ~= "server" then
	luci.http.redirect(m.redirect)
	return
end

s = m:section(NamedSection, sid, "server")
s.anonymous = true
s.addremove = false

o = s:option(Value, "alias", translate("别名"))

o = s:option(Value, "serverAddr", translate("服务端地址"), translate("地址或域名（支持IPv6）"))
o.placeholder = "0.0.0.0"

o = s:option(Value, "serverPort", translate("服务端端口"), translate("依据“通信协议“设定的类型进行填写，<font style='color:red'>例如：</font>协议tcp、kcp、quic分别对应frps的“bindPort”、“kcpBindPort”、“quicBindPort”"))
o.datatype = "port"
o.placeholder = "7000"

o = s:option(ListValue, "auth__method", translate("鉴权方式"), translate("留空默认token，若用oidc请使用通用设置 - 高级选项中的 “额外选项” 添加参数"))
o:value("", translate("（空）"))
o:value("token")
o:value("oidc")

o = s:option(Value, "auth__token", translate("鉴权令牌"))
o.password = true
o:depends("auth__method", "")
o:depends("auth__method", "token")

o = s:option(Flag, "transport__tcpMux", translate("关闭 TCP 复用"), translate("Frpc 默认开启 tcpMux。提示：frpc 和 frps 要作相同设置"))
o.enabled = "false"
o.disabled = ""

o = s:option(Value, "transport__tcpMuxKeepaliveInterval", translate("tcpMux心跳检查间隔秒数"))
o:depends("transport__tcpMux", "")
o.datatype = "uinteger"
o.placeholder = "30"

return m
