'use strict';
'require view.log-viewer.multilog.log-multilog as abc';

return abc.view.extend({
	viewName   : 'multilog-secure',
	title      : _('Log') + ' - ' + _('secure'),
	autoRefresh: false,
	logFile    : '/var/log/secure',
});
