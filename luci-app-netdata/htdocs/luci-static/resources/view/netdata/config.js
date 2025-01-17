'use strict';
'require view';
'require fs';
'require uci';
'require ui';
'require form';

return view.extend({
//	handleSaveApply: null,
//	handleSave: null,
//	handleReset: null,

	load() {
	return Promise.all([
		L.resolveDefault(fs.stat('/usr/sbin/nginx'), {}),
		uci.load('netdata')
	]);
	},

	render(res) {
		const has_nginx = res[0].path;

		let m, s, o;

		m = new form.Map('netdata');

		s = m.section(form.TypedSection, 'netdata');
		s.anonymous = true;

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.rmempty = false;

		o = s.option(form.Value, 'port', _('Service port'));
		o.datatype = 'port';
		o.placeholder = '19999';
		o.rmempty = false;

		o = s.option(form.Flag, 'enable_ssl', _('Enable SSL'));
		o.rmempty = true;
		o.depends('nginx_support', '0');

		o = s.option(form.Value, 'cert_file', _('Cert file'));
		o.placeholder = '/etc/netdata/cert.crt';
		o.rmempty = false;
		o.retain = true;
		o.depends('enable_ssl', '1');

		o = s.option(form.Value, 'key_file', _('Cert Key file'));
		o.placeholder = '/etc/netdata/cert.key';
		o.rmempty = false;
		o.retain = true;
		o.depends('enable_ssl', '1');

		o = s.option(form.Flag, 'nginx_support', _('Nginx Support'));
		o.rmempty = true;
		if (! has_nginx) {
			o.description = _('To enable this feature you need install <b>luci-nginx</b> and <b>luci-ssl-nginx</b><br/> first');
			o.readonly = true;
		}

		o.write = function(section, value) {
			uci.set('netdata', section, 'nginx_support', has_nginx ? value : null);
		};

		o = s.option(form.Flag, 'auth', _('Enable Auth'));
		o.rmempty = true;
		o.depends('nginx_support', '1');

		o.write = function(section, value) {
			uci.set('netdata', section, 'auth', has_nginx ? value : null);
		};

		o = s.option(form.Value, 'user_passwd', _('Login Username and Password hash'));
		o.placeholder = 'admin:$apr1$t7qQjoqb$YBHtAb7VGSkjIdObMG.Oy0';
		o.rmempty = false;
		o.retain = true;
		o.depends('auth', '1');

		o = s.option(form.Button, '_webui', _('Open Web UI'));
		o.inputtitle = _('Open');
		o.inputstyle = 'apply';
		o.onclick = L.bind(function(ev, section_id) {
			const port=uci.get('netdata', section_id, 'port') || '19999';
			const ssl=uci.get('netdata', section_id, 'enable_ssl') || '0';
			const nginx=uci.get('netdata', section_id, 'nginx_support') || '0';

			window.open((nginx === '1' ? window.location.protocol : ssl === '1' ? 'https:' : 'http:') + '//' + window.location.hostname + (nginx === '1' ? '/netdata/' : ':' + port));
		}, o)

		o = s.option(form.Button, '_start', _('Start') + ' ' + _('Netdata'));
		o.inputtitle = _('Start');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return fs.exec('/etc/init.d/netdata', ['start'])
				.catch((e) => { ui.addNotification(null, E('p', e.message), 'error') });
		};

		o = s.option(form.Button, '_stop', _('Stop') + ' ' + _('Netdata'));
		o.inputtitle = _('Stop');
		o.inputstyle = 'reset';
		o.onclick = function() {
			return fs.exec('/etc/init.d/netdata', ['stop'])
				.catch((e) => { ui.addNotification(null, E('p', e.message), 'error') });
		};

		s = m.section(form.TypedSection, '_utilities');
		s.render = L.bind(function(view, section_id) {
			return  E('div',{ 'class': 'cbi-section' }, [
				E('h3', {}, [ _('Password hash generator') ]),
				E('div', { 'class': 'generator' }, [
					E('div', { 'class': 'control-group' }, [
						E('button', {
							'class': 'cbi-button cbi-button-neutral',
							'click': ui.createHandlerFn(this, () => {
								let npwn = this.map.findElement('id', '_passwd_type');

								if (npwn.type == 'password') {
									npwn.setAttribute('type', 'text');
								} else if (npwn.type == 'text') {
									npwn.setAttribute('type', 'password');
								}
							})
						}, '*'),
						E('input', {
							'id': '_passwd_type',
							'style': 'margin:5px 0',
							'class': 'cbi-input-password',
							'type': 'password',
							'value': 'type new passwd here'
						})
					]),
					E('button', {
						'class': 'cbi-button cbi-button-action',
						'click': ui.createHandlerFn(this, () => {
							let npw = this.map.findElement('id', '_passwd_type').value,
								button = document.querySelector('.generator > .cbi-button'),
								out = this.map.findElement('id', '_passwd_hash_out');

							button.setAttribute('disabled', 'true');

							return fs.exec('/usr/bin/openssl', [ 'passwd', '-apr1', npw ]).then((res) => {
								out.value = res.stdout || '';
							}).catch(e => {
								ui.addNotification(null, E('p', e.message), 'error');
							}).finally(() => {
								button.removeAttribute('disabled');
							});
						})
					}, [ _('GenNew') ]),
					E('input', {
						'id': '_passwd_hash_out',
						'style': 'margin:5px 0; width:320px',
						'type': 'text',
						'readonly': ''
					})
				])
			]);
		}, o, this);

		return m.render();
	}
});
