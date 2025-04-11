'use strict';
'require view.log-viewer.multilog.log-multilog as abc';

return abc.view.extend({
	viewName   : 'multilog-boot',
	title      : _('Log') + ' - ' + _('boot.log'),
	autoRefresh: false,
	logFile    : '/var/log/boot.log',
});
