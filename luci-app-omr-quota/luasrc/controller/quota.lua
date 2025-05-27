-- Copyright 2018 Ycarus (Yannick Chabanois) <ycarus@zugaina.org>
-- Licensed to the public under the Apache License 2.0.

module("luci.controller.quota", package.seeall)

function index()
	if not nixio.fs.access("/etc/config/omr-quota") then
		return
	end
	local page
	page = entry({"admin", "network", "quota"}, cbi("quota/quota"), _("Quota"))
	page.dependent = true
end
