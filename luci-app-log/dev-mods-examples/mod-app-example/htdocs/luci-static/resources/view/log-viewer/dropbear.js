'use strict';
'require view.log-viewer.log-system as abc';

return abc.view.extend({
	viewName         : 'dropbear',
	title            : _('Dropbear'),
	enableAutoRefresh: false,
	appPattern       : 'dropbear\[[0-9]*\]:',
});
