local o = require "luci.dispatcher"
local fs = require "nixio.fs"
local jsonc = require "luci.jsonc"
local util = require "luci.util"

local session_path = "/var/etc/pppoe-user/session"
local sessions = {}

if fs.access(session_path) then
    for filename in fs.dir(session_path) do
        local session_file = session_path .. "/" .. filename
        local file = io.open(session_file, "r")
        local t = jsonc.parse(file:read("*a"))
        file:close()

        if t then
            t.session_file = session_file
            sessions[#sessions + 1] = t
        end
    end
end

local count = util.trim(util.exec("cat /proc/net/dev | grep 'ppp' | wc -l"))

local f = SimpleForm("")
f.reset = false
f.submit = false

local t = f:section(Table, sessions, translate("Online Users [ " .. count .. "]"))
t:option(DummyValue, "username", translate("User Name"))
t:option(DummyValue, "mac", translate("MAC address"))
t:option(DummyValue, "interface", translate("Interface"))
t:option(DummyValue, "ip", translate("IP address"))
t:option(DummyValue, "package", translate("Package"))
t:option(DummyValue, "updated", translate("Renewal Date"))
t:option(DummyValue, "uptime", translate("Up Time"))
t:option(DummyValue, "pid", translate("Process ID"))

local kill = t:option(Button, "kill", translate("Forced Offline"))
kill.inputstyle = "reset"
function kill.write(t, s)
    luci.util.execi("rm -f " .. t.map:get(s, "session_file"))
    util.exec("kill -15 " .. t.map:get(s, "pid"))
    luci.http.redirect(o.build_url("admin/status/userstatus/onlineuser"))
end

return f
