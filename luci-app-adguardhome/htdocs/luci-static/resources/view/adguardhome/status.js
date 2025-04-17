'use strict';
'require rpc';
'require view';

return view.extend({
	load_adguardhome_config: rpc.declare({
		object: 'luci.adguardhome',
		method: 'get_config'
	}),
	load_adguardhome_status: rpc.declare({
		object: 'luci.adguardhome',
		method: 'get_status'
	}),
	load_adguardhome_statistics: rpc.declare({
		object: 'luci.adguardhome',
		method: 'get_statistics'
	}),

	generic_failure: function(message) {
		return E('div', {'class': 'error'}, [_('RPC call failure: '), message])
	},
	render_list: function ( agh_list ) {
		var table = E('ul', {});
		for (var i = 0; i < agh_list.length; i++) {
			table.appendChild(E('li', {}, agh_list[i]));
		}
		return table;
	},
	render_status_table: function (status, agh_config) {
		if (status.error) {
			return this.generic_failure(status.error)
		}
		// Take a hint from the base LuCI module for the Overview page,
		// declare the fields and use a loop to build the tabular status view.
		// Written out as key/value pairs, but it's just an iterable of elements.
		const weburl = agh_config.web_url;
		const listen_addresses = L.isObject(status.dns_addresses) ? this.render_list(status.dns_addresses) : _('Not found');
		const bootstrap_dns = L.isObject(agh_config.dns_bootstrap_dns) ? this.render_list(agh_config.dns_bootstrap_dns) : _('Not found');
		const upstream_dns = L.isObject(agh_config.dns_upstream_dns) ? this.render_list(agh_config.dns_upstream_dns) : _('Not found');
		const fields = [
			_('Running'), status.running ? _('Yes') : _('No'),
			_('Protection enabled'), status.protection_enabled ? _('Yes') : _('No'),
			_('Statistics period (days)'), agh_config.statistics_interval,
			_('Web interface'), E('button', { 'class': "cbi-button cbi-button-button" }, E('a', { 'href': weburl, 'target': '_blank' }, weburl)),
			_('DNS listen port'), status.dns_port,
			_('DNS listen addresses'), listen_addresses,
			_('Bootstrap DNS addresses'), bootstrap_dns,
			_('Upstream DNS addresses'), upstream_dns,
			_('Version'), status.version,
		];

		var table = E('table', { 'class': 'table', 'id': 'status' });
		for (var i = 0; i < fields.length; i += 2) {
			table.appendChild(E('tr', { 'class': 'tr' }, [
				E('td', { 'class': 'td left', 'width': '33%', 'vertical-align': 'text-top' }, [fields[i]]),
				E('td', { 'class': 'td left' }, [(fields[i + 1] != null) ? fields[i + 1] : _('Not found')])
			]));
		}
		return table;
	},
	render_statistics_table: function (statistics) {
		// High level statistics
		if (statistics.error) {
			return this.generic_failure(statistics.error)
		}
		const fields = [
			_('DNS queries'), statistics.num_dns_queries,
			_('DNS blocks'), statistics.num_blocked_filtering,
			_('DNS replacements (safesearch)'), statistics.num_replaced_safesearch,
			_('DNS replacements (malware/phishing)'), statistics.num_replaced_safebrowsing,
			_('Average processing time (seconds)'), statistics.avg_processing_time,
		];

		var table = E('table', { 'class': 'table', 'id': 'statistics' });
		for (var i = 0; i < fields.length; i += 2) {
			table.appendChild(
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, [fields[i]]),
					E('td', { 'class': 'td left' }, [(fields[i + 1] != null) ? fields[i + 1] : _('Not found')])
				]));
		}
		return table;
	},
	render_top_table: function(table_id, objects) {
		var table = E('table', { 'class': 'table', 'id': table_id });
		for (var i = 0; i < objects.length; i++) {
			table.appendChild(
				E('tr', { 'class': 'tr' }, [
					E('td', { 'class': 'td left', 'width': '33%' }, Object.keys(objects[i])[0]),
					E('td', { 'class': 'td left' }, Object.values(objects[i])[0])
				])
			);
		}
		return table;
	},
	render_top_queries_table: function (statistics) {
		// Top 5 queried domains table view
		if (statistics.error) {
			return this.generic_failure(statistics.error)
		}
		if (typeof statistics.top_queried_domains === 'undefined') { return ""; }
		const top_queries = statistics.top_queried_domains.slice(0, 5);
		return this.render_top_table('top_queries', top_queries)
	},
	render_top_blocked_table: function (statistics) {
		// Top 5 blocked domains table view
		if (statistics.error) {
			return this.generic_failure(statistics.error)
		}
		if (typeof statistics.top_blocked_domains === 'undefined') { return ""; }
		const top_blocked = statistics.top_blocked_domains.slice(0, 5);
		return this.render_top_table('top_blocked', top_blocked)
	},
	// Core LuCI functions from here on.
	load: function () {
		return Promise.all([
			this.load_adguardhome_status(),
			this.load_adguardhome_statistics(),
			this.load_adguardhome_config()
		]);
	},
	render: function (data) {
		// data[0] should be load_adguardhome_status() result
		var status = data[0] || {};
		// data[1] should be load_adguardhome_statistics() result
		var statistics = data[1] || {};
		// data[2] should be load_adguardhome_config() result
		var agh_config = data[2] || {};

		// status.auth_error is only filled in when the config fetch failed
		// to get the credentials. That stops all activity, since the user must
		// first configure the username and password. Don't even bother trying
		// to make REST API calls without credentials.
		if (status.auth_error) {
			return E('div', { 'class': 'cbi-map', 'id': 'map' }, [
				E('div', { 'class': 'cbi-section' }, [
					E('div', { 'class': 'left' }, [
						E('h2', _('AdGuard Home Status - Error')),
						E('div', { 'class': 'error' }, status.auth_error),
						E('div', { 'class': 'info' }, _('Please open the Configuration section, and provide the credentials.'))
					])
				]),
			]);
		}

		// Render all the status tables as one big block.
		return E('div', { 'class': 'cbi-map', 'id': 'map' }, [
			E('div', { 'class': 'cbi-section' }, [
				E('div', { 'class': 'left' }, [
					E('h2', _('AdGuard Home Status')),
					this.render_status_table(status, agh_config)
				]),
				E('div', { 'class': 'left' }, [
					E('h3', _('AdGuard Home Statistics')),
					this.render_statistics_table(statistics)
				]),
				E('div', { 'class': 'left' }, [
					E('h3', _('Top Queried Domains')),
					this.render_top_queries_table(statistics)
				]),
				E('div', { 'class': 'left' }, [
					E('h3', _('Top Blocked Domains')),
					this.render_top_blocked_table(statistics)
				])
			]),
		]);
	},
	handleSave: null,
	handleSaveApply: null,
	handleReset: null
})
