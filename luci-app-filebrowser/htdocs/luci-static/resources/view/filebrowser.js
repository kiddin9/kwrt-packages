'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require view';
'require fs';

function getServiceStatus() {
		let isRunning = false;
		return isRunning;
}

function renderStatus(isRunning, port) {
	let spanTemp = '<span style="color:%s"><strong>%s %s</strong></span>';
	let renderHTML;
	if (isRunning) {
		let button = String.format('&#160;<a class="btn cbi-button" href="http://%s:%s" target="_blank" rel="noreferrer noopener">%s</a>',
			window.location.hostname, port, _('Open Web Interface'));
		renderHTML = spanTemp.format('green', _('FileBrowser'), _('RUNNING')) + button;
	} else {
		renderHTML = spanTemp.format('red', _('FileBrowser'), _('NOT RUNNING'));
	}

	return renderHTML;
}

return view.extend({
	load: async function () {
		const promises = await Promise.all([
			L.resolveDefault(fs.stat('/var/run/filebrowser.pid'), null),
			uci.load('filebrowser')
		]);
	const data = {
			isRunning: promises[0],
			conf: promises[1]
		};
	return data;
	},

	render(data) {
		let m, s, o;
		let webport = (uci.get(data.conf, 'config', 'listen_port') || '8989');

		m = new form.Map('filebrowser', _('FileBrowser'),
			_('FileBrowser provides a file managing interface within a specified directory and it can be used to upload, delete, preview, rename and edit your files..') + '<br />'+
			_('Default login username is %s and password is %s.').format('<code>admin</code>', '<code>admin</code>'));

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function() {
			poll.add(function() {
				return Promise.resolve().then(function() {
					let view = document.getElementById('service_status');
					view.innerHTML = renderStatus(data.isRunning, webport);
        });
			});

			return E('div', { class: 'cbi-section', id: 'status_bar' }, [
				E('p', { id: 'service_status' }, _('Collecting data...'))
			]);
		}

		s = m.section(form.NamedSection, 'config', 'filebrowser');

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Value, 'listen_port', _('Listen port'));
		o.datatype = 'port';
		o.default = '8989';
		o.rmempty = false;

		o = s.option(form.Value, 'root_path', _('Root directory'));
		o.default = '/';
		o.rmempty = false;
		
		o = s.option(form.Value, 'base_url', _('Base url'));
		o.default = '/';
		o.rmempty = false;

		return m.render();
	}
});
