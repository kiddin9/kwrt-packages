--[[

Copyright (C) 2021 zPonds <admin@shinenet.cn>
Copyright (C) 2020 KFERMercer <KFER.Mercer@gmail.com>
Copyright (C) 2020 [CTCGFW] Project OpenWRT

THIS IS FREE SOFTWARE, LICENSED UNDER GPLv3

]]--

local nixio = require "nixio"
local yaml = require "lyaml"

m = Map("nezha-agent-v1")
m.title	= translate("哪吒监控")
m.description = translate("哪吒监控Agent配置")

m:section(SimpleSection).template = "nezha-agent-v1/nezha-agent_status"

s = m:section(NamedSection, "config", "nezha-agent-v1", translate("配置"))
s.anonymous = true
s.addremove = false

local function read_yaml()
    local f = io.open("/etc/config/nz.yml", "r")
    if f then
        local content = f:read("*all")
        f:close()
        return yaml.load(content) or {}
    end
    return {}
end

local function write_yaml(data)
    local f = io.open("/etc/config/nz.yml", "w")
    if f then
        local yaml_content = ""
        local sorted_keys = {}
        for k in pairs(data) do
            table.insert(sorted_keys, k)
        end
        table.sort(sorted_keys)
        
        for _, k in ipairs(sorted_keys) do
            local v = data[k]
            if type(v) == "boolean" then
                yaml_content = yaml_content .. k .. ": " .. (v and "true" or "false") .. "\n"
            elseif type(v) == "number" then
                yaml_content = yaml_content .. k .. ": " .. tostring(v) .. "\n"
            else
                if type(v) == "string" and (v:find("[ :]") or v == "") then
                    yaml_content = yaml_content .. k .. ": \"" .. tostring(v) .. "\"\n"
                else
                    yaml_content = yaml_content .. k .. ": " .. tostring(v) .. "\n"
                end
            end
        end
        
        f:write(yaml_content)
        f:close()
        
        nixio.syslog("debug", "Writing to nz.yml: " .. yaml_content)
        
        return true
    end
    return false
end

function m.on_commit(self)
    -- 从UCI配置中读取所有值
    local uci = require "luci.model.uci".cursor()
    local data = {
        -- 基本设置
        server = uci:get("nezha-agent-v1", "config", "server"),
        client_secret = uci:get("nezha-agent-v1", "config", "client_secret"),
        uuid = uci:get("nezha-agent-v1", "config", "uuid"),
        tls = uci:get("nezha-agent-v1", "config", "tls") == "1",
        insecure_tls = uci:get("nezha-agent-v1", "config", "insecure_tls") == "1",
        
        -- 高级设置
        debug = uci:get("nezha-agent-v1", "config", "debug") == "1",
        disable_auto_update = uci:get("nezha-agent-v1", "config", "disable_auto_update") == "1",
        disable_command_execute = uci:get("nezha-agent-v1", "config", "disable_command_execute") == "1",
        disable_force_update = uci:get("nezha-agent-v1", "config", "disable_force_update") == "1",
        disable_nat = uci:get("nezha-agent-v1", "config", "disable_nat") == "1",
        report_delay = tonumber(uci:get("nezha-agent-v1", "config", "report_delay")) or 3,
        ip_report_period = tonumber(uci:get("nezha-agent-v1", "config", "ip_report_period")) or 1800,
        
        -- 其他固定配置
        disable_send_query = false,
        gpu = false,
        skip_connection_count = false,
        skip_procs_count = false,
        temperature = false,
        use_gitee_to_upgrade = false,
        use_ipv6_country_code = false,
        self_update_period = 0
    }

    -- 删除旧的 YAML 文件
    os.remove("/etc/config/nz.yml")
    nixio.syslog("debug", "Removed old nz.yml")

    -- 写入新配置
    local result = write_yaml(data)
    
    -- 如果写入成功，重启服务
    if result then
        nixio.syslog("debug", "Configuration saved, restarting nezha-agent")
        luci.sys.call("/etc/init.d/nezha-agent restart >/dev/null 2>&1")
    else
        nixio.syslog("err", "Failed to write configuration to nz.yml")
    end
end

-- 修改默认值的设置方式
local config = read_yaml()
local uci = require "luci.model.uci".cursor()

-- 基本设置
s:tab("basic", translate("基本设置"))

o = s:taboption("basic", Value, "server", translate("面板地址"))
o.description = translate("格式: 域名:端口 或 IP:端口")
o.default = uci:get("nezha-agent-v1", "config", "server") or ""
o.rmempty = false

o = s:taboption("basic", Value, "client_secret", translate("客户端密钥"))
o.description = translate("在面板配置页面获取")
o.default = uci:get("nezha-agent-v1", "config", "client_secret") or ""
o.rmempty = false

o = s:taboption("basic", Value, "uuid", translate("UUID"))
o.description = translate("自行生成")
o.default = uci:get("nezha-agent-v1", "config", "uuid") or ""
o.rmempty = false

o = s:taboption("basic", Flag, "tls", translate("启用 TLS"))
o.default = config.tls or false
o.rmempty = false

o = s:taboption("basic", Flag, "insecure_tls", translate("跳过 TLS 验证"))
o.default = config.insecure_tls or false
o.rmempty = false

-- 高级设置
s:tab("advanced", translate("高级设置"))

o = s:taboption("advanced", Flag, "debug", translate("调试模式"))
o.default = config.debug or false

o = s:taboption("advanced", Flag, "disable_auto_update", translate("禁用自动更新"))
o.default = config.disable_auto_update or false

o = s:taboption("advanced", Flag, "disable_command_execute", translate("禁用命令执行"))
o.default = config.disable_command_execute or false

o = s:taboption("advanced", Flag, "disable_force_update", translate("禁用强制更新"))
o = s:taboption("advanced", Flag, "disable_nat", translate("禁用 NAT 支持"))
o.default = config.disable_force_update or false
o.default = config.disable_nat or false

o = s:taboption("advanced", Value, "report_delay", translate("报告延迟(秒)"))
o.default = config.report_delay or 3
o.datatype = "uinteger"

o = s:taboption("advanced", Value, "ip_report_period", translate("IP报告周期(秒)"))
o.default = config.ip_report_period or 1800
o.datatype = "uinteger"

return m
