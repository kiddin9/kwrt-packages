

local uci = require"luci.model.uci".cursor()

function program_exists(program)
	local handle = io.popen('which ' .. program)
	local result = handle:read('*a')
	handle:close()
	return result ~= ''
end

local binpath_old = uci:get("gecoosac", "config", "program_path")
if program_exists("gecoosac-2.1") then
	local binpath_new = "/usr/bin/gecoosac-2.1"
	m = Map("gecoosac", translate("Gecoos AC"), translate("Batch management Gecoos AP,Default password:admin") .. "<br>" .. translatef("The current AC version %s, only supports AP 7.6 and above.","2.1"))
	if binpath_old ~= binpath_new then
		uci:set("gecoosac", "@gecoosac[0]", "program_path", binpath_new)
		uci:commit("gecoosac")
	end
elseif program_exists("gecoosac-1.0") then
	local binpath_new = "/usr/bin/gecoosac-1.0"
	m = Map("gecoosac", translate("Gecoos AC"), translate("Batch management Gecoos AP,Default password:admin") .. "<br>" .. translatef("The current AC version %s, only supports AP 7.5 and below.","1.0"))
	if binpath_old ~= binpath_new then
		uci:set("gecoosac", "@gecoosac[0]", "program_path", binpath_new)
		uci:commit("gecoosac")
	end
else
	m = Map("gecoosac", translate("Gecoos AC"), translate("Batch management Gecoos AP,Default password:admin") .. "<br>" .. translate("The AC program does not exist, please check."))
end

m:section(SimpleSection).template  = "gecoosac/gecoosac_status"

s = m:section(TypedSection, "gecoosac", translate("Global Settings"))
s.addremove = false
s.anonymous = true

enable = s:option(Flag, "enabled", translate("Enabled AC"))
enable.rmempty = false

o = s:option(Value, "port", translate("Set the AC access port"))
o.placeholder = 60650
o.default     = 60650
o.datatype    = "port"
o.rmempty     = false

o = s:option(Value, "upload_dir", translate("Upload dir path"), translate("The path to upload AP upgrade firmware"))
o.placeholder = "/tmp/gecoosac/upload/"
o.default     = "/tmp/gecoosac/upload/"
o.rmempty     = false

o = s:option(Value, "db_dir", translate("Database dir path"), translate("The path to store the config database"))
o.placeholder = "/etc/gecoosac/"
o.default     = "/etc/gecoosac/"
o.rmempty     = false

o = s:option(Flag, "log", translate("Enable Log"))
o.default = 1
o.rmempty = false

return m
