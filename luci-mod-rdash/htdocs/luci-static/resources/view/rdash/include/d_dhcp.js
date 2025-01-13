'use strict';
'require baseclass';
'require rpc';
'require uci';
'require network';
'require validation';

const callLuciDHCPLeases = rpc.declare({
	object: 'luci-rpc',
	method: 'getDHCPLeases',
	expect: { '': {} }
});

return baseclass.extend({
	title: '',

	isMACStatic: {},

	load: function() {
		return Promise.all([
			callLuciDHCPLeases(),
			network.getHostHints(),
			L.resolveDefault(uci.load('dhcp'))
		]);
	},

	handleCreateStaticLease: function(lease, ev) {
		ev.currentTarget.classList.add('spinning');
		ev.currentTarget.disabled = true;
		ev.currentTarget.blur();

		let cfg = uci.add('dhcp', 'host');
		uci.set('dhcp', cfg, 'name', lease.hostname);
		uci.set('dhcp', cfg, 'ip', lease.ipaddr);
		uci.set('dhcp', cfg, 'mac', [lease.macaddr.toUpperCase()]);

		return uci.save()
			.then(L.bind(L.ui.changes.init, L.ui.changes))
			.then(L.bind(L.ui.changes.displayChanges, L.ui.changes));
	},

	renderLeases: function(data) {
		// Filter to show only IPv4 leases
		let leases = Array.isArray(data[0].dhcp_leases) ? data[0].dhcp_leases : [];
		let machints = data[1].getMACHints(false);
		let hosts = uci.sections('dhcp', 'host');
		let isReadonlyView = !L.hasViewPermission();

		// Store MAC addresses for static leases
		for (let i = 0; i < hosts.length; i++) {
			let host = hosts[i];

			if (host.mac) {
				let macs = L.toArray(host.mac);
				for (let j = 0; j < macs.length; j++) {
					let mac = macs[j].toUpperCase();
					this.isMACStatic[mac] = true;
				}
			}
		}

		// Count connected devices (IPv4 clients)
		let connectedDevicesCount = leases.length;

		// Create a styled div to display the total connected devices count
		let totalDevicesRow = E('div', { 'class': 'device-count' }, [
			E('h3', { 'class': 'connected-title' }, 'Connected Devices (IPv4)'),
			E('div', { 'class': 'connected-count' }, connectedDevicesCount) // Count displayed prominently
		]);

		// Table to display active IPv4 leases
		let table = E('table', { 'id': 'status_leases', 'class': 'table leases' }, [
			E('tr', { 'class': 'tr table-titles' }, [
				E('th', { 'class': 'th' }, _('Hostname')),
				E('th', { 'class': 'th' }, _('IPv4 Address')),
				E('th', { 'class': 'th' }, _('MAC Address')),
				E('th', { 'class': 'th' }, _('Lease Time Remaining')),
				isReadonlyView ? E([]) : E('th', { 'class': 'th cbi-section-actions' }, _('Static Lease'))
			])
		]);

		// Update the table with active IPv4 leases
		cbi_update_table(table, leases.map(L.bind(function(lease) {
			let exp, rows;

			if (lease.expires === false)
				exp = E('em', _('unlimited'));
			else if (lease.expires <= 0)
				exp = E('em', _('expired'));
			else
				exp = '%t'.format(lease.expires);

			let hint = lease.macaddr ? machints.filter(h => h[0] == lease.macaddr)[0] : null;
			let host = null;

			if (hint && lease.hostname && lease.hostname != hint[1])
				host = '%s (%s)'.format(lease.hostname, hint[1]);
			else if (lease.hostname)
				host = lease.hostname;

			rows = [
				host || '-',
				lease.ipaddr,
				lease.macaddr,
				exp
			];

			if (!isReadonlyView && lease.macaddr != null) {
				let mac = lease.macaddr.toUpperCase();
				rows.push(E('button', {
					'class': 'cbi-button cbi-button-apply',
					'click': L.bind(this.handleCreateStaticLease, this, lease),
					'disabled': this.isMACStatic[mac]
				}, [ _('Set Static') ]));
			}

			return rows;
		}, this)), E('em', _('There are no active leases')));

		// Return the total connected devices count and the leases table
		return E([
			totalDevicesRow, // Display total connected IPv4 devices first
			E('h3', { 'class': 'leases-title' }, 'Active DHCP Leases (IPv4 Only)'),
			table
		]);
	},

	render: function(data) {
		if (L.hasSystemFeature('dnsmasq') || L.hasSystemFeature('odhcpd'))
			return this.renderLeases(data);

		return E([]);
	}
});

