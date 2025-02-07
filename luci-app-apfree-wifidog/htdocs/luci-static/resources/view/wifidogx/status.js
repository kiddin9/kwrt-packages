'use strict';
'require view';
'require fs';
'require poll';
'require ui';

return view.extend({
    render: function(data) {
        // Create container for status
        var container = E('div', { id: 'wifidogx-status' }, [
            E('h2', {}, _('apfree-wifidog Status'))
        ]);

        // Function to update the status information
        function updateStatus() {
            return fs.exec('/etc/init.d/wifidogx', ['status']).then(function(res) {
                if (res.code !== 0 || !res.stdout) {
                    container.innerHTML = '';
                    container.appendChild(E('h2', {}, _('apfree-wifidog Status')));
                    container.appendChild(E('p', {}, _('apfree-wifidog is not running')));
                    return; // error executing command
                }
                
                var lines = res.stdout.split('\n');
                var status = {};
                lines.forEach(function(line) {
                    if (line.startsWith('Version:'))
                        status.version = line.split(':')[1].trim();
                    else if (line.startsWith('Uptime:'))
                        status.uptime = line.split(':')[1].trim();
                    else if (line.startsWith('Internet Connectivity:'))
                        status.internetConnectivity = (line.split(':')[1].trim() === 'yes');
                    else if (line.startsWith('Auth server reachable:'))
                        status.authServerReachable = (line.split(':')[1].trim() === 'yes');
                    else if (line.startsWith('Authentication servers:')) {
                        status.authServers = [];
                        var startIdx = lines.indexOf(line) + 1;
                        for (var i = startIdx; i < lines.length; i++) {
                            if (lines[i].startsWith('  Host:')) {
                                status.authServers.push(lines[i].split(':')[1].trim());
                            } else {
                                break;
                            }
                        }
                    }
                });

                // Create table for status display
                container.innerHTML = '';
                container.appendChild(E('h2', {}, _('apfree-wifidog Status')));
                
                var table = E('table', { 'class': 'table' });
                
                // Add table rows
                var rows = [
                    [_('Version'), status.version || '-'],
                    [_('Uptime'), status.uptime || '-'],
                    [_('Internet Connectivity'), status.internetConnectivity ? _('Yes') : _('No')],
                    [_('Auth server reachable'), status.authServerReachable ? _('Yes') : _('No')]
                ];

                rows.forEach(function(row) {
                    table.appendChild(E('tr', {}, [
                        E('td', { 'class': 'td left', 'width': '33%' }, [ row[0] ]),
                        E('td', { 'class': 'td left' }, [ row[1] ])
                    ]));
                });

                // Add auth servers if available
                if (status.authServers && status.authServers.length) {
                    table.appendChild(E('tr', {}, [
                        E('td', { 'class': 'td left', 'width': '33%' }, [ _('Authentication servers') ]),
                        E('td', { 'class': 'td left' }, [
                            E('ul', { 'class': 'clean-list' }, 
                                status.authServers.map(function(srv) {
                                    return E('li', {}, srv);
                                })
                            )
                        ])
                    ]));
                }

                container.appendChild(table);
            });
        }

        // Poll status every 5 seconds
        L.Poll.add(function() {
            return updateStatus();
        }, 5);

        // Initial update
        updateStatus();

        return container;
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null
});