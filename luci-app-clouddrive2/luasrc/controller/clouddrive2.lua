module("luci.controller.clouddrive2", package.seeall)

function index()
    if not nixio.fs.access("/etc/config/clouddrive2") then
        return
    end

    local page = entry({"admin", "services", "clouddrive2"}, alias("admin", "services", "clouddrive2", "settings"), _("CloudDrive2"), 60)
    page.dependent = true
    page.acl_depends = { "luci-app-clouddrive2" }

    entry({"admin", "services", "clouddrive2", "settings"}, cbi("clouddrive2"), _("Settings"), 10).leaf = true
    entry({"admin", "services", "clouddrive2", "status"}, template("clouddrive2/status"), _("Status"), 20).leaf = true
end
