module("luci.controller.natpierce", package.seeall)

function index()
    if not nixio.fs.access("/etc/config/natpierce") then
        return
    end
    entry({"admin", "services", "natpierce"}, cbi("natpierce/natpierce"), _("皎月连"), 10).leaf=true
    entry({"admin", "services", "natpierce_status"}, call("natpierce_status"))
    entry({"admin", "services", "natpierce_get_version"}, call("natpierce_get_version"))

    entry({"admin", "services", "natpierce_update"}, call("natpierce_update"))
    entry({"admin", "services", "natpierce_upgrade"}, call("natpierce_upgrade"))
    
    entry({"admin", "services", "natpierce_clear_config"}, post("natpierce_clear_config")).leaf=true

end

function natpierce_status()
    local uci = require 'luci.model.uci'.cursor()
    local port = tonumber(uci:get_first("natpierce", "natpierce", "port"))
    local e = { }
    
    local service_stdout = luci.sys.exec("/etc/init.d/natpierce status")
    local service_running = (string.find(service_stdout, "running", 1, true) ~= nil)
    
    e.port = (port or 33272)
    e.process_alive = service_running
    
    local port_is_listening_by_natpierce = false
    local netstat_cmd = string.format("netstat -lntp | grep ':%d '", e.port)
    local netstat_output = luci.sys.exec(netstat_cmd)
    
    if netstat_output and string.len(netstat_output) > 0 then
        if string.find(netstat_output, "natpierce", 1, true) then
            port_is_listening_by_natpierce = true
        end
    end

    e.running = service_running and port_is_listening_by_natpierce
    
    e.listening = port_is_listening_by_natpierce 
    
    luci.http.prepare_content("application/json")
    luci.http.write_json(e)
end

function natpierce_get_version()
    local uci_cursor = require 'luci.model.uci'.cursor()
    luci.http.prepare_content("application/json")
    local result = {}
    local current_version  = uci_cursor:get_first("natpierce", "version_info", "current_version")
    local latest_version   = uci_cursor:get_first("natpierce", "version_info", "latest_version")


    result.status = "success"

    result.current_installed_version = current_version or "N/A"
 
	result.latest_version_text = latest_version or "N/A"

    result.message = "版本信息获取成功"

    luci.http.write_json(result)
end

function natpierce_update()
    luci.http.prepare_content("application/json")
    local result = {}
    local update_script_path = "/usr/share/natpierce/update.sh"

    if not nixio.fs.access(update_script_path) then
        result.status = "error"
        result.message = "错误：更新脚本不存在。"
        luci.http.write_json(result)
        return
    end
    local chmod_code = luci.sys.call("chmod +x " .. update_script_path)

    local code = luci.sys.call(update_script_path .. " >/dev/null 2>&1")

    if code == 0 then
        result.status = "success"
        result.message = "检查更新成功，请刷新页面获取最新版本信息。"
    else
        result.status = "error"
        result.message = "错误：检查更新失败，请检查网络连接。"
    end

    luci.http.write_json(result)
end

function natpierce_upgrade()
    luci.http.prepare_content("application/json")
    local result = {}
    local upgrade_script_path = "/usr/share/natpierce/upgrade.sh"

    if not nixio.fs.access(upgrade_script_path) then
        result.status = "error"
        result.message = "错误：升级脚本不存在。"
        luci.http.write_json(result)
        return
    end
    local chmod_code = luci.sys.call("chmod +x " .. upgrade_script_path)

    luci.sys.call(upgrade_script_path .. " >/tmp/natpierce_upgrade.log 2>&1 &")

    result.status = "success"
    result.message = "升级任务已在后台启动。请稍后检查版本信息或日志。"
    luci.http.write_json(result)
end

function natpierce_clear_config()
    -- 确保请求方法是 POST
    if luci.http.getenv("REQUEST_METHOD") ~= "POST" then
        luci.http.prepare_content("application/json")
        luci.http.write_json({
            status = "error",
            message = "错误：此操作只允许使用 POST 方法。",
        })
        return
    end

    local result = {}
    local config_file = "/usr/share/natpierce/data/config"

    if nixio.fs.access(config_file) then
        local status = os.remove(config_file)
        if status then
            require("luci.model.uci").cursor():load("natpierce")
            luci.sys.exec("/etc/init.d/natpierce restart")
            result.status = "success"
            result.message = "账户配置文件已成功清除。"
        else
            result.status = "error"
            result.message = "错误：无法删除配置文件。"
        end
    else
        result.status = "success"
        result.message = "账户配置文件不存在，无需清除。"
    end

    luci.http.prepare_content("application/json")
    luci.http.write_json(result)
end