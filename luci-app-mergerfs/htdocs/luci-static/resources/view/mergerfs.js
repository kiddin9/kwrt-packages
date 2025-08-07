'use strict';
'require view';
'require fs';
'require ui';
'require uci';
'require rpc';
'require form';

var callMountPoints = function(){
	return (rpc.declare({
		object: 'luci',
		method: 'getMountPoints',
		expect: { result: [] }
	}))().then(function(mounts) {
		// Filter out mounts that are not managed by mergerfs
		return (mounts || []).filter(function(mount) {
			return mount.device && mount.device.startsWith('mergerfs:/');
		});
	});
};

return view.extend({

	handleUmount: function(m, mounts, i, ev) {
		return fs.exec('/bin/umount', [mounts[i].mount])
			.then(function(res){
				if (res.code === 0)
					mounts.splice(i, 1);
				else
					throw new Error(res.stderr || res.message || _('Failed to unmount'));
			})
			.then(L.bind(m.render, m))
			.catch(function(e) { ui.addNotification(null, E('p', e.message)) });
	},

	handleReload: function(m, mounts, ev) {
		return fs.exec('/etc/init.d/mergerfs', ['reload'])
		.then(()=>
			new Promise(function(resolve) {
				setTimeout(resolve, 200);
			})
		)
		.then(callMountPoints)
		.then(function(newMounts) {
			if (newMounts && newMounts.length > 0) {
				mounts.splice(0, mounts.length, ...newMounts);
			} else {
				mounts.length = 0; // Clear the mounts if no new ones found
			}
		})
		.then(L.bind(m.render, m))
		.catch(function(e) { ui.addNotification(null, E('p', e.message)) });
	},

	load: function() {
		return Promise.all([
			callMountPoints(),
		]);
	},

	render: function(data) {
		var m, s, o;
		m = new form.Map('mergerfs', _('MergerFS Pool'), _('MergerFS is a union filesystem, which allows you to pool multiple directories into a single mount point.<br>This is useful for combining storage space and files from multiple devices or directories into one accessible location.<br>New files can be distributed across the pooled directories based on various policies, such as most free space or first found.<br>More information can be found at <a target="_blank" href="https://github.com/trapexit/mergerfs">GitHub</a>.'));

		var mounts = data[0]||[];

		// Mount status table
		s = m.section(form.GridSection, '_mtab');

		s.render = L.bind(function(view, section_id) {
			var desc = E('div', { 'class': 'cbi-section-descr' },
				_('If mounting fails, search "mergerfs" in the <a href="/cgi-bin/luci/admin/status/logs">system log</a> for more information.')
			);
			var reload = E('div', { 'class': 'cbi-section-node' }, [
				E('button', {
					'class': 'btn cbi-button-reload',
					'click': ui.createHandlerFn(view, 'handleReload', m, mounts),
				}, [ _('Mount Configured MergerFS') ])
			]);
			var table = E('table', { 'class': 'table cbi-section-table' }, [
				E('tr', { 'class': 'tr table-titles' }, [
					E('th', { 'class': 'th' }, _('Mount Point')),
					E('th', { 'class': 'th center' }, _('Available')),
					E('th', { 'class': 'th center' }, _('Used')),
					E('th', { 'class': 'th' }, _('Unmount'))
				])
			]);

			var rows = [];

			for (var i = 0; i < mounts.length; i++) {
				var used = mounts[i].size - mounts[i].free,
				    umount = true;

				if (/^\/(overlay|rom|tmp(?:\/.+)?|dev(?:\/.+)?|)$/.test(mounts[i].mount))
					umount = false;

				rows.push([
					mounts[i].mount,
					'%1024.2mB / %1024.2mB'.format(mounts[i].avail, mounts[i].size),
					'%.2f%% (%1024.2mB)'.format(100 / mounts[i].size * used, used),
					umount ? E('button', {
						'class': 'btn cbi-button-remove',
						'click': ui.createHandlerFn(view, 'handleUmount', m, mounts, i),
						'disabled': this.map.readonly || null
					}, [ _('Unmount') ]) : '-'
				]);
			}

			cbi_update_table(table, rows, E('em', _('No mounted MergerFS found')));

			return E('div', { 'class': 'cbi-section cbi-tblsection' }, [ E('h3', _('Mounted MergerFS')), desc, reload, table ]);
		}, s, this);

		// 基本信息分区
		s = m.section(form.GridSection, 'pool', _('Pool Settings'));
		s.anonymous = true;
		s.addremove = true;

		o = s.option(form.Flag, 'enabled', _('Enabled'));
		o.rmempty  = false;
		o.default = true;
		o.editable = true;

		// type: textInput, name: mountpoint
		o = s.option(form.Value, 'mountpoint', _('Mount Point'), _('Mount to this path'));
		o.datatype = 'string';
		o.placeholder = '/mnt/mergerfs';
		o.rmempty = false;
		// o.editable = true;
		o.validate = function(section_id, value) {
			value = value ? value.trim() : value;
			if (!value || !value.startsWith('/') || value === '/') {
				return _('Mount Point is required, must start with "/" and cannot be root "/"');
			}
			return true;
		};
		o.cfgvalue = function(section_id) {
			var v = uci.get('mergerfs', section_id, 'mountpoint');
			return v ? v.trim() : v;
		};
		o.write = function(section_id, formvalue) {
			return uci.set('mergerfs', section_id, 'mountpoint', formvalue ? formvalue.trim() : formvalue);
		};

		var clean_paths = function(val) {
			if (!val || typeof val !== 'string') return val;
			return val.split('\n').map(function(line) {
				line = line.trim();
				if (line.startsWith('#')) return line;
				if (line !== '/' && line.endsWith('/')) {
					return line.slice(0, -1);
				}
				return line;
			}).join('\n');
		};

		// type: textarea, name: paths
		o = s.option(form.TextValue, 'paths', _('Paths'), _("List of paths to merge, one per line. Line starting with '#' will be treated as a comment.<br>All paths must existed before mounting or the mounting will fail."));
		o.datatype = 'string';
		o.modalonly = true;
		o.rows = 5;
		o.placeholder = _('Put each folder on a new line.');
		o.validate = function(section_id, value) {
			var paths = clean_paths(value).split('\n');
			if (!paths.every(function(line) { return line.length === 0 || line.startsWith('/') || line.startsWith('#'); })) {
				return _("Each line must be a path starting with a '/' or be a comment starting with '#'.");
			}
			if (!paths.some(function(line) { return line && line.startsWith('/'); })) {
				return _('You must provide at least one valid path (not a comment or empty line).');
			}
			return true;
		};
		o.cfgvalue = function(section_id) {
			var v = uci.get('mergerfs', section_id, 'paths');
			return clean_paths(v);
		};
		o.write = function(section_id, formvalue) {
			return uci.set('mergerfs', section_id, 'paths', clean_paths(formvalue));
		};

		// type: select, name: createpolicy
		o = s.option(form.ListValue, 'createpolicy', _('Create policy'), _('Policy for creating new files'));
		o.editable = true;
		o.value('epall', _('Existing path - all'));
		o.value('epff', _('Existing path - first found'));
		o.value('eplfs', _('Existing path - least free space'));
		o.value('eplus', _('Existing path - least used space'));
		o.value('epmfs', _('Existing path - most free space'));
		o.value('eppfrd', _('Existing path - percentage free random distribution'));
		o.value('eprand', _('Existing path - random'));
		o.value('erofs', _('Read-only'));
		o.value('ff', _('First found'));
		o.value('lfs', _('Least free space'));
		o.value('lus', _('Least used space'));
		o.value('mfs', _('Most free space'));
		o.value('msplfs', _('Most shared path - least free space'));
		o.value('msplus', _('Most shared path - least used space'));
		o.value('mspmfs', _('Most shared path - most free space'));
		o.value('msppfrd', _('Most shared path - percentage free random distribution'));
		o.value('newest', _('Newest file'));
		o.value('pfrd', _('Percentage free random distribution'));
		o.value('rand', _('Random'));
		o.default = 'epmfs';

		var parse_minfreespace = function(value) {
			if (!value || typeof value !== 'string') return '';
			// 去除所有空格
			value = value.replace(/\s+/g, '');
			// 转大写
			value = value.toUpperCase();
			// 去除尾部B
			if (value.endsWith('B')) value = value.slice(0, -1);
			if (value == '') return value;
			// 保证有数字+单位，且单位为K/M/G之一
			var m = value.match(/^(\d+)([KMG])$/);
			if (m) {
				return m[1] + m[2];
			}
			// 如果用户只输入了数字，默认加G
			m = value.match(/^(\d+)$/);
			if (m) {
				return m[1] + 'G';
			}
			// 否则返回原值
			return value;
		};
	
		// type: numberInput, name: minfreespace
		o = s.option(form.Value, 'minfreespace', _('Minimum free space'));
		o.placeholder = '4G';
		o.editable = true;
		o.validate = function(section_id, value) {
			var parsed = parse_minfreespace(value);
			if (parsed == '' || /^\d+[KMG]$/.test(parsed)) {
				return true;
			}
			return _('Please enter a value like 4G, 500M, 100K');
		};
		o.cfgvalue = function(section_id) {
			var v = uci.get('mergerfs', section_id, 'minfreespace');
			return parse_minfreespace(v);
		};
		o.write = function(section_id, formvalue) {
			return uci.set('mergerfs', section_id, 'minfreespace', parse_minfreespace(formvalue));
		};

		// type: textInput, name: options
		o = s.option(form.Value, 'options', _('Options'));
		o.modalonly = true;
		o.placeholder = 'defaults,cache.files=off';
		//o.default = 'defaults,cache.files=off';

		return m.render();
	}
});