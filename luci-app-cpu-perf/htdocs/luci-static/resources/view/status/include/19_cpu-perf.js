'use strict';
'require baseclass';
'require rpc';

document.head.append(E('style', {'type': 'text/css'},
`
.cpu-perf-area {
	margin-bottom: 1em;
}
.cpu-perf-label {
	display: inline-block;
	word-wrap: break-word;
	padding: 4px 8px;
	width: 8em;
}
.cpu-perf-label-title {
	display: block;
	word-wrap: break-word;
	width: 100%;
	font-weight: bold;
}
.cpu-perf-label-value {
	display: block;
	word-wrap: break-word;
	width: 100%;
}
.cpu-perf-empty-area {
	width: 100%;
	text-align: center;
}

`))

return baseclass.extend({
	title      : _('CPU Frequency'),

	callCpuPerf: rpc.declare({
		object: 'luci.cpu-perf',
		method: 'getCpuPerf',
		expect: { '': {} }
	}),

	freqFormat(freq) {
		if(!freq) {
			return '-';
		};
		return (freq >= 1e6) ?
			Number((freq / 1e6).toFixed(3)) + ' ' + _('GHz')
		:
			Number((freq / 1e3).toFixed(3)) + ' ' + _('MHz');
	},

	load() {
		return L.resolveDefault(this.callCpuPerf(), null);
	},

	render(data) {
		if(!data) {
			return;
		};

		let cpuFreqArea = E('div', { 'class': 'cpu-perf-area' });

		if(data.cpus && data.freqPolicies) {
			for(let i of Object.values(data.cpus)) {
				let policy = data.freqPolicies[String(i.policy)];
				if(policy) {
					cpuFreqArea.append(
						E('div', { 'class': 'cpu-perf-label' }, [
							E('span', { 'class': 'cpu-perf-label-title' },
								_('CPU') + ' ' + i.number + ':'
							),
							E('span', { 'class': 'cpu-perf-label-value' },
								(policy.sCurFreq) ?
									this.freqFormat(policy.sCurFreq)
								:
									this.freqFormat(policy.curFreq)
							),
						])
					);
				};
			};
		};

		if(cpuFreqArea.childNodes.length == 0){
			cpuFreqArea.append(
				E('div', { 'class': 'cpu-perf-empty-area' },
					E('em', {}, _('No CPU frequency data available...'))
				)
			);
		};

		return cpuFreqArea;
	},
});
