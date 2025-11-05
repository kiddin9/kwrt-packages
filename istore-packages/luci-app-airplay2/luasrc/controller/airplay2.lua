-- Copyright 2014 Álvaro Fernández Rojas <noltari@gmail.com>
-- Licensed to the public under the Apache License 2.0.

module("luci.controller.airplay2", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/airplay2") then
		return
	end

	entry({"admin", "services", "airplay2"}, cbi("airplay2"), _("AirPlay 2 Receiver")).dependent = true
	entry({"admin", "services", "airplay2", "run"}, call("act_status")).leaf = true
end

function act_status()
	local e = {}
	e.running = luci.sys.call("pgrep airplay2 >/dev/null") == 0
	luci.http.prepare_content("application/json")
	luci.http.write_json(e)
end
