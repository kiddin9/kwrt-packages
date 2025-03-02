'use strict';
'require dom';
'require form';
'require fs';
'require poll';
'require view';

/*
	https://github.com/tkmsst/luci-app-cellularstatus
*/

function reception_lv(v) {
	const min = -120;
	const max = -66;

	let pc = 0;
	let vn = parseInt(v) || 0;
	if (vn != 0) {
		pc = Math.floor(100 * (1 - (max - vn) / (max - min)));
	}

	let i, c;
	if (pc >= 50) {
		if (pc >= 75) {
			if (pc > 100) {
				pc = 100;
			}
			i = L.resource('icons/signal-75-100.png');
		} else {
			i = L.resource('icons/signal-50-75.png');
		}
		c = 'green';
	} else if (pc >= 25) {
		i = L.resource('icons/signal-25-50.png');
		c = 'orange';
	} else if (pc >= 10) {
		i = L.resource('icons/signal-0-25.png');
		c = 'red';
	} else {
		if (pc > 0) {
			i = L.resource('icons/signal-0.png');
		} else {
			pc = 0;
			i = L.resource('icons/signal-none.png');
		}
		c = 'grey';
	}

	return {
		per: pc,
		icon: i,
		color: c
	};
}

function signal_lv(s, v) {
	let min, max, u;

	if (s == 'rssi') {
		min = -90;
		max = -30;
		u = 'dBm';
	} else if (s == 'rsrp') {
		min = -140;
		max = -44;
		u = 'dBm';
	} else if (s == 'rsrq') {
		min = -20;
		max = -3;
		u = 'dB';
	} else if (s == 'snr') {
		min = 0;
		max = 20;
		u = 'dB';
	}

	let pc = 0;
	let vn = parseInt(v) || 0;
	if (vn) {
		pc = Math.floor(100 * (1 - (max - vn) / (max - min)));
		pc = Math.min(Math.max(pc, 0), 100);
	}

	return {
		per: pc,
		unit: u
	};
}

const identity = ['iccid', 'imsi', 'imei', 'msisdn'];

return view.extend({
	load: function() {
		return (async function() {
			let res = {};

			for (const i of identity) {
				let s = await fs.exec_direct('/sbin/uqmi', ['-d', '/dev/cdc-wdm0', '-t', '2000' ,'--get-' + i]);						if (!s) {
					return null;
				}
				res[i] = parseInt(s.slice(1, -2)) || _('N/A');
			}
			res.signal = await fs.exec_direct('/sbin/uqmi', ['-d', '/dev/cdc-wdm0', '-t', '2000', '--get-signal-info']);

			return res;
		}()).then(function(res) {
			return res;
		});
	},

	render: function(res) {
		if (!res) {
			return E('h3', _('No information'));
		}

		const indicator = ['rssi', 'rsrp', 'rsrq', 'snr'];
		let m, s;

		m = new form.JSONMap(this.formdata, _('Cellular Network'), _('Cellular network information'));
		s = m.section(form.TypedSection, '', '', null);
		s.anonymous = true;

		pollData: poll.add(function() {
			return fs.exec_direct('/sbin/uqmi', ['-d', '/dev/cdc-wdm0', '-t', '2000', '--get-signal-info']).then(function(signal) {
				// Signal bar
				let json = JSON.parse(signal);
				let rlv = reception_lv(json.rsrp);
				let view = document.getElementById('strength');
				if (view) {
					view.innerHTML = '%s <span class="ifacebadge"><img src="%s"><span style="font-weight:bold;color:%s"> %d%%</span></span>'
					.format(json.type.toUpperCase(), rlv.icon, rlv.color, rlv.per);
				}

				// Signal value
				for (const i of indicator) {
					let view = document.getElementById(i);
					if (view) {
						let slv = signal_lv(i, json[i]);
						view.setAttribute('title', '%s %s'.format(json[i], slv.unit));
						view.firstElementChild.style.width = '%d%%'.format(slv.per);
					}
				}
			});
		});

		s.render = function() {
			// SIM information
			let table_sim = E('table', { 'class': 'table' });
			for (const i of identity) {
				table_sim.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ i.toUpperCase() ]),
					E('td', { 'class': 'td left' }, [ res[i] ])
				]));
			}

			// Connection status
			let json = JSON.parse(res.signal);
			let rlv = reception_lv(json.rsrp);
			let table_signal = E('table', { 'class': 'table' });
			table_signal.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, [ _('Signal strength') ]),
				E('td', { 'id': 'strength', 'class': 'td left' }, [
					json.type.toUpperCase(), ' ', E('span', { 'class': 'ifacebadge' }, [
						E('img', { 'src': rlv.icon }), E('span', { 'style': 'font-weight: bold; color: %s'.format(rlv.color) }, [ ' %d%%'.format(rlv.per) ])
					])
				])
			]));
			for (const i of indicator) {
				let slv = signal_lv(i, json[i]);
				table_signal.appendChild(E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [ i.toUpperCase() ]),
					E('td', { 'class': 'td left' }, E('div', {
						'id': i, 'class': 'cbi-progressbar', 'title': '%s %s'.format(json[i], slv.unit)
					}, E('div', { 'style': 'width:%d%%'.format(slv.per) })))
				]));
			}

			return E('div', { 'class': 'cbi-section' }, [
				E('h3', _('SIM Information')), table_sim, E('div'), E('h3', _('Current Connection Status')), table_signal
			]);
		};

		return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
