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
                if (res.code !== 0)
                    return; // error executing command
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
                // Update container HTML with latest status
                container.innerHTML = '';
                container.appendChild(E('h2', {}, _('apfree-wifidog Status')));
                if (status.version)
                    container.appendChild(E('div', {}, _('Version: ') + status.version));
                if (status.uptime)
                    container.appendChild(E('div', {}, _('Uptime: ') + status.uptime));
                container.appendChild(E('div', {}, _('Internet Connectivity: ') + (status.internetConnectivity ? _('Yes') : _('No'))));
                container.appendChild(E('div', {}, _('Auth server reachable: ') + (status.authServerReachable ? _('Yes') : _('No'))));
                if (status.authServers && status.authServers.length) {
                    container.appendChild(E('div', {}, _('Authentication servers:')));
                    var list = E('ul', {});
                    status.authServers.forEach(function(srv) {
                        list.appendChild(E('li', {}, srv));
                    });
                    container.appendChild(list);
                }
            });
        }

        // Poll status every 5 seconds
        L.Poll.add(function() {
            return updateStatus();
        }, 5000);

        // Initial update
        updateStatus();

        return container;
    },

    handleSave: null,
    handleSaveApply: null,
    handleReset: null
});