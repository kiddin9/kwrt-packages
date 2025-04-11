'use strict';
'require view.log-viewer.multilog.log-multilog as abc';

return abc.view.extend({
	viewName   : 'multilog-maillog',
	title      : _('Log') + ' - ' + _('maillog'),
	autoRefresh: false,
	logFile    : '/var/log/maillog',
});
