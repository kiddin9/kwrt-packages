'use strict';
'require form';
'require poll';
'require rpc';
'require uci';
'require ui';
'require view';

const btnStyleEnabled  = 'btn cbi-button-save';
const btnStyleDisabled = 'btn cbi-button-reset';

return view.extend({
	appName   : 'cpu-perf',
	initStatus: null,

	callCpuPerf: rpc.declare({
		object: 'luci.cpu-perf',
		method: 'getCpuPerf',
		expect: { '': {} }
	}),

	callInitStatus: rpc.declare({
		object: 'luci',
		method: 'getInitList',
		params: [ 'name' ],
		expect: { '': {} }
	}),

	callInitAction: rpc.declare({
		object: 'luci',
		method: 'setInitAction',
		params: [ 'name', 'action' ],
		expect: { result: false }
	}),

	getInitStatus() {
		return this.callInitStatus(this.appName).then(res => {
			if(res) {
				return res[this.appName].enabled;
			} else {
				throw _('Command failed');
			}
		}).catch(e => {
			ui.addNotification(null,
				E('p', _('Failed to get %s init status: %s').format(this.appName, e)));
		});
	},

	handleServiceAction(action) {
		return this.callInitAction(this.appName, action).then(success => {
			if(!success) {
				throw _('Command failed');
			};
			return true;
		}).catch(e => {
			ui.addNotification(null,
				E('p', _('Service action failed "%s %s": %s').format(this.appName, action, e)));
		});
	},

	serviceRestart(ev) {
		poll.stop();
		return this.handleServiceAction('restart').then(() => {
			poll.start();
		});
	},

	freqFormat(freq) {
		if(!freq) {
			return '-';
		};
		return (freq >= 1000000) ?
			(freq / 1000000) + ' ' + _('GHz')
		:
			(freq / 1000) + ' ' + _('MHz');
	},

	updateCpuPerfData() {
		this.callCpuPerf().then((data) => {
			if(data.cpus) {
				for(let i of Object.values(data.cpus)) {
					let policy = data.freqPolicies[String(i.policy)];
					if(policy) {
						document.getElementById('cpu' + i.number + 'number').textContent =
							_('CPU') + ' ' + i.number;
						document.getElementById('cpu' + i.number + 'curFreq').textContent =
							(policy.sCurFreq) ?
								this.freqFormat(policy.sCurFreq)
							:
								this.freqFormat(policy.curFreq);
						document.getElementById('cpu' + i.number + 'minFreq').textContent =
							(policy.sMinFreq) ?
								this.freqFormat(policy.sMinFreq)
							:
								this.freqFormat(policy.minFreq)
						document.getElementById('cpu' + i.number + 'maxFreq').textContent =
							(policy.sMaxFreq) ?
								this.freqFormat(policy.sMaxFreq)
							:
								this.freqFormat(policy.maxFreq);
						document.getElementById('cpu' + i.number + 'governor').textContent =
							policy.governor || '-';
					};
				};
			};
			if(data.ondemand) {
				document.getElementById('OdUpThreshold').textContent =
					data.ondemand.upThreshold || '-';
				document.getElementById('OdIgnNiceLoad').textContent =
					(data.ondemand.ignNiceLoad !== undefined) ?
						data.ondemand.ignNiceLoad : '-';
				document.getElementById('OdSmpDownFactor').textContent =
					data.ondemand.smpDownFactor || '-';
				document.getElementById('OdPowersaveBias').textContent =
					(data.ondemand.powersaveBias !== undefined) ?
						data.ondemand.powersaveBias : '-';
			};
			if(data.conservative) {
				document.getElementById('CoFreqStep').textContent =
					(data.conservative.freqStep !== undefined) ?
						data.conservative.freqStep : '-';
				document.getElementById('CoDownThreshold').textContent =
					data.conservative.downThreshold || '-';
				document.getElementById('CoSmpDownFactor').textContent =
					data.conservative.smpDownFactor || '-';
			};
			if(data.eas) {
				document.getElementById('EasSchedEnergyAware').textContent =
					(data.eas.schedEnergyAware !== undefined) ?
						data.eas.schedEnergyAware : '-';
			};
			if(data.pcieAspm) {
				document.getElementById('PaCurrentPolicy').textContent =
					data.pcieAspm.currentPolicy || '-';
			};
		}).catch(e => {});
	},

	CBIBlockPerf: form.Value.extend({
		__name__ : 'CBI.BlockPerf',

		__init__(map, section, ctx, perfData) {
			this.map      = map;
			this.section  = section;
			this.ctx      = ctx;
			this.perfData = perfData;
			this.optional = true;
			this.rmempty  = true;
		},

		renderWidget(section_id, option_index, cfgvalue) {
			let cpuTableTitles = [
				_('CPU'),
				_('Current frequency'),
				_('Minimum frequency'),
				_('Maximum frequency'),
				_('Scaling governor'),
			];

			let cpuTable = E('table', { 'class': 'table' },
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th left' }, cpuTableTitles[0]),
					E('th', { 'class': 'th left' }, cpuTableTitles[1]),
					E('th', { 'class': 'th left' }, cpuTableTitles[2]),
					E('th', { 'class': 'th left' }, cpuTableTitles[3]),
					E('th', { 'class': 'th left' }, cpuTableTitles[4]),
				])
			);

			let ondemandTable, conservativeTable, easTable, pcieAspmTable;

			if(this.perfData) {
				if(this.perfData.cpus) {
					for(let i of Object.values(this.perfData.cpus)) {
						let policy = this.perfData.freqPolicies[String(i.policy)];
						if(policy) {
							cpuTable.append(
								E('tr', { 'class': 'tr' }, [
									E('td', {
										'id': 'cpu' + i.number + 'number',
										'class': 'td left',
										'data-title': cpuTableTitles[0],
									}, _('CPU') + ' ' + i.number),
									E('td', {
										'id': 'cpu' + i.number + 'curFreq',
										'class': 'td left',
										'data-title': cpuTableTitles[1],
									}, (policy.sCurFreq) ?
											this.ctx.freqFormat(policy.sCurFreq)
										:
											this.ctx.freqFormat(policy.curFreq)
									),
									E('td', {
										'id': 'cpu' + i.number + 'minFreq',
										'class': 'td left',
										'data-title': cpuTableTitles[2],
									}, (policy.sMinFreq) ?
											this.ctx.freqFormat(policy.sMinFreq)
										:
											this.ctx.freqFormat(policy.minFreq)
									),
									E('td', {
										'id': 'cpu' + i.number + 'maxFreq',
										'class': 'td left',
										'data-title': cpuTableTitles[3],
									}, (policy.sMaxFreq) ?
											this.ctx.freqFormat(policy.sMaxFreq)
										:
											this.ctx.freqFormat(policy.maxFreq)
									),
									E('td', {
										'id': 'cpu' + i.number + 'governor',
										'class': 'td left',
										'data-title': cpuTableTitles[4],
									}, policy.governor || '-'),
								])
							);
						};
					};
				};
				if(this.perfData.ondemand) {
					ondemandTable = E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left', 'style':'width:33%' }, "up_threshold"),
							E('td', { 'id': 'OdUpThreshold', 'class': 'td left' },
								this.perfData.ondemand.upThreshold || '-'),
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left' }, "ignore_nice_load"),
							E('td', { 'id': 'OdIgnNiceLoad', 'class': 'td left' },
								(this.perfData.ondemand.ignNiceLoad !== undefined) ?
									this.perfData.ondemand.ignNiceLoad : '-'),
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left' }, "sampling_down_factor"),
							E('td', { 'id': 'OdSmpDownFactor', 'class': 'td left' },
								this.perfData.ondemand.smpDownFactor || '-'),
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left' }, "powersave_bias"),
							E('td', { 'id': 'OdPowersaveBias', 'class': 'td left' },
								(this.perfData.ondemand.powersaveBias !== undefined) ?
									this.perfData.ondemand.powersaveBias : '-'),
						]),
					]);
				};
				if(this.perfData.conservative) {
					conservativeTable = E('table', { 'class': 'table' }, [
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left', 'style':'width:33%' }, "freq_step"),
							E('td', { 'id': 'CoFreqStep', 'class': 'td left' },
								(this.perfData.conservative.freqStep !== undefined) ?
									this.perfData.conservative.freqStep : '-'),
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left' }, "down_threshold"),
							E('td', { 'id': 'CoDownThreshold', 'class': 'td left' },
								this.perfData.conservative.downThreshold || '-'),
						]),
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left' }, "sampling_down_factor"),
							E('td', { 'id': 'CoSmpDownFactor', 'class': 'td left' },
								this.perfData.conservative.smpDownFactor || '-'),
						]),
					]);
				};
				if(this.perfData.pcieAspm) {
					pcieAspmTable = E('table', { 'class': 'table' },
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left', 'style':'width:33%' }, "policy"),
							E('td', { 'id': 'PaCurrentPolicy', 'class': 'td left' },
								this.perfData.pcieAspm.currentPolicy || '-'),
						])
					);
				};
				if(this.perfData.eas) {
					easTable = E('table', { 'class': 'table' },
						E('tr', { 'class': 'tr' }, [
							E('td', { 'class': 'td left', 'style':'width:33%' }, "sched_energy_aware"),
							E('td', { 'id': 'EasSchedEnergyAware', 'class': 'td left' },
								(this.perfData.eas.schedEnergyAware !== undefined) ?
									this.perfData.eas.schedEnergyAware : '-'),
						])
					);
				};
			};
			if(cpuTable.childNodes.length === 1){
				cpuTable.append(
					E('tr', { 'class': 'tr placeholder' },
						E('td', { 'class': 'td' },
							E('em', {}, _('No performance data...'))
						)
					)
				);
			};
			let tables = [ cpuTable ];
			if(ondemandTable) {
				tables.push(
					E('h3', {}, _("Ondemand governor")),
					ondemandTable
				);
			};
			if(conservativeTable) {
				tables.push(
					E('h3', {}, _("Conservative governor")),
					conservativeTable,
				);
			};
			if(easTable) {
				tables.push(
					E('h3', {}, _("EAS")),
					easTable,
				);
			};
			if(pcieAspmTable) {
				tables.push(
					E('h3', {}, _("PCIe ASPM")),
					pcieAspmTable,
				);
			};
			return E(tables);
		},
	}),

	CBIBlockInitButton: form.Value.extend({
		__name__ : 'CBI.BlockInitButton',

		__init__(map, section, ctx) {
			this.map      = map;
			this.section  = section;
			this.ctx      = ctx;
			this.optional = true;
			this.rmempty  = true;
		},

		renderWidget(section_id, option_index, cfgvalue) {
			this.ctx.initButton = E('button', {
				'class': (!this.ctx.initStatus) ? btnStyleDisabled : btnStyleEnabled,
				'click': ui.createHandlerFn(this, () => {
					return this.ctx.handleServiceAction(
						(!this.ctx.initStatus) ? 'enable' : 'disable'
					).then(success => {
						if(!success) {
							return;
						};
						if(!this.ctx.initStatus) {
							this.ctx.initButton.textContent = _('Enabled');
							this.ctx.initButton.className   = btnStyleEnabled;
							this.ctx.initStatus             = true;
						} else {
							this.ctx.initButton.textContent = _('Disabled');
							this.ctx.initButton.className   = btnStyleDisabled;
							this.ctx.initStatus             = false;
						};
					});
				}),
			}, (!this.ctx.initStatus) ? _('Disabled') : _('Enabled'));

			return E([
				E('label', { 'class': 'cbi-value-title', 'for': 'initButton' },
					_('Run at startup')
				),
				E('div', { 'class': 'cbi-value-field' }, [
					E('div', {}, this.ctx.initButton),
					E('input', {
						'id'  : 'initButton',
						'type': 'hidden',
					}),
				]),
			]);
		},
	}),

	freqValidate(section_id, value, slave_elem, max=false) {
		let slaveValue = slave_elem.formvalue(section_id);
		if(value === '' || slaveValue === '') {
			return true;
		};
		value      = Number(value);
		slaveValue = Number(slaveValue);
		if((max && value >= slaveValue) || (!max && value <= slaveValue)) {
			return true;
		};
		return `${_('Frequency value must not be')} ${max ? _('lower') : _('higher')} ${_('than the')} "${slave_elem.title}"!`;
	},

	load() {
		return Promise.all([
			this.getInitStatus(),
			this.callCpuPerf(),
			uci.load(this.appName),
		]).catch(e => {
			ui.addNotification(null, E('p', _('An error has occurred') + ': %s'.format(e.message)));
		});
	},

	render(data) {
		if(!data) {
			return;
		};

		this.initStatus      = data[0];
		let cpuPerfDataArray = data[1];
		let freqPolicyArray  = cpuPerfDataArray.freqPolicies || {};
		let pcieAspmPolicies;
		if(cpuPerfDataArray.pcieAspm) {
			pcieAspmPolicies = cpuPerfDataArray.pcieAspm.availPolicies;
		};
		let easValue;
		if(cpuPerfDataArray.eas) {
			easValue = cpuPerfDataArray.eas.schedEnergyAware;
		};

		let s, o, ss;
		let m = new form.Map(this.appName,
			_('CPU Performance'),
			_('CPU performance management.'));

		s = m.section(form.NamedSection, 'config', 'main');

		/* Status */

		s.tab('values', _('Current values'));

		o = s.taboption('values', this.CBIBlockPerf, this, cpuPerfDataArray);

		/* Performance managment */

		s.tab('performance', _('Performance managment'));

		// enabled
		o = s.taboption('performance', form.Flag, 'enabled',
			_('Enable'));
		o.rmempty = false;

		// init button
		o = s.taboption('performance', this.CBIBlockInitButton, this);

		/* CPU frequency policies */

		let sections = uci.sections(this.appName, 'cpu_freq_policy');

		if(sections.length == 0) {
			o = s.taboption('performance', form.DummyValue, '_dummy');
			o.rawhtml = true;
			o.default = '<label class="cbi-value-title"></label><div class="cbi-value-field"><em>' +
				_('CPU performance scaling is not available...') +
				'</em></div>';
		} else {
			for(let section of sections) {
				let sectionName = section['.name'];
				let policyNum   = Number(sectionName.replace('policy', ''));
				let cpuString   = '';
				let cpus        = freqPolicyArray[policyNum].cpu;
				if(cpus && cpus.length > 0) {
					let cpuArr = [];
					cpus.forEach(e => {
						cpuArr.push(_('CPU') + ' ' + e);
					});
					if(cpuArr.length > 0) {
						cpuString = cpuArr.join(', ');
					};
				};

				let o;
				o        = s.taboption('performance', form.SectionValue,
						'cpu_freq_policy', form.NamedSection, sectionName, 'cpu_freq_policy');
				ss       = o.subsection;
				ss.title = _('Policy') + ' ' + policyNum + ' ( ' + cpuString + ' )';

				if(freqPolicyArray[policyNum]) {
					if(freqPolicyArray[policyNum].sAvailGovernors &&
					   freqPolicyArray[policyNum].sAvailGovernors.length > 0) {

						// scaling_governor
						o = ss.option(form.ListValue,
							'scaling_governor', _('Scaling governor'),
							_('Scaling governors implement algorithms to estimate the required CPU capacity.')
						);
						o.rmempty  = true;
						o.optional = true;
						freqPolicyArray[policyNum].sAvailGovernors.forEach(e => o.value(e));
					};

					if(freqPolicyArray[policyNum].sMinFreq && freqPolicyArray[policyNum].sMaxFreq &&
						freqPolicyArray[policyNum].minFreq && freqPolicyArray[policyNum].maxFreq) {

						let minFreq, maxFreq;

						if(freqPolicyArray[policyNum].sAvailFreqs &&
						   freqPolicyArray[policyNum].sAvailFreqs.length > 0) {
							let availFreqs = freqPolicyArray[policyNum].sAvailFreqs.map(e =>
								[ e, this.freqFormat(e) ]
							);

							// scaling_min_freq
							minFreq = ss.option(form.ListValue,
								'scaling_min_freq', _('Minimum scaling frequency'),
								_('Minimum frequency the CPU is allowed to be running.') +
									' ('  + _('default value:') + ' <code>' +
									this.freqFormat(freqPolicyArray[policyNum].minFreq) + '</code>).'
							);
							minFreq.rmempty  = true;
							minFreq.optional = true;

							// scaling_max_freq
							maxFreq = ss.option(form.ListValue,
								'scaling_max_freq', _('Maximum scaling frequency'),
								_('Maximum frequency the CPU is allowed to be running.') +
									' ('  + _('default value:') + ' <code>' +
									this.freqFormat(freqPolicyArray[policyNum].maxFreq) + '</code>).'
							);
							maxFreq.rmempty  = true;
							maxFreq.optional = true;

							availFreqs.forEach(e => {
								minFreq.value(e[0], e[1]);
								maxFreq.value(e[0], e[1]);
							});

						} else {

							// scaling_min_freq
							minFreq = ss.option(form.Value,
								'scaling_min_freq', `${_('Minimum scaling frequency')} (${_('KHz')})`,
								_('Minimum frequency the CPU is allowed to be running.') +
									' ('  + _('default value:') + ' <code>' +
									freqPolicyArray[policyNum].minFreq + '</code>).'
							);
							minFreq.rmempty     = true;
							minFreq.optional    = true;
							minFreq.datatype    = `and(integer,range(${freqPolicyArray[policyNum].minFreq},${freqPolicyArray[policyNum].maxFreq}))`;
							minFreq.placeholder = `${freqPolicyArray[policyNum].minFreq}-${freqPolicyArray[policyNum].maxFreq} ${_('KHz')}`;

							// scaling_max_freq
							maxFreq = ss.option(form.Value,
								'scaling_max_freq', `${_('Maximum scaling frequency')} (${_('KHz')})`,
								_('Maximum frequency the CPU is allowed to be running.') +
									' ('  + _('default value:') + ' <code>' +
									freqPolicyArray[policyNum].maxFreq + '</code>).'
							);
							maxFreq.rmempty     = true;
							maxFreq.optional    = true;
							maxFreq.datatype    = `and(integer,range(${freqPolicyArray[policyNum].minFreq},${freqPolicyArray[policyNum].maxFreq}))`;
							maxFreq.placeholder = `${freqPolicyArray[policyNum].minFreq}-${freqPolicyArray[policyNum].maxFreq} ${_('KHz')}`;
						};

						minFreq.validate = L.bind(
							function(section_id, value) {
								return this.freqValidate(section_id, value, maxFreq, false);
							},
							this
						);
						maxFreq.validate = L.bind(
							function(section_id, value) {
								return this.freqValidate(section_id, value, minFreq, true);
							},
							this
						);
					};
				};

				if(!freqPolicyArray[policyNum] ||
				   !(freqPolicyArray[policyNum].sAvailGovernors &&
				   freqPolicyArray[policyNum].sAvailGovernors.length > 0) &&
				   !(freqPolicyArray[policyNum].sMinFreq && freqPolicyArray[policyNum].sMaxFreq &&
					 freqPolicyArray[policyNum].minFreq && freqPolicyArray[policyNum].maxFreq)) {
					o         = ss.option(form.DummyValue, '_dummy');
					o.rawhtml = true;
					o.default = '<label class="cbi-value-title"></label><div class="cbi-value-field"><em>' +
						_('Performance scaling is not available for this policy...') +
						'</em></div>';
				};
			};
		};

		/* Ondemand governor */

		o        = s.taboption('performance', form.SectionValue,
						'ondemand', form.NamedSection, 'ondemand', 'governor');
		ss       = o.subsection;
		ss.title = _("Ondemand governor");

		// up_threshold
		o = ss.option(form.Value,
			'up_threshold', 'up_threshold',
			_('If the estimated CPU load is above this value (in percent), the governor will set the frequency to the maximum value.')
		);
		o.rmempty     = true;
		o.optional    = true;
		o.placeholder = '1-100';
		o.datatype    = 'and(integer,range(1,100))';

		// ignore_nice_load
		o = ss.option(form.Flag,
			'ignore_nice_load', 'ignore_nice_load',
			_('If checked, it will cause the CPU load estimation code to treat the CPU time spent on executing tasks with "nice" levels greater than 0 as CPU idle time.')
		);
		o.rmempty  = true;
		o.optional = true;

		// sampling_down_factor
		o = ss.option(form.Value,
			'sampling_down_factor', 'sampling_down_factor',
			_('Frequency decrease deferral factor.')
		);
		o.rmempty     = true;
		o.optional    = true;
		o.placeholder = '1-100';
		o.datatype    = 'and(integer,range(1,100))';

		// powersave_bias
		o = ss.option(form.Value,
			'powersave_bias', 'powersave_bias',
			_('Reduction factor to apply to the original frequency target of the governor.')
		);
		o.rmempty     = true;
		o.optional    = true;
		o.placeholder = '0-1000';
		o.datatype    = 'and(integer,range(0,1000))';

		/* Conservative governor */

		o        = s.taboption('performance', form.SectionValue,
						'conservative', form.NamedSection, 'conservative', 'governor');
		ss       = o.subsection;
		ss.title = _("Conservative governor");

		// freq_step
		o = ss.option(form.Value,
			'freq_step', 'freq_step',
			_('Frequency step in percent of the maximum frequency the governor is allowed to set.')
		);
		o.rmempty     = true;
		o.optional    = true;
		o.placeholder = '1-100';
		o.datatype    = 'and(integer,range(1,100))';

		// down_threshold
		o = ss.option(form.Value,
			'down_threshold', 'down_threshold',
			_('Threshold value (in percent) used to determine the frequency change direction.')
		);
		o.rmempty     = true;
		o.optional    = true;
		o.placeholder = '1-100';
		o.datatype    = 'and(integer,range(1,100))';

		// sampling_down_factor
		o = ss.option(form.Value,
			'sampling_down_factor', 'sampling_down_factor',
			_('Frequency decrease deferral factor.')
		);
		o.rmempty     = true;
		o.optional    = true;
		o.placeholder = '1-10';
		o.datatype    = 'and(integer,range(1,10))';

		/* EAS */

		if(easValue !== undefined ) {
			o        = s.taboption('performance', form.SectionValue,
						'eas', form.NamedSection, 'eas', 'kernel');
			ss       = o.subsection;
			ss.title = _("EAS");

			// sched_energy_aware
			o = ss.option(form.Flag, 'sched_energy_aware', 'sched_energy_aware',
				_('Enable/disable Energy Aware Scheduling (EAS).')
			);
			o.rmempty = false;
			o.default = '1';
		};

		/* PCIe ASPM */

		if(pcieAspmPolicies && pcieAspmPolicies.length > 0) {
			o        = s.taboption('performance', form.SectionValue,
						'pcie_aspm', form.NamedSection, 'pcie_aspm', 'module');
			ss       = o.subsection;
			ss.title = _("PCIe ASPM");

			// policy
			o = ss.option(form.ListValue, 'policy', 'policy',
				_('Active-State Power Management (ASPM) policy for PCIe links, which saves power by putting unused PCIe links into a low-power state.')
			);
			o.rmempty  = true;
			o.optional = true;
			pcieAspmPolicies.forEach(e => o.value(e));
		};

		let mapPromise = m.render();
		mapPromise.then(node => {
			node.classList.add('fade-in');
			poll.add(L.bind(this.updateCpuPerfData, this));
		});
		return mapPromise;
	},

	handleSaveApply(ev, mode) {
		return this.handleSave(ev).then(() => {
			ui.changes.apply(mode == '0');
			window.setTimeout(() => this.serviceRestart(), 3000);
		});
	},
});
