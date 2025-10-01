-- Copyright 2019 Xingwang Liao <kuoruan@gmail.com>
-- Licensed to the public under the MIT License.

local dsp = require "luci.dispatcher"

local m, s, o

m = Map("frpc", "%s - %s" % { translate("Frpc"), translate("代理规则") })

s = m:section(TypedSection, "rule")
s.anonymous = true
s.addremove = true
s.sortable = true
s.template = "cbi/tblsection"
s.extedit = dsp.build_url("admin/services/frpc/rules/%s")
function s.create(...)
	local sid = TypedSection.create(...)
	if sid then
		m.uci:save("frpc")
		luci.http.redirect(s.extedit % sid)
		return
	end
end

o = s:option(Flag, "enabled", translate("启用"))

o = s:option(DummyValue, "name", translate("名称"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or "?"
end

o = s:option(DummyValue, "type", translate("类型"))
o.cfgvalue = function (...)
	local v = Value.cfgvalue(...)
	return v and v:upper() or "?"
end

o = s:option(DummyValue, "localIP", translate("本地 IP"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or "?"
end

o = s:option(DummyValue, "localPort", translate("本地端口"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or "?"
end

o = s:option(DummyValue, "remotePort", translate("远程端口"))
o.cfgvalue = function (...)
	return Value.cfgvalue(...) or translate("未设置")
end

return m
