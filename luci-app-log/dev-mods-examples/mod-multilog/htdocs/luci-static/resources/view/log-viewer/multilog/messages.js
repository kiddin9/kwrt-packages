'use strict';
'require view.log-viewer.multilog.log-multilog as abc';

return abc.view.extend({
	viewName   : 'multilog-messages',
	title      : _('Log') + ' - ' + _('messages'),
	autoRefresh: true,
	logFile    : '/var/log/messages',
});
