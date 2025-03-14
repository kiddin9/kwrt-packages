'use strict';
'require rpc';
'require form';
'require view';
'require poll';

function renderStatus(status, agh_config) {
	var spanTemp = '<span style="color:%s"><strong>%s %s</strong></span>';
	var renderHTML;
	if (status.running) {
		var button = String.format('&#160;<a class="btn cbi-button" href="%s" target="_blank" rel="noreferrer noopener">%s</a>',
			agh_config.web_url, _('Open Web Interface'));
		renderHTML = spanTemp.format('green', _('adguardhome'), _('RUNNING')) + button;
	} else {
		renderHTML = spanTemp.format('red', _('adguardhome'), _('NOT RUNNING'));
	}

	return renderHTML;
}

return view.extend({
	load_adguardhome_config: rpc.declare({
		object: 'luci.adguardhome',
		method: 'get_config'
	}),
	load_adguardhome_status: rpc.declare({
		object: 'luci.adguardhome',
		method: 'get_status'
	}),
	load: function () {
		return Promise.all([
			this.load_adguardhome_status(),
			this.load_adguardhome_config()
		]);
	},
	render: function (data) {
		var status = data[0] || {};
		var agh_config = data[1] || {};
		// A basic configuration form; the luci.adguardhome script that
		// powers the other UI pages needs a username and password to
		// communicate with the AdguardHome REST API.
		var s, o;
		var m = new form.Map('adguardhome', _('AdGuard Home Configuration'),
			_('默认用户名admin 密码admin')
		);

		s = m.section(form.TypedSection);
		s.anonymous = true;

		s.render = function () {
			setTimeout(function() {
			poll.add(function () {
				var view = document.getElementById('service_status');
				view.innerHTML = renderStatus(status, agh_config);
			});
			}, 0);

			return E('div', { class: 'cbi-section', id: 'status_bar' }, [
					E('p', { id: 'service_status' }, _('Collecting data...'))
			]);
		}
		
		s = m.section(form.NamedSection, 'config', 'adguardhome', _('General settings'));
		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(form.Value, 'workdir', _('Work Dir'));
		o.datatype = 'string';
		o.default = '/var/lib/adguardhome';

		// 添加重定向模式选择
		o = s.option(form.ListValue, 'redirect', _('Redirect'), _('AdGuardHome redirect mode'));
		o.value('none', _('none'));
		o.value('dnsmasq-upstream', _('Run as dnsmasq upstream server'));
		o.value('redirect', _('Redirect 53 port to AdGuardHome'));
		o.value('exchange', _('Use port 53 replace dnsmasq'));
		o.default = 'none';

		o = s.option(form.Value, 'web_username', _('Username for AdGuard Home'), _('The username you configured when you set up AdGuard Home'));
		o.default = 'admin';

		o = s.option(form.Value, 'web_password', _('Password for AdGuard Home'), _('The password you configured when you set up AdGuard Home'));
		o.password = true;
		o.default = 'admin';

		var ChangePassword = form.Button.extend({
			set_passwd: rpc.declare({
				object: 'luci.adguardhome',
				method: 'set_passwd',
				params: [ 'username', 'hash' ],
			}),
			onclick: function() {
				var username = document.getElementById("widget.cbid.adguardhome.config.web_username").value;
				var password = document.getElementById("widget.cbid.adguardhome.config.web_password").value;
				var hash = TwinBcrypt.hashSync(password);
				return Promise.all([ this.set_passwd( username, hash ) ]);
			},
		});
		o = s.option(ChangePassword, 'change_password', _('Change Password'));

		var BCryptInclude = form.DummyValue.extend({
			renderWidget: function(section_id, option_index, cfgvalue) {
				return E('script', { 'type':'text/javascript', 'src':'/luci-static/resources/view/twin-bcrypt.min.js' });
			}
		});
		o = s.option(BCryptInclude, 'misc');

		return m.render();
	},
})
