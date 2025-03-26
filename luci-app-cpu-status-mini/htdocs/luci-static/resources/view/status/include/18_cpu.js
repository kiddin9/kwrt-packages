'use strict';
'require baseclass';
'require fs';

return baseclass.extend({
	title      : _('CPU Load'),

	cpuStatLast: null,

	load() {
		return L.resolveDefault(fs.read('/proc/stat'), null);
	},

	render(cpuData) {
		if(!cpuData) return;

		let cpuStat        = null;
		let statItemsArray = cpuData.trim().split('\n').filter(s => s.startsWith('cpu'));

		for(let str of statItemsArray) {
			let arr = str.split(/\s+/).slice(0, 8);
			if(arr[0] === 'cpu') {
				arr[0]  = 0;
				arr     = arr.map(e => Number(e));
				cpuStat = [
					arr[1] + arr[2] + arr[3] + arr[5] + arr[6] + arr[7],
					arr[4],
				];
			};
		};

		let cpuTable = E('table', { 'class': 'table' });
		let loadAvg  = 0;

		if(this.cpuStatLast !== null) {
			let idle = cpuStat[1] - this.cpuStatLast[1];
			let sum  = cpuStat[0] - this.cpuStatLast[0];
			loadAvg  = Math.round(100 * sum / (sum + idle));
		};

		cpuTable.append(
			E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%' }, _('Total Load')),
				E('td', { 'class': 'td' },
					E('div', {
							'class': 'cbi-progressbar',
							'title': (this.cpuStatLast !== null) ? loadAvg + '%' : _('Calculating') + '...',
						},
						E('div', { 'style': 'width:' + loadAvg + '%' })
					)
				),
			])
		);

		this.cpuStatLast = cpuStat;
		return cpuTable;
	},
});
