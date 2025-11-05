local m,s,o

m = Map("natpierce")
m.title = translate("皎月连一键内网穿透")
m.description = translate("皎月连一键内网穿透是一款纯P2P连接软件，能够组建虚拟局域网或是将本地局域网内的主机端口直接映射到远程主机<br/>官方QQ群: 376940436<br/>")
	.. translate("官网地址: ")
	.. [[<a href="https://www.natpierce.cn" target="_blank">]]
	.. translate("https://www.natpierce.cn")
	.. [[</a>]]

s = m:section(TypedSection, "natpierce", "")
s.title = translate("配置")
s.addremove = false
s.anonymous = true

o = s:option(Flag, "enabled", translate("启用"))
o.default = 0

o = s:option(Value, "port", translate("Web访问端口"))
o.datatype = "uinteger"
o.default = 33272

s = m:section(SimpleSection)
s.template = "natpierce/status"

s = m:section(SimpleSection)
s.template = "natpierce/advanced"

m.apply_on_parse = true
m.on_after_apply = function(self,map)
	luci.sys.exec("/etc/init.d/natpierce restart")
end

return m