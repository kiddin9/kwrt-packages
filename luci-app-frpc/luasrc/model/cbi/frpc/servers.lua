-- Copyright 2019 Xingwang Liao <kuoruan@gmail.com>
-- Licensed to the public under the MIT License.

local dsp = require "luci.dispatcher"

local m, s, o

m = Map("frpc", "%s - %s" % { translate("Frpc"), translate("Frps 服务器") })

s = m:section(TypedSection, "server")
s.anonymous = true
s.addremove = true
s.sortable = true
s.template = "cbi/tblsection"
s.extedit = dsp.build_url("admin/services/frpc/servers/%s")
function s.create(...)
	local sid = TypedSection.create(...)
	if sid then
		m.uci:save("frpc")
		luci.http.redirect(s.extedit % sid)
		return
	end
end

o = s:option(DummyValue, "alias", translate("别名"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or translate("无")
end

o = s:option(DummyValue, "serverAddr", translate("服务端地址"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or "0.0.0.0"
end

o = s:option(DummyValue, "serverPort", translate("服务端端口"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or "7000"
end

o = s:option(DummyValue, "transport__tcpMux", translate("TCP Mux"))
o.cfgvalue = function (...)
	local v = Value.cfgvalue(...)
	return v == "false" and translate("关闭") or translate("开启")
end

return m
