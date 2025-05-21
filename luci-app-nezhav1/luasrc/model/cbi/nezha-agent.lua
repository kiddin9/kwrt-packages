m = Map("nezha-agent")
m.title = translate("Nezha Agent")
m.description = translate("Nezha For OpenWRT")

m:section(SimpleSection).template = "nezha-agent/nezha-agent_status"

s = m:section(TypedSection, "nezha-agent")
s.addremove = false
s.anonymous = true

-- 启用
enable = s:option(Flag, "enabled", translate("启用"))
enable.rmempty = false

-- 使用TLS
tls = s:option(Flag, "tls", translate("使用TLS"))
tls.rmempty = false

-- 面板RPC Host:Port
o = s:option(Value, "host", translate("面板RPC Host:Port"))
o.datatype = "hostport"
o.placeholder = "data.example.com:8008"
o.default = "data.example.com:8008"
o.rmempty = false

-- client_secret密钥
o = s:option(Value, "secret", translate("client_secret密钥"))
o.placeholder = ""
o.default = ""
o.password = true
o.rmempty = false

-- 使用Gitee获取更新
gitee = s:option(Flag, "gitee", translate("使用Gitee获取更新"))
gitee.rmempty = false

-- 开启调试信息
debug = s:option(Flag, "debug", translate("开启调试信息"))
debug.rmempty = true

-- 禁用自动升级
disable_auto_update = s:option(Flag, "disable_auto_update", translate("禁用自动升级"))
disable_auto_update.rmempty = true

-- 禁止在此机器上执行命令
disable_command_execute = s:option(Flag, "disable_command_execute", translate("禁止命令执行"))
disable_command_execute.rmempty = true

-- 禁用强制升级
disable_force_update = s:option(Flag, "disable_force_update", translate("禁用强制升级"))
disable_force_update.rmempty = true

-- 禁用发送查询
disable_send_query = s:option(Flag, "disable_send_query", translate("禁用发送查询"))
disable_send_query.rmempty = true

-- 禁用NAT
disable_nat = s:option(Flag, "disable_nat", translate("禁用NAT"))
disable_nat.rmempty = true

-- 启用GPU监控
gpu = s:option(Flag, "gpu", translate("启用GPU监控"))
gpu.rmempty = true

-- 禁用证书检查
insecure_tls = s:option(Flag, "insecure_tls", translate("禁用证书检查"))
insecure_tls.rmempty = true

-- 本地IP更新间隔
ip_report_period = s:option(Value, "ip_report_period", translate("本地IP更新间隔"))
ip_report_period.datatype = "uinteger"
ip_report_period.default = 1800
ip_report_period.rmempty = true

-- 系统状态上报间隔
report_delay = s:option(Value, "report_delay", translate("系统状态上报间隔"))
report_delay.datatype = "uinteger"
report_delay.default = 1
report_delay.rmempty = true

-- 不监控连接数
skip_conn = s:option(Flag, "skip_conn", translate("不监控连接数"))
skip_conn.rmempty = true

-- 不监控进程数
skip_procs = s:option(Flag, "skip_procs", translate("不监控进程数"))
skip_procs.rmempty = true

-- 启用温度监控
temperature = s:option(Flag, "temperature", translate("启用温度监控"))
temperature.rmempty = true


-- 使用IPv6的位置上报
use_ipv6_countrycode = s:option(Flag, "use_ipv6_countrycode", translate("使用IPv6的位置上报"))
use_ipv6_countrycode.rmempty = true

-- 设备UUID
uuid = s:option(Value, "uuid", translate("设备UUID"))
uuid.placeholder = ""
uuid.default = ""
uuid.rmempty = false

-- 自定义生成按钮
generate_button = s:option(Button, "_generate", translate("生成"))
generate_button.inputstyle = "apply"

-- 按钮点击事件处理
function generate_button.write(_, section)
    local new_uuid = luci.sys.exec("cat /proc/sys/kernel/random/uuid"):gsub("\n", "")
    m.uci:set("nezha-agent", section, "uuid", new_uuid)
    m.uci:save("nezha-agent")
    luci.http.redirect(luci.dispatcher.build_url("admin/services/nezha-agent"))
end

return m
