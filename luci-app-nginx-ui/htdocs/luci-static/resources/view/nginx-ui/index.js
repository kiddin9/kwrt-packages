// SPDX-License-Identifier: Apache-2.0

'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require validation';
'require view';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList('nginx-ui'), {}).then(function (res) {
		var isRunning = false;
		try {
			isRunning = res['nginx-ui']['instances']['instance1']['running'];
		} catch (e) { }
		return isRunning;
	});
}

function renderStatus(isRunning, port) {
	var spanTemp = '<span style="color:%s"><strong>%s %s</strong></span>';
	var renderHTML;
	if (isRunning) {
		var button = String.format('&#160;<a class="btn cbi-button" href="http://%s:%s" target="_blank" rel="noreferrer noopener">%s</a>',
			window.location.hostname, port, _('Open Web Interface'));
		renderHTML = spanTemp.format('green', _('nginx-ui'), _('RUNNING')) + button;
	} else {
		renderHTML = spanTemp.format('red', _('nginx-ui'), _('NOT RUNNING'));
	}

	return renderHTML;
}

var stubValidator = {
	factory: validation,
	apply: function(type, value, args) {
		if (value != null)
			this.value = value;

		return validation.types[type].apply(this, args);
	},
	assert: function(condition) {
		return !!condition;
	}
};

return view.extend({
	load: function() {
		return Promise.all([
			uci.load('nginx-ui')
		]);
	},

	render: function(data) {
		let m, s, o;
		var webport = uci.get(data[0], 'config', 'port') || '9000';

		m = new form.Map('nginx-ui', _('Nginx UI'),
            _('A modern UI for Nginx web server management.'));

		s = m.section(form.TypedSection);
		s.anonymous = true;
		s.render = function () {
			poll.add(function () {
				return L.resolveDefault(getServiceStatus()).then(function (res) {
					var view = document.getElementById('service_status');
					view.innerHTML = renderStatus(res, webport);
				});
			});

			return E('div', { class: 'cbi-section', id: 'status_bar' }, [
					E('p', { id: 'service_status' }, _('Collecting data...'))
			]);
		}

		s = m.section(form.NamedSection, 'config', 'nginx-ui');

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Value, 'listen_addr', _('Listen address'));
		o.placeholder = '0.0.0.0';
		o.validate = function(section_id, value) {
			if (section_id && value) {
				var m4 = value.match(/^([^\[\]:]+)$/),
				    m6 = value.match(/^\[(.+)\]$/ );

				if ((!m4 && !m6) || !stubValidator.apply('ipaddr', m4 ? m4[1] : m6[1]))
					return _('Expecting: %s').format(_('valid IP address'));
			}
			return true;
		}

		o = s.option(form.Value, 'port', _('Listen port'));
		o.datatype = 'port';
		o.placeholder = '5244';

		return m.render();
	}
});
