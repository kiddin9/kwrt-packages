module("luci.controller.omr-dscp", package.seeall)

function index()
	entry({"admin", "network", "omr-dscp"}, alias("admin", "network", "omr-dscp", "dscp"), _("OMR-DSCP"))
	--entry({"admin", "network", "omr-dscp", "index"}, template("omr-dscp/dscp"))
	entry({"admin", "network", "omr-dscp", "dscp"}, cbi("dscp"), _("DSCP"),1)
	entry({"admin", "network", "omr-dscp", "domains"}, cbi("dscp-domains"), _("DSCP Domains"),2).leaf = true
end
