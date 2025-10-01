m = Map("frpc", "%s - %s" % { translate("Frpc"), translate("查看日志文件") })

m:append(Template("frpc/frpc_log"))

return m
