'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require rpc';
'require fs';

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

// SFO warning for dynamic rule parameters
function addSfoWarning(description, paramName) {
    var dynamicParams = [
        'UDP_RATE_LIMIT_ENABLED',
        'TCP_UPGRADE_ENABLED', 
        'TCP_DOWNPRIO_INITIAL_ENABLED',
        'TCP_DOWNPRIO_SUSTAINED_ENABLED'
    ];
    
    if (dynamicParams.includes(paramName)) {
        var sfoEnabled = uci.get('firewall', '@defaults[0]', 'flow_offloading') === '1';
        if (sfoEnabled) {
            return description + ' ⚠ May not work with Software Flow Offloading enabled';
        }
    }
    return description;
}

return view.extend({
    handleSaveApply: function(ev) {
        return this.handleSave(ev)
            .then(() => ui.changes.apply())
            .then(() => uci.load('qosmate'))
            .then(() => uci.get_first('qosmate', 'global', 'enabled'))
            .then(enabled => {
                if (enabled === '0') {
                    return fs.exec_direct('/etc/init.d/qosmate', ['stop']);
                } else {
                    return fs.exec_direct('/etc/init.d/qosmate', ['restart']);
                }
            })
            .then(() => {
                ui.hideModal();
                window.location.reload();
            })
            .catch(err => {
                ui.hideModal();
                ui.addNotification(null, E('p', _('Failed to save settings or update QoSmate service: ') + err.message));
            });
    },
    
    render: function() {
        return Promise.all([
            uci.load('qosmate'),
            uci.load('firewall')
        ]).then(() => {
            var m, s, o;

            m = new form.Map('qosmate', _('QoSmate Advanced Settings'), _('Configure advanced settings for QoSmate.'));

        // Link Layer Settings
        s = m.section(form.NamedSection, 'advanced', 'advanced', _('Link Layer Settings'), 
            _('Configure link layer adaptation settings. For detailed information about different link types and overhead calculations, please check the ') + 
            '<a href="https://openwrt.org/docs/guide-user/network/traffic-shaping/sqm-details" target="_blank" style="color: #1976d2; text-decoration: none;">OpenWrt SQM Documentation</a>.');
        s.anonymous = true;
        
        o = s.option(form.ListValue, 'COMMON_LINK_PRESETS', _('Link Type'), 
            _('Select your connection type for overhead calculation. Used by all QDiscs (HTB, HFSC, Hybrid, CAKE).'));
        o.value('ethernet', _('Ethernet (HFSC/HTB: 40B, CAKE: 40B override)'));
        o.value('docsis', _('Cable DOCSIS (25B)'));
        o.value('atm', _('DSL ATM/ADSL (44B)'));
        // CAKE native presets
        o.value('cake-ethernet', _('[CAKE] Ethernet (38B native)'));
        o.value('raw', _('[CAKE] Raw (No overhead)'));
        o.value('conservative', _('[CAKE] Conservative (48B + ATM)'));
        o.value('pppoa-vcmux', _('PPPoA VC-Mux'));
        o.value('pppoa-llc', _('PPPoA LLC'));
        o.value('pppoe-vcmux', _('PPPoE VC-Mux'));
        o.value('pppoe-llcsnap', _('PPPoE LLC-SNAP'));
        o.value('bridged-vcmux', _('Bridged VC-Mux'));
        o.value('bridged-llcsnap', _('Bridged LLC-SNAP'));
        o.value('ipoa-vcmux', _('IPoA VC-Mux'));
        o.value('ipoa-llcsnap', _('IPoA LLC-SNAP'));
        o.value('pppoe-ptm', _('PPPoE PTM'));
        o.value('bridged-ptm', _('Bridged PTM'));
        o.default = 'ethernet';
        o.rmempty = false;

        o = s.option(form.Value, 'OVERHEAD', _('Manual Overhead (bytes)'), 
            _('Override automatic overhead. For HFSC/HTB: Ethernet=40, DOCSIS=25, ATM=44. CAKE will add this to its preset.'));
        o.placeholder = 'Auto';
        o.datatype = 'uinteger';
        o.rmempty = true;
        
        o = s.option(form.Value, 'MPU', _('MPU'), 
            _('Minimum packet unit size. Used primarily by CAKE, ignored by other QDiscs.'));
        o.placeholder = 'Default: based on preset';
        o.datatype = 'uinteger';
        o.rmempty = true;
        
        o = s.option(form.Value, 'LINK_COMPENSATION', _('Link Compensation'), 
            _('Additional link compensation (atm, ptm, noatm). Affects overhead calculations.'));
        o.placeholder = 'Default: based on preset';
        o.rmempty = true;
        
        o = s.option(form.Value, 'ETHER_VLAN_KEYWORD', _('Ether VLAN Keyword'), 
            _('Ethernet VLAN keyword for CAKE. Ignored by other QDiscs.'));
        o.placeholder = 'Default: none';
        o.rmempty = true;

        // Advanced Settings
        s = m.section(form.NamedSection, 'advanced', 'advanced', _('Advanced Settings'));
        s.anonymous = true;

        function createOption(name, title, description, placeholder, datatype) {
            var opt = s.option(form.Value, name, title, description);
            opt.datatype = datatype || 'string';
            opt.rmempty = true;
            opt.placeholder = placeholder;
            
            if (datatype === 'uinteger') {
                opt.validate = function(section_id, value) {
                    if (value === '' || value === null) return true;
                    if (!/^\d+$/.test(value)) return _('Must be a non-negative integer or empty');
                    return true;
                };
            }
            if (datatype === 'integer') {
                opt.validate = function(section_id, value) {
                    if (value === '' || value === null) return true;
                    if (!/^-?\d+$/.test(value)) return _('Must be an integer or empty');
                    return true;
                };
            }
            return opt;
        }

        o = s.option(form.Flag, 'PRESERVE_CONFIG_FILES', _('Preserve Config Files'), _('Preserve configuration files during system upgrade'));
        o.rmempty = false;

        o = s.option(form.Flag, 'WASHDSCPUP', _('Wash DSCP Egress'), _('Sets DSCP to CS0 for outgoing packets after classification'));
        o.rmempty = false;

        o = s.option(form.Flag, 'WASHDSCPDOWN', _('Wash DSCP Ingress'), _('Sets DSCP to CS0 for incoming packets before classification'));
        o.rmempty = false;

        createOption('BWMAXRATIO', _('Bandwidth Max Ratio'), _('Max download/upload ratio to prevent upstream congestion'), _('Default: 20'), 'uinteger');
        createOption('ACKRATE', _('ACK Rate'), _('Sets rate limit for TCP ACKs, helps prevent ACK flooding / set to 0 to disable ACK rate limit'), _('Default: 5% of UPRATE'), 'uinteger');

        o = s.option(form.Flag, 'UDP_RATE_LIMIT_ENABLED', _('Enable UDP Rate Limit'), _(addSfoWarning('Downgrades UDP traffic exceeding 450 pps to lower priority', 'UDP_RATE_LIMIT_ENABLED')));
        o.rmempty = false;

        o = s.option(form.Flag, 'TCP_UPGRADE_ENABLED', _('Boost Low-Volume TCP Traffic'), _(addSfoWarning('Upgrade DSCP to AF42 for TCP connections with less than 150 packets per second. This can improve responsiveness for interactive TCP services like SSH, web browsing, and instant messaging.', 'TCP_UPGRADE_ENABLED')));
        o.rmempty = false;
        o.default = '1';

        o = s.option(form.Flag, 'TCP_DOWNPRIO_INITIAL_ENABLED', _('Enable Initial TCP Down-Prioritization'), _(addSfoWarning('Downgrades the first ~500ms of TCP traffic (except CS1) to CS0 to prevent initial bursts', 'TCP_DOWNPRIO_INITIAL_ENABLED')));
        o.rmempty = false;
        o.default = '1';

        o = s.option(form.Flag, 'TCP_DOWNPRIO_SUSTAINED_ENABLED', _('Enable Sustained TCP Down-Prioritization'), _(addSfoWarning('Downgrades TCP flows exceeding ~10 seconds worth of data transfer to CS1 (Bulk). Helps prevent large downloads from starving other traffic.', 'TCP_DOWNPRIO_SUSTAINED_ENABLED')));
        o.rmempty = false;
        o.default = '1';

        createOption('UDPBULKPORT', _('UDP Bulk Ports'), _('Specify UDP ports for bulk traffic'), _('Default: none'));
        createOption('TCPBULKPORT', _('TCP Bulk Ports'), _('Specify TCP ports for bulk traffic'), _('Default: none'));
        
        o = s.option(form.Value, 'MSS', _('TCP MSS'), _('Maximum Segment Size for TCP connections. This setting is only active when the upload or download bandwidth is less than 3000 kbit/s. Leave empty to use the default value. Valid range: 536-1500'), _('Default: 536'), 'uinteger');
        o.placeholder = 'Default: 536';
        o.validate = function(section_id, value) {
            if (value === '' || value === null) 
                return true;
            
            if (!/^\d+$/.test(value))
                return _('Must be a number');
                
            let num = Number(value);
            if (num < 536 || num > 1500)
                return _('Must be between 536 and 1500');
                
            return true;
        };

        o = s.option(form.ListValue, 'NFT_HOOK', _('Nftables Hook'), _('Select the nftables hook point for the dscptag chain'));
        o.value('forward', _('forward'));
        o.value('postrouting', _('postrouting'));
        o.default = 'forward';
        o.rmempty = false;

        createOption('NFT_PRIORITY', _('Nftables Priority'), _('Set the priority for the nftables chain. Lower values are processed earlier. Default is 0 | mangle is -150.'), _('0'), 'integer');

        // Autorate Settings Section
        s = m.section(form.NamedSection, 'autorate', 'autorate', _('Autorate Settings'),
            _('Fine-tune the dynamic bandwidth adjustment algorithm. Enable Autorate in the Settings tab.'));
        s.anonymous = true;

        o = s.option(form.Value, 'interval', _('Measurement Interval (ms)'),
            _('How often to measure latency and adjust bandwidth.'));
        o.datatype = 'uinteger';
        o.placeholder = '500';
        o.rmempty = true;

        o = s.option(form.Value, 'latency_increase_threshold', _('Latency Increase Threshold (ms)'),
            _('Increase bandwidth when latency delta is below this value.'));
        o.datatype = 'uinteger';
        o.placeholder = '5';
        o.rmempty = true;

        o = s.option(form.Value, 'latency_decrease_threshold', _('Latency Decrease Threshold (ms)'),
            _('Decrease bandwidth when latency delta exceeds this value.'));
        o.datatype = 'uinteger';
        o.placeholder = '10';
        o.rmempty = true;

        o = s.option(form.Value, 'reflectors', _('Ping Reflectors'),
            _('Space-separated list of IP addresses for latency measurement.'));
        o.placeholder = '1.1.1.1 8.8.8.8 9.9.9.9';
        o.rmempty = true;

        o = s.option(form.Value, 'refractory_increase', _('Refractory Period - Increase (s)'),
            _('Minimum wait time after a rate increase before next adjustment.'));
        o.datatype = 'uinteger';
        o.placeholder = '3';
        o.rmempty = true;

        o = s.option(form.Value, 'refractory_decrease', _('Refractory Period - Decrease (s)'),
            _('Minimum wait time after a rate decrease before next adjustment.'));
        o.datatype = 'uinteger';
        o.placeholder = '1';
        o.rmempty = true;

        o = s.option(form.Value, 'adjust_up_factor', _('Adjustment Factor - Increase (%)'),
            _('Multiply current rate by this percentage when increasing (102 = 2% increase).'));
        o.datatype = 'uinteger';
        o.placeholder = '102';
        o.rmempty = true;

        o = s.option(form.Value, 'adjust_down_factor', _('Adjustment Factor - Decrease (%)'),
            _('Multiply current rate by this percentage when decreasing (85 = 15% decrease).'));
        o.datatype = 'uinteger';
        o.placeholder = '85';
        o.rmempty = true;

        o = s.option(form.Flag, 'log_changes', _('Log All Rate Changes'),
            _('Log every rate change to system log (for debugging). May spam logs.'));
        o.rmempty = false;

        o = s.option(form.Value, 'min_ul_rate', _('Min Upload Rate (kbps)'),
            _('Leave empty for auto-calculation (25% of configured upload rate).'));
        o.datatype = 'uinteger';
        o.placeholder = _('Auto');
        o.rmempty = true;

        o = s.option(form.Value, 'base_ul_rate', _('Base Upload Rate (kbps)'),
            _('Leave empty for auto-calculation (100% of configured upload rate).'));
        o.datatype = 'uinteger';
        o.placeholder = _('Auto');
        o.rmempty = true;

        o = s.option(form.Value, 'max_ul_rate', _('Max Upload Rate (kbps)'),
            _('Leave empty for auto-calculation (105% of configured upload rate).'));
        o.datatype = 'uinteger';
        o.placeholder = _('Auto');
        o.rmempty = true;

        o = s.option(form.Value, 'min_dl_rate', _('Min Download Rate (kbps)'),
            _('Leave empty for auto-calculation (25% of configured download rate).'));
        o.datatype = 'uinteger';
        o.placeholder = _('Auto');
        o.rmempty = true;

        o = s.option(form.Value, 'base_dl_rate', _('Base Download Rate (kbps)'),
            _('Leave empty for auto-calculation (100% of configured download rate).'));
        o.datatype = 'uinteger';
        o.placeholder = _('Auto');
        o.rmempty = true;

        o = s.option(form.Value, 'max_dl_rate', _('Max Download Rate (kbps)'),
            _('Leave empty for auto-calculation (105% of configured download rate).'));
        o.datatype = 'uinteger';
        o.placeholder = _('Auto');
        o.rmempty = true;

        // Update settings
        s = m.section(form.NamedSection, 'global', 'global', _('Update Settings'));
        s.anonymous = true;

        // Display current update channels
        o = s.option(form.DummyValue, '_update_channels', _('Current Update Channels'));
        o.rawhtml = true;
        o.cfgvalue = function(section_id) {
            return null;
        };
        o.write = function() {};
        o.remove = function() {};
        o.renderWidget = function() {
            return Promise.all([
                fs.exec_direct('/etc/init.d/qosmate', ['check_version'])
            ]).then(function(res) {
                var output = res[0];
                
                const backendChannelMatch = output.match(/Backend versions:[\s\S]*?Update channel: (.+)/);
                const frontendChannelMatch = output.match(/Frontend versions:[\s\S]*?Update channel: (.+)/);
                
                var backendChannel = backendChannelMatch ? backendChannelMatch[1].trim() : 'Unknown';
                var frontendChannel = frontendChannelMatch ? frontendChannelMatch[1].trim() : 'Unknown';
                
                var tableContainer = E('div', { 'class': 'stats-table-container' });
                var table = E('table', { 'class': 'table cbi-section-table' });
                
                var headerRow = E('tr', { 'class': 'tr table-titles' });
                headerRow.appendChild(E('th', { 'class': 'th' }, _('Component')));
                headerRow.appendChild(E('th', { 'class': 'th' }, _('Channel')));
                table.appendChild(headerRow);
                
                var backendRow = E('tr', { 'class': 'tr' });
                backendRow.appendChild(E('td', { 'class': 'td' }, _('Backend')));
                backendRow.appendChild(E('td', { 'class': 'td' }, backendChannel));
                table.appendChild(backendRow);
                
                var frontendRow = E('tr', { 'class': 'tr' });
                frontendRow.appendChild(E('td', { 'class': 'td' }, _('Frontend')));
                frontendRow.appendChild(E('td', { 'class': 'td' }, frontendChannel));
                table.appendChild(frontendRow);
                
                tableContainer.appendChild(table);
                
                return E('div', {}, [
                    tableContainer,
                    E('div', { 'style': 'margin-top: 10px' }, [
                        E('button', {
                            'class': 'cbi-button cbi-button-neutral',
                            'click': ui.createHandlerFn(this, function() {
                                ui.showModal(_('Change Update Channel'), [
                                    E('p', {}, _('Select the update channel for QoSmate:')),
                                    E('div', { 'class': 'cbi-value' }, [
                                        E('div', { 'class': 'cbi-value-title' }, _('Channel')),
                                        E('div', { 'class': 'cbi-value-field' }, [
                                            E('select', { 'id': 'change_channel', 'class': 'cbi-input-select' }, [
                                                E('option', { 
                                                    'value': 'release', 
                                                    'selected': backendChannel === 'release' && frontendChannel === 'release'
                                                }, _('Release (stable)')),
                                                E('option', { 
                                                    'value': 'snapshot',
                                                    'selected': backendChannel === 'snapshot' && frontendChannel === 'snapshot'
                                                }, _('Snapshot (latest from main)'))
                                            ])
                                        ])
                                    ]),
                                    E('div', { 'class': 'right' }, [
                                        E('button', {
                                            'class': 'btn',
                                            'click': ui.hideModal
                                        }, _('Cancel')),
                                        ' ',
                                        E('button', {
                                            'class': 'cbi-button cbi-button-positive',
                                            'click': ui.createHandlerFn(this, function() {
                                                var channelSelect = document.querySelector('.modal [id="change_channel"]');
                                                var selectedChannel = channelSelect ? channelSelect.value : 'release';
                                                
                                                ui.showModal(_('Changing Update Channel'), [
                                                    E('p', { 'class': 'spinning' }, _('Please wait while the update channel is being changed...'))
                                                ]);
                                                
                                                // Need to update both components to change channel
                                                var updateArgs = ['update', '-f', '-v', selectedChannel];
                                                
                                                console.log('Executing channel change:', '/etc/init.d/qosmate', updateArgs);
                                                
                                                return fs.exec_direct('/etc/init.d/qosmate', updateArgs)
                                                    .then(function(result) {
                                                        console.log('Channel change result:', result);
                                                        
                                                        if (result && (result.includes('error') || result.includes('Error') || result.includes('failed'))) {
                                                            ui.hideModal();
                                                            ui.addNotification(null, E('p', _('Update channel change encountered issues: %s').format(result)), 'warning');
                                                            return;
                                                        }
                                                        
                                                        ui.hideModal();
                                                        ui.addNotification(null, E('p', _('Update channel changed to %s. Reloading page...').format(selectedChannel)), 'success');
                                                        
                                                        window.setTimeout(function() { 
                                                            location.reload(); 
                                                        }, 2000);
                                                    })
                                                    .catch(function(err) {
                                                        console.error('Channel change error:', err);
                                                        ui.hideModal();
                                                        
                                                        var errorMessage = _('Failed to change update channel');
                                                        if (err) {
                                                            if (typeof err === 'string') {
                                                                errorMessage += ': ' + err;
                                                            } else if (err.message) {
                                                                errorMessage += ': ' + err.message;
                                                            } else {
                                                                errorMessage += ': ' + JSON.stringify(err);
                                                            }
                                                        }
                                                        
                                                        ui.addNotification(null, E('p', errorMessage), 'error');
                                                    });
                                            })
                                        }, _('Change Channel'))
                                    ])
                                ]);
                            })
                        }, _('Change Update Channel'))
                    ])
                ]);
            });
        };

            return m.render();
        });
    }
});
