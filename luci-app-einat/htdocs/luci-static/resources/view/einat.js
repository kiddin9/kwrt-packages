'use strict';
'require form';
'require fs';
'require uci';
'require ui';
'require rpc';
'require poll';
'require view';
'require network';
'require tools.widgets as widgets';

const conf = 'einat';
const instance = 'einat';

const callServiceList = rpc.declare({
	object: 'service',
	method: 'list',
	params: ['name'],
	expect: { '': {} }
});

const callRcInit = rpc.declare({
	object: 'rc',
	method: 'init',
	params: ['name', 'action']
});

const callGetFeatures = rpc.declare({
	object: 'luci.einat',
	method: 'get_features',
	expect: { '': {} }
});

function getServiceStatus() {
	return L.resolveDefault(callServiceList(conf), {})
		.then((res) => {
			let isrunning = false;
			try {
				isrunning = res[conf]['instances'][instance]['running'];
			} catch (e) { }
			return isrunning;
		});
}

function handleAction(action, ev) {
	return callRcInit("einat", action).then((ret) => {
		if (ret)
			throw _('Command failed');

		return true;
	}).catch((e) => {
		ui.addNotification(null, E('p', _('Failed to execute "/etc/init.d/%s %s" action: %s').format("einat", action, e)));
	});
}

return view.extend({
	load() {
	return Promise.all([
		getServiceStatus(),
		L.resolveDefault(fs.stat('/usr/bin/einat'), null),
		callGetFeatures(),
		uci.load('einat')
	]);
	},

	poll_status(nodes, stat) {
		const isRunning = stat[0];
		let view = nodes.querySelector('#service_status');

		if (isRunning) {
			view.innerHTML = "<span style=\"color:green;font-weight:bold\">" + instance + " - " + _("SERVER RUNNING") + "</span>";
		} else {
			view.innerHTML = "<span style=\"color:red;font-weight:bold\">" + instance + " - " + _("SERVER NOT RUNNING") + "</span>";
		}
		return;
	},

	render(res) {
		const isRunning = res[0];
		const has_einat = res[1] ? res[1].path : null;
		const features = res[2];

		let m, s, o;

		m = new form.Map('einat', _('einat-ebpf'), _('eBPF-based Endpoint-Independent NAT'));

		s = m.section(form.NamedSection, '_status');
		s.anonymous = true;
		s.render = function(section_id) {
			return E('div', { class: 'cbi-section' }, [
				E('div', { id: 'service_status' }, _('Collecting data ...'))
			]);
		};

		s = m.section(form.NamedSection, 'config', instance);
		s.anonymous = true;

		o = s.option(form.Button, '_reload', _('Reload'));
		o.inputtitle = _('Reload');
		o.inputstyle = 'apply';
		o.onclick = function() {
			return handleAction('reload');
		};

		o = s.option(form.Flag, 'enabled', _('Enable'));
		o.default = o.disabled;
		o.rmempty = false;
		if (! has_einat) {
			o.description = _('To enable you need install <b>einat-ebpf</b> first');
			o.readonly = true;
		}

		o = s.option(form.ListValue, 'bpf_log_level', _('BPF tracing log level'));
		o.default = '0';
		o.value('0', 'disable - ' + _('Disable'));
		o.value('1', 'error - ' + _('Error'));
		o.value('2', 'warn - ' + _('Warn'));
		o.value('3', 'info - ' + _('Info'));
		o.value('4', 'debug - ' + _('Debug'));
		o.value('5', 'trace - ' + _('Trace'));

		o = s.option(form.ListValue, 'bpf_loader', _('BPF loading backend'));
		o.value('', _('Default'));
		if (features.features.includes('aya'))
			o.value('aya', _('aya'));
		if (features.features.includes('libbpf'))
			o.value('libbpf', _('libbpf'));

		o = s.option(form.Flag, 'nat44', _('NAT44'));
		o.default = o.disabled;
		o.rmempty = false;

		//o = s.option(form.Flag, 'nat66', _('NAT66'));
		//o.default = o.disabled;
		//o.rmempty = false;

		o = s.option(widgets.DeviceSelect, 'ifname', _('External interface'));
		o.multiple = false;
		o.noaliases = true;
		o.nobridges = true;
		o.nocreate = true;

		o = s.option(form.Value, 'ports', _('External TCP/UDP port ranges'),
			_('Please avoid conflicts with external ports used by other applications'));
		o.datatype = 'portrange';
		o.placeholder = '20000-29999';
		o.rmempty = true;

		o = s.option(widgets.NetworkSelect, 'internal_ifaces', _('Internal interfaces'),
			_('Perform source NAT for these internal networks only.'));
		o.multiple = true;
		o.nocreate = true;

		o = s.option(form.DynamicList, 'internal_subnets', _('Internal subnets'),
			_('Perform source NAT for these internal networks only.'));
		o.datatype = 'cidr';
		o.placeholder = '192.168.0.0/16';

		o = s.option(form.Flag, 'hairpin_enabled', _('Enable hairpin'),
			_('May conflict with other policy routing-based applications'));
		o.default = o.disabled;
		o.rmempty = false;

		o = s.option(widgets.DeviceSelect, 'hairpinif', _('Hairpin internal interfaces'));
		o.multiple = true;
		o.noaliases = true;
		o.nobridges = false;
		o.nocreate = true;
		o.depends('hairpin_enabled', '1');
		o.rmempty = true;
		o.retain = true;

		return m.render()
		.then(L.bind(function(m, nodes) {
			poll.add(L.bind(function() {
				return Promise.all([
					getServiceStatus()
				]).then(L.bind(this.poll_status, this, nodes));
			}, this), 3);
			return nodes;
		}, this, m));
	}
});
