'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require rpc';
'require fs';
'require poll';
'require tools.widgets as widgets';

const UI_VERSION = '1.2.0';
const UI_UPD_CHANNEL = 'release';

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

function createStatusText(status, text) {
    var colors = {
        'current': '#4CAF50',  // Green
        'update': '#FF5252',   // Red
        'error': '#FFC107',    // Yellow
        'unknown': '#9E9E9E'   // Gray
    };
    
    var icons = {
        'current': '✓ ',
        'update': '↑ ',
        'error': '⚠ ',
        'unknown': '? '
    };
    
    return E('span', { 
        'style': 'color: ' + colors[status] + '; font-weight: bold; font-size: 13px;'
    }, icons[status] + text);
}

var healthCheckData = null;
var versionInfo = {
    backend: { current: 'Unknown', latest: 'Unknown', channel: 'Unknown' },
    frontend: { current: 'Unknown', latest: 'Unknown', channel: 'Unknown' }
};

// Check if Software Flow Offloading is enabled  
function isSfoEnabled() {
    return uci.get('firewall', '@defaults[0]', 'flow_offloading') === '1';
}

function fetchVersionInfo() {
    return fs.exec_direct('/etc/init.d/qosmate', ['check_version'])
        .then(function(output) {
            // Check for API limit error
            if (output.includes('HTTP error 403') || output.includes('API rate limit exceeded')) {
                console.warn('GitHub API rate limit likely reached.');

                // Try to parse current versions even if latest check failed due to rate limit
                const backendCurrentMatch = output.match(/Backend versions:[\s\S]*?Current version: (.+)/);
                const backendChannelMatch = output.match(/Backend versions:[\s\S]*?Update channel: (.+)/);
                const frontendCurrentMatch = output.match(/Frontend versions:[\s\S]*?Current version: (.+)/);
                const frontendChannelMatch = output.match(/Frontend versions:[\s\S]*?Update channel: (.+)/);

                versionInfo = {
                    backend: {
                        current: backendCurrentMatch ? backendCurrentMatch[1].trim() : 'Unknown',
                        latest: 'API limit reached',
                        channel: backendChannelMatch ? backendChannelMatch[1].trim() : 'Unknown'
                    },
                    frontend: {
                        current: frontendCurrentMatch ? frontendCurrentMatch[1].trim() : 'Unknown',
                        latest: 'API limit reached',
                        channel: frontendChannelMatch ? frontendChannelMatch[1].trim() : 'Unknown'
                    }
                };

            } else {
                 // Normal processing
                const backendCurrentMatch = output.match(/Backend versions:[\s\S]*?Current version: (.+)/);
                const backendLatestMatch = output.match(/Backend versions:[\s\S]*?Latest version: (.+)/);
                const backendChannelMatch = output.match(/Backend versions:[\s\S]*?Update channel: (.+)/);

                const frontendCurrentMatch = output.match(/Frontend versions:[\s\S]*?Current version: (.+)/);
                const frontendLatestMatch = output.match(/Frontend versions:[\s\S]*?Latest version: (.+)/);
                const frontendChannelMatch = output.match(/Frontend versions:[\s\S]*?Update channel: (.+)/);

                versionInfo = {
                    backend: {
                        current: backendCurrentMatch ? backendCurrentMatch[1].trim() : 'Unknown',
                        latest: backendLatestMatch ? backendLatestMatch[1].trim() : 'Unknown',
                        channel: backendChannelMatch ? backendChannelMatch[1].trim() : 'Unknown'
                    },
                    frontend: {
                        current: frontendCurrentMatch ? frontendCurrentMatch[1].trim() : 'Unknown',
                        latest: frontendLatestMatch ? frontendLatestMatch[1].trim() : 'Unknown',
                        channel: frontendChannelMatch ? frontendChannelMatch[1].trim() : 'Unknown'
                    }
                };
            }

            return versionInfo;
        })
        .catch(function(error) {
            console.error('Error fetching version information:', error);
            // Keep previous info if available, otherwise set to error state
             if (versionInfo.backend.current === 'Unknown' && versionInfo.frontend.current === 'Unknown') {
                versionInfo = {
                    backend: { current: 'Unknown', latest: 'Error', channel: 'Unknown' },
                    frontend: { current: 'Unknown', latest: 'Error', channel: 'Unknown' }
                };
            } else {
                 versionInfo.backend.latest = 'Error';
                 versionInfo.frontend.latest = 'Error';
            }

            return versionInfo;
        });
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

    load: function() {
        return Promise.all([
            uci.load('qosmate'),
            uci.load('firewall'),
            this.fetchHealthCheck(),
            fetchVersionInfo()
        ]).catch(error => {
            console.error('Error in load function:', error);
            ui.addNotification(null, E('p', _('Error loading initial data: %s').format(error.message || error)), 'error');
            return [null, null, null];
        });
    },

    fetchHealthCheck: function() {
        return fs.exec_direct('/etc/init.d/qosmate', ['health_check'])
            .then((res) => {
                var output = res.trim();
                // Parse the full status string (everything between status= and ;errors=)
                var statusMatch = output.match(/status=(.*?);errors=/);
                var errorsMatch = output.match(/errors=(\d+)$/);
                
                var statusString = statusMatch ? statusMatch[1] : 'Unknown';
                var errorsCount = errorsMatch ? parseInt(errorsMatch[1]) : 0;
                
                var statusSegments = statusString.split(';');
                var detailsArray = [];
                statusSegments.forEach(function(segment) {
                    if (!segment) return;
                    detailsArray.push(segment);
                });
                
                healthCheckData = {
                    details: detailsArray,
                    errors: errorsCount
                };
               // console.log("Health check data loaded successfully:", healthCheckData);
            })
            .catch((err) => {
                console.error('Health check failed:', err);
                healthCheckData = {
                    details: ['Health check failed: ' + err],
                    errors: 1
                };
            });
    },

    render: function() {
        var m, s_info, s_status, o;

        m = new form.Map('qosmate', _(''), 
            _('For detailed setup instructions and advanced configuration options, please check the ') + 
            '<a href="https://github.com/hudra0/qosmate/blob/main/README.md" target="_blank" style="color: #1976d2; text-decoration: none;">README</a>.');

        s_info = m.section(form.NamedSection, 'global', 'global', _('Version & Updates'));
        s_info.anonymous = true;

        // Version information
        o = s_info.option(form.DummyValue, '_version', _('Version Information'));
        o.rawhtml = true;
        o.render = function(section_id) {
            // Determine if an update is available for backend
            var backendUpdateAvailable = versionInfo.backend.current !== versionInfo.backend.latest &&
                                         versionInfo.backend.current !== 'Unknown' &&
                                         versionInfo.backend.latest !== 'Unknown' &&
                                         versionInfo.backend.latest !== 'API limit reached' &&
                                         versionInfo.backend.latest !== 'Error';

            // Determine if an update is available for frontend
            var frontendUpdateAvailable = versionInfo.frontend.current !== versionInfo.frontend.latest &&
                                          versionInfo.frontend.current !== 'Unknown' &&
                                          versionInfo.frontend.latest !== 'Unknown' &&
                                          versionInfo.frontend.latest !== 'API limit reached' &&
                                          versionInfo.frontend.latest !== 'Error';

            var container = E('div');
            
            // Create each component section
            function createComponentSection(title, info) {
                var section = E('div', { 'style': 'display: flex; align-items: center; margin-bottom: 8px;' });                
                var titleEl = E('div', { 
                    'style': 'display: inline-block; min-width: 75px; font-weight: bold; margin-right: 1px;'
                }, title);
                
                section.appendChild(titleEl);

                var channelEl = E('div', {
                    'style': 'display: inline-block; min-width: 70px; color: #888; margin-right: 15px;'
                }, [
                    E('span', { 'style': 'font-family: monospace;' }, 'Channel: ' + info.channel)
                ]);
                
                section.appendChild(channelEl);
                
                function isLikelyCommitHash(s) {
                    // Check if string is a hex string longer than 10 chars.
                    return typeof s === 'string' && s.length > 10 && /^[a-fA-F0-9]+$/.test(s);
                }
                
                var currentVersionText = isLikelyCommitHash(info.current) ? info.current.substring(0, 7) : info.current;
                var latestVersionText = isLikelyCommitHash(info.latest) ? info.latest.substring(0, 7) : info.latest;
                
                var versionInfo = E('div', { 'style': 'display: inline-block; margin-right: 10px;' }, [
                    currentVersionText, 
                    ' → ',
                    E('span', { 
                        'style': (title === 'Backend' && backendUpdateAvailable) || 
                                 (title === 'Frontend' && frontendUpdateAvailable) ? 
                                 'color: #ff7d7d; font-weight: bold;' : ''
                    }, latestVersionText)
                ]);
                
                section.appendChild(versionInfo);
                
                var statusType = '';
                var statusText = '';

                if ((title === 'Backend' && backendUpdateAvailable) || 
                    (title === 'Frontend' && frontendUpdateAvailable)) {
                    statusType = 'update';
                    statusText = _('UPDATE AVAILABLE');
                } else if (info.latest === 'API limit reached') {
                    statusType = 'error';
                    statusText = _('API LIMIT');
                } else if (info.latest === 'Error') {
                    statusType = 'error';
                    statusText = _('ERROR');
                } else if (info.current !== 'Unknown' && info.latest !== 'Unknown') {
                    statusType = 'current';
                    statusText = _('CURRENT');
                } else {
                    statusType = 'unknown';
                    statusText = _('UNKNOWN');
                }
                
                section.appendChild(createStatusText(statusType, statusText));
                
                return section;
            }
            
            // Create component sections
            container.appendChild(createComponentSection('Backend', versionInfo.backend));
            container.appendChild(createComponentSection('Frontend', versionInfo.frontend));
            
            // Add the update button if updates are available
            if (backendUpdateAvailable || frontendUpdateAvailable) {
                var buttonContainer = E('div', { 'style': 'margin-top: 10px;' });
                
                var updateButton = E('button', {
                    'class': 'cbi-button cbi-button-apply',
                    'click': ui.createHandlerFn(this, function() {
                        // Create update wizard modal
                        var updateOptions = [];
                        
                        if (backendUpdateAvailable) {
                            updateOptions.push({
                                name: 'backend',
                                title: _('Backend'),
                                current: versionInfo.backend.current,
                                latest: versionInfo.backend.latest
                            });
                        }
                        
                        if (frontendUpdateAvailable) {
                            updateOptions.push({
                                name: 'frontend',
                                title: _('Frontend'),
                                current: versionInfo.frontend.current,
                                latest: versionInfo.frontend.latest
                            });
                        }
                        
                        var modalContent = [
                            E('h4', {}, _('Update QoSmate Components')),
                            E('p', {}, _('Select components to update:'))
                        ];
                        
                        var checkboxes = {};
                        updateOptions.forEach(function(option) {
                            var checkbox = E('input', { 
                                'type': 'checkbox',
                                'id': 'update_' + option.name,
                                'name': 'update_' + option.name,
                                'checked': 'checked'
                            });
                            
                            checkboxes[option.name] = checkbox;
                            
                            modalContent.push(
                                E('div', { 'class': 'cbi-value' }, [
                                    E('label', { 'class': 'cbi-value-title', 'for': 'update_' + option.name }, option.title),
                                    E('div', { 'class': 'cbi-value-field' }, [
                                        checkbox,
                                        ' ',
                                        option.current,
                                        ' → ',
                                        E('span', { 'style': 'color: #ff7d7d; font-weight: bold;' }, option.latest)
                                    ])
                                ])
                            );
                        });
                        
                        // Update channel info
                        modalContent.push(
                            E('div', { 'class': 'cbi-value' }, [
                                E('label', { 'class': 'cbi-value-title' }, _('Update Channel')),
                                E('div', { 'class': 'cbi-value-field' }, [
                                    E('span', {}, versionInfo.backend.channel === versionInfo.frontend.channel ? 
                                        versionInfo.backend.channel : 
                                        _('%s (Backend) / %s (Frontend)').format(versionInfo.backend.channel, versionInfo.frontend.channel)),
                                    E('div', { 'style': 'font-size: 90%; color: #888; margin-top: 5px;' }, 
                                      _('To change the update channel, go to the Advanced tab'))
                                ])
                            ])
                        );
                        
                        // Add buttons
                        modalContent.push(
                            E('div', { 'class': 'right' }, [
                                E('button', {
                                    'class': 'btn',
                                    'click': ui.hideModal
                                }, _('Cancel')),
                                ' ',
                                E('button', {
                                    'class': 'cbi-button cbi-button-positive',
                                    'click': ui.createHandlerFn(this, function() {
                                        var componentsToUpdate = [];
                                        
                                        updateOptions.forEach(function(option) {
                                            if (checkboxes[option.name].checked) {
                                                componentsToUpdate.push(option.name);
                                            }
                                        });
                                        
                                        if (componentsToUpdate.length === 0) {
                                            ui.hideModal();
                                            return;
                                        }
                                        
                                        ui.showModal(_('Updating QoSmate'), [
                                            E('p', { 'class': 'spinning' }, _('Please wait while QoSmate is being updated...'))
                                        ]);
                                        
                                        // Use the current channel from versionInfo
                                        var selectedChannel;
                                        if (versionInfo.backend.channel === versionInfo.frontend.channel) {
                                            selectedChannel = versionInfo.backend.channel;
                                        } else {
                                            // If channels are mixed, show a confirmation dialog
                                            if (!confirm(_('Components are using different update channels (%s/%s). Continue with %s channel?')
                                                         .format(versionInfo.backend.channel, versionInfo.frontend.channel, versionInfo.backend.channel))) {
                                                ui.hideModal();
                                                return;
                                            }
                                            selectedChannel = versionInfo.backend.channel;
                                        }
                                        
                                        var updateArgs = ['update'];
                                        
                                        // Add component selection if not updating both components
                                        if (componentsToUpdate.length === 1) {
                                            updateArgs.push('-c', componentsToUpdate[0]);
                                        } 
                                        
                                        // Add channel selection
                                        updateArgs.push('-v', selectedChannel);
                                        
                                        console.log('Executing update command:', '/etc/init.d/qosmate', updateArgs);
                                        
                                        return fs.exec_direct('/etc/init.d/qosmate', updateArgs)
                                            .then(function(result) {
                                                console.log('Update command result:', result);
                                                // If result contains error messages, treat it as an error
                                                if (result && (result.includes('error') || result.includes('Error') || result.includes('failed'))) {
                                                    ui.hideModal();
                                                    ui.addNotification(null, E('p', _('Update process encountered issues: %s').format(result)), 'warning');
                                                    return;
                                                }
                                                
                                                // Simulate update completion after 5 seconds
                                                setTimeout(function() {
                                                    ui.hideModal();
                                                    ui.addNotification(null, E('p', _('QoSmate updated successfully.')), 'success');
                                                    window.setTimeout(function() { 
                                                        location.reload(); 
                                                    }, 1000);
                                                }, 5000);
                                            })
                                            .catch(function(err) {
                                                console.error('Update error:', err);
                                                ui.hideModal();
                                                
                                                var errorMessage = _('Failed to update QoSmate');
                                                
                                                if (err) {
                                                    if (typeof err === 'string') {
                                                        errorMessage += ': ' + err;
                                                    } else if (err.message) {
                                                        errorMessage += ': ' + err.message;
                                                    } else {
                                                        errorMessage += ': ' + JSON.stringify(err);
                                                    }
                                                }
                                                
                                                if (selectedChannel === 'snapshot') {
                                                    errorMessage += '. ' + _('Note: The "snapshot" channel might not be available in the current repository configuration.');
                                                }
                                                
                                                ui.addNotification(null, E('p', errorMessage), 'error');
                                            });
                                    })
                                }, _('Update Now'))
                            ])
                        );
                        
                        ui.showModal(_('QoSmate Update'), modalContent);
                    })
                }, [
                    E('span', { 'class': 'cbi-button-icon cbi-icon-reload' }),
                    ' ',
                    _('Update QoSmate')
                ]);
                
                buttonContainer.appendChild(updateButton);
                container.appendChild(buttonContainer);
            }
            
            return E('div', { 'class': 'cbi-value' }, [
                E('label', { 'class': 'cbi-value-title' }, _('Version Information')),
                E('div', { 'class': 'cbi-value-field' }, [
                    container
                ])
            ]);
        };        

        // Section, also targeting 'global' but with a UI title for grouping
        s_status = m.section(form.NamedSection, 'global', 'global', _('Service Status & Control'));

        // Service Status (Health Check)
        o = s_status.option(form.DummyValue, '_health_check', _('')); 
        o.rawhtml = true;
        o.render = function(section_id) {
            if (!healthCheckData) {
                return E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, _('Service Status')),
                    E('div', { 'class': 'cbi-value-field' }, _('Loading health check status...'))
                ]);
            }

            var statusHtml = E('div', { 'class': 'health-status', 'style': 'display: flex; gap: 16px; align-items: center;' });
            
            healthCheckData.details.forEach(function(detail) {
                var [type, status] = detail.split(':');
                var displayType = type.charAt(0).toUpperCase() + type.slice(1);
                var icon, color;
                switch(status.toLowerCase()) {
                    case 'enabled':
                    case 'started':
                        icon = '✓';
                        color = 'green';
                        break;
                    case 'disabled':
                    case 'stopped':
                        icon = '✕';
                        color = 'red';
                        break;
                    case 'ok':
                        icon = '✓';
                        color = 'green';
                        break;
                    case 'failed':
                        icon = '✕';
                        color = 'red';
                        break;
                    case 'missing':
                        icon = '⚠';
                        color = 'orange';
                        break;
                    default:
                        icon = '⚠';
                        color = 'orange';
                }
                
                statusHtml.appendChild(
                    E('div', { 'style': 'display: flex; align-items: center; gap: 4px;' }, [
                        E('span', { 
                            'style': 'color: ' + color + '; font-size: 15px; font-weight: bold; min-width: 20px;'
                        }, icon),
                        E('span', { 
                            'style': 'font-size: 13px; color: #666;'
                        }, _(displayType)),
                    ])
                );
            });

            return E('div', { 'class': 'cbi-value' }, [
                E('label', { 'class': 'cbi-value-title' }, _('Service Status')),
                E('div', { 'class': 'cbi-value-field' }, statusHtml)
            ]);
        };

        // Service Control buttons
        o = s_status.option(form.DummyValue, '_buttons', _(''));
        o.rawhtml = true;
        o.render = function(section_id) {
            var buttonStyle = 'button cbi-button';
            return E('div', { 'class': 'cbi-value' }, [
                E('label', { 'class': 'cbi-value-title' }, _('Service Control')),
                E('div', { 'class': 'cbi-value-field' }, [
                    E('button', {
                        'class': buttonStyle + ' cbi-button-apply',
                        'click': ui.createHandlerFn(this, function() {
                            return fs.exec_direct('/etc/init.d/qosmate', ['start'])
                                .then(function() {
                                    ui.addNotification(null, E('p', _('QoSmate started')), 'success');
                                    window.setTimeout(function() { location.reload(); }, 1000);
                                })
                                .catch(function(e) { ui.addNotification(null, E('p', _('Failed to start QoSmate: ') + e), 'error'); });
                        })
                    }, _('Start')),
                    ' ',
                    E('button', {
                        'class': buttonStyle + ' cbi-button-neutral',
                        'click': ui.createHandlerFn(this, function() {
                            return fs.exec_direct('/etc/init.d/qosmate', ['restart'])
                                .then(function() {
                                    ui.addNotification(null, E('p', _('QoSmate restarted')), 'success');
                                    window.setTimeout(function() { location.reload(); }, 1000);
                                })
                                .catch(function(e) { ui.addNotification(null, E('p', _('Failed to restart QoSmate: ') + e), 'error'); });
                        })
                    }, _('Restart')),
                    ' ',
                    E('button', {
                        'class': buttonStyle + ' cbi-button-reset',
                        'click': ui.createHandlerFn(this, function() {
                            return fs.exec_direct('/etc/init.d/qosmate', ['stop'])
                                .then(function() {
                                    ui.addNotification(null, E('p', _('QoSmate stopped')), 'success');
                                    window.setTimeout(function() { location.reload(); }, 1000);
                                })
                                .catch(function(e) { ui.addNotification(null, E('p', _('Failed to stop QoSmate: ') + e), 'error'); });
                        })
                    }, _('Stop'))
                ])
            ]);
        };

        // Auto Setup Button
        o = s_status.option(form.Button, '_auto_setup', _('Auto Setup'));
        o.inputstyle = 'apply';
        o.inputtitle = _('Start Auto Setup');
        o.onclick = ui.createHandlerFn(this, function() {
            ui.showModal(_('Auto Setup'), [
                E('p', _('This will run a speed test and configure QoSmate automatically.')),
                E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, _('Gaming Device IP (optional)')),
                    E('input', { 'id': 'gaming_ip', 'type': 'text', 'class': 'cbi-input-text' })
                ]),
                E('div', { 'class': 'right' }, [
                    E('button', {
                        'class': 'btn',
                        'click': ui.hideModal
                    }, _('Cancel')),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button-action',
                        'click': ui.createHandlerFn(this, function() {
                            var gamingIp = document.getElementById('gaming_ip').value;
                            ui.showModal(_('Running Auto Setup'), [
                                E('p', { 'class': 'spinning' }, _('Please wait while the auto setup is in progress...')),
                                E('div', { 'style': 'margin-top: 1em; border-top: 1px solid #ccc; padding-top: 1em;' }, [
                                    E('p', { 'style': 'font-weight: bold;' }, _('Note:')),
                                    E('p', _('Router-based speed tests may underestimate actual speeds. These results serve as a starting point and may require manual adjustment for optimal performance.'))
                                ])
                            ]);
                            return fs.exec_direct('/etc/init.d/qosmate', ['auto_setup_noninteractive', gamingIp])
                                .then(function(res) {
                                    var outputFile = res.trim();
                                    return fs.read(outputFile).then(function(output) {
                                        ui.hideModal();
                                        
                                        var wanInterface = output.match(/Detected WAN interface: (.+)/);
                                        var downloadSpeed = output.match(/Download speed: (.+) Mbit\/s/);
                                        var uploadSpeed = output.match(/Upload speed: (.+) Mbit\/s/);
                                        var downrate = output.match(/DOWNRATE: (.+) kbps/);
                                        var uprate = output.match(/UPRATE: (.+) kbps/);

                                        if (!downloadSpeed || !uploadSpeed || parseFloat(downloadSpeed[1]) <= 0 || parseFloat(uploadSpeed[1]) <= 0 ||
                                        !downrate || !uprate || parseInt(downrate[1]) <= 0 || parseInt(uprate[1]) <= 0) {
                                        ui.addNotification(null, E('p', _('Invalid speed test results. Please try again or set values manually.')), 'error');
                                        return;
                                        }                                        
                                        var gamingRules = output.match(/Gaming device rules added for IP: (.+)/);
        
                                        ui.showModal(_(''), [
                                            E('h2', { 'style': 'text-align:center; margin-bottom: 1em;' }, _('Auto Setup Results')),
                                            E('h3', { 'style': 'margin-bottom: 0.5em;' }, _('Speed Test Results')),
                                            E('p', { 'style': 'color: orange; margin-bottom: 1em;' }, _('Note: Router-based speed tests may underestimate actual speeds. For best results, consider running tests from a LAN device and manually entering the values. These results serve as a starting point.')),
                                            E('div', { 'style': 'display: table; width: 100%;' }, [
                                                E('div', { 'style': 'display: table-row;' }, [
                                                    E('div', { 'style': 'display: table-cell; padding: 5px; font-weight: bold;' }, _('WAN Interface')),
                                                    E('div', { 'style': 'display: table-cell; padding: 5px;' }, wanInterface ? wanInterface[1] : _('Not detected'))
                                                ]),
                                                E('div', { 'style': 'display: table-row;' }, [
                                                    E('div', { 'style': 'display: table-cell; padding: 5px; font-weight: bold;' }, _('Download Speed')),
                                                    E('div', { 'style': 'display: table-cell; padding: 5px;' }, downloadSpeed ? downloadSpeed[1] + ' Mbit/s' : _('Not available'))
                                                ]),
                                                E('div', { 'style': 'display: table-row;' }, [
                                                    E('div', { 'style': 'display: table-cell; padding: 5px; font-weight: bold;' }, _('Upload Speed')),
                                                    E('div', { 'style': 'display: table-cell; padding: 5px;' }, uploadSpeed ? uploadSpeed[1] + ' Mbit/s' : _('Not available'))
                                                ])
                                            ]),
                                            E('h3', { 'style': 'margin-top: 1em; margin-bottom: 0.5em;' }, _('QoS Configuration')),
                                            E('div', { 'style': 'display: table; width: 100%;' }, [
                                                E('div', { 'style': 'display: table-row;' }, [
                                                    E('div', { 'style': 'display: table-cell; padding: 5px; font-weight: bold;' }, _('Download Rate')),
                                                    E('div', { 'style': 'display: table-cell; padding: 5px;' }, downrate ? downrate[1] + ' kbps' : _('Not set'))
                                                ]),
                                                E('div', { 'style': 'display: table-row;' }, [
                                                    E('div', { 'style': 'display: table-cell; padding: 5px; font-weight: bold;' }, _('Upload Rate')),
                                                    E('div', { 'style': 'display: table-cell; padding: 5px;' }, uprate ? uprate[1] + ' kbps' : _('Not set'))
                                                ])
                                            ]),
                                            gamingRules ? E('div', { 'style': 'margin-top: 1em;' }, [
                                                E('div', { 'style': 'font-weight: bold;' }, _('Gaming Rules')),
                                                E('div', {}, _('Added for IP: ') + gamingRules[1])
                                            ]) : '',
                                            E('div', { 'class': 'right', 'style': 'margin-top: 1em;' }, [
                                                E('button', {
                                                    'class': 'btn cbi-button-action',
                                                    'click': ui.createHandlerFn(this, function() {
                                                        ui.showModal(_('Applying Changes'), [
                                                            E('p', { 'class': 'spinning' }, _('Please wait while the changes are being applied...'))
                                                        ]);
                                                        
                                                        var rootQdisc = uci.get('qosmate', 'settings', 'ROOT_QDISC');
                                                        var downrateValue = downrate ? parseInt(downrate[1]) : 0;
                                                        var uprateValue = uprate ? parseInt(uprate[1]) : 0;
                                                        
                                                        if (rootQdisc === 'hfsc' && (downrateValue <= 0 || uprateValue <= 0)) {
                                                            ui.hideModal();
                                                            ui.addNotification(null, E('p', _('Invalid rates for HFSC. Please set non-zero values manually.')), 'error');
                                                        } else {
                                                            uci.set('qosmate', 'settings', 'DOWNRATE', downrateValue.toString());
                                                            uci.set('qosmate', 'settings', 'UPRATE', uprateValue.toString());
                                                            
                                                            uci.save()
                                                            .then(() => {
                                                                return fs.exec_direct('/etc/init.d/qosmate', ['restart']);
                                                            })
                                                            .then(() => {
                                                                ui.hideModal();
                                                                ui.addNotification(null, E('p', _('QoSmate settings updated and service restarted.')), 'success');
                                                                window.setTimeout(function() {
                                                                    location.reload();
                                                                }, 2000);
                                                            })
                                                            .catch(function(err) {
                                                                ui.hideModal();
                                                                ui.addNotification(null, E('p', _('Failed to update settings or restart QoSmate: ') + err), 'error');
                                                            });
                                                        }
                                                    })
                                                }, _('Apply and Reload'))
                                            ])
                                        ]);
                                    });
                                })
                                .catch(function(err) {
                                    ui.hideModal();
                                    ui.addNotification(null, E('p', _('Auto setup failed: ') + err), 'error');
                                });
                        })
                    }, _('Start'))
                ])
            ]);
        });

        let s_basic = m.section(form.NamedSection, 'settings', 'settings', _('Basic Settings'));
        s_basic.anonymous = true;
        
        function createOption(name, title, description, placeholder, datatype) {
            var opt = s_basic.option(form.Value, name, title, description);
            opt.datatype = datatype || 'string';
            opt.rmempty = true;
            opt.placeholder = placeholder;
            
            if (datatype === 'uinteger') {
                opt.validate = function(section_id, value) {
                    if (value === '' || value === null) return true;
                    if (!/^\d+$/.test(value)) return _('Must be a non-negative integer or empty');
                    var intValue = parseInt(value, 10);
                    var rootQdisc = this.section.formvalue(section_id, 'ROOT_QDISC');
                    if (intValue === 0 && rootQdisc === 'hfsc') {
                        return _('Value must be greater than 0 for HFSC');
                    }
                    return true;
                };
            }
            return opt;
        }
        
        var wanInterface = uci.get('qosmate', 'settings', 'WAN') || '';
        o = s_basic.option(widgets.DeviceSelect, 'WAN', _('WAN Interface'), _('Select the WAN interface'));
        o.rmempty = false;
        o.editable = true;
        o.default = wanInterface;

        createOption('DOWNRATE', _('Download Rate (kbps)'), _('Set the download rate in kbps'), _('Default: 90000'), 'uinteger');
        createOption('UPRATE', _('Upload Rate (kbps)'), _('Set the upload rate in kbps'), _('Default: 45000'), 'uinteger');
        
        // Function to get QDisc description based on value
        function getQdiscDescriptionForValue(value) {
            switch(value) {
                case 'hfsc':
                    return _('HFSC - Hierarchical Fair Service Curve. Configure realtime traffic settings in the HFSC tab.');
                case 'cake':
                    return _('CAKE - Common Applications Kept Enhanced. Configure CAKE-specific parameters in the CAKE tab.');
                case 'hybrid':
                    return _('Hybrid - HFSC as shaper, Game Qdisc for realtime traffic, CAKE for default traffic and fq_codel for bulk traffic. Configure realtime class settings in HFSC tab and default class settings in CAKE tab.');
                case 'htb':
                    return _('HTB - Hierarchical Token Bucket. Simple 3-tier priority system with pre-configured settings - no additional qdisc configuration required.');
                default:
                    return _('Select the root queueing discipline');
            }
        }
        
        // Get description for current value
        function getQdiscDescription() {
            var rootQdisc = uci.get('qosmate', 'settings', 'ROOT_QDISC') || 'hfsc';
            return getQdiscDescriptionForValue(rootQdisc);
        }

        o = s_basic.option(form.ListValue, 'ROOT_QDISC', _('Root Queueing Discipline'), getQdiscDescription());
        o.value('hfsc', _('HFSC'));
        o.value('cake', _('CAKE'));
        o.value('hybrid', _('Hybrid'));
        o.value('htb', _('HTB (Experimental)'));
        o.default = 'hfsc';
        o.onchange = function(ev, section_id, value) {
            // Update description dynamically using shared function
            var newDescription = getQdiscDescriptionForValue(value);
            
            // Find and update the description element
            var node = ev.target.closest('.cbi-value');
            if (node) {
                var descNode = node.querySelector('.cbi-value-description');
                if (descNode) {
                    descNode.textContent = newDescription;
                }
            }
            
            // Update dependent fields
            var downrate = this.map.lookupOption('DOWNRATE', section_id)[0];
            var uprate = this.map.lookupOption('UPRATE', section_id)[0];
            if (downrate && uprate) {
                downrate.map.checkDepends();
                uprate.map.checkDepends();
            }
        };

        // Software Flow Offloading Warning
        o = s_basic.option(form.DummyValue, '_sfo_warning', _('Software Flow Offloading Status'));
        o.rawhtml = true;
        o.render = function(section_id) {
            if (isSfoEnabled()) {
                return E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, E('span', { 'style': 'color: orange; font-weight: bold;' }, '⚠')),
                    E('div', { 'class': 'cbi-value-field', 'style': 'color: orange;' }, [
                        E('strong', {}, _('Software Flow Offloading active - some limitations apply')),
                        E('br'),
                        _('✓ Static rules work ✗ Dynamic rules may not work')
                    ])
                ]);
            } else {
                return E('div');
            }
        };

        // Warning for bandwidth ratio
        o = s_basic.option(form.DummyValue, '_ratio_warning', _('Bandwidth Ratio Warning'));
        o.rawhtml = true;
        o.render = function(section_id) {
            var downrate = uci.get('qosmate', 'settings', 'DOWNRATE') || '90000';
            var uprate = uci.get('qosmate', 'settings', 'UPRATE') || '45000';
            var bwmaxratio = uci.get('qosmate', 'advanced', 'BWMAXRATIO') || '20';
            
            downrate = parseInt(downrate);
            uprate = parseInt(uprate);
            bwmaxratio = parseInt(bwmaxratio);
            
            if (uprate > 0 && downrate / uprate > bwmaxratio) {
                var ratio = Math.floor(downrate / uprate);
                var upload_mbps = Math.floor(uprate / 1000);
                var limited_download = Math.floor(bwmaxratio * uprate / 1000);
                return E('div', { 'class': 'cbi-value' }, [
                    E('label', { 'class': 'cbi-value-title' }, E('span', { 'style': 'color: orange; font-weight: bold;' }, '⚠️')),
                    E('div', { 'class': 'cbi-value-field', 'style': 'color: orange;' }, [
                        E('strong', {}, _('Large download/upload difference detected (') + ratio + ':1 ratio)'),
                        E('br'),
                        _('Your download speed has been limited to prevent connection issues.'),
                        E('br'),
                        _('Current limit: ') + limited_download + _(' Mbps (based on your ') + upload_mbps + _(' Mbps upload)') + _('To override: Advanced Settings → BWMAXRATIO'),
                    ])
                ]);
            } else {
                return E('div');
            }
        };

        // Autorate Section
        var s_autorate = m.section(form.NamedSection, 'autorate', 'autorate', _('Dynamic Bandwidth (Autorate)'));
        s_autorate.anonymous = true;

        o = s_autorate.option(form.Flag, 'enabled', _('Enable Autorate'), 
            _('Dynamically adjust bandwidth based on latency measurements. Fine-tune in Advanced tab.'));
        o.rmempty = false;

        o = s_autorate.option(form.DummyValue, '_autorate_status', _(''));
        o.rawhtml = true;
        o.render = function(section_id) {
            var enabled = uci.get('qosmate', 'autorate', 'enabled');
            if (enabled !== '1') {
                return E('div');
            }
            
            var uprate = parseInt(uci.get('qosmate', 'settings', 'UPRATE') || '0');
            var downrate = parseInt(uci.get('qosmate', 'settings', 'DOWNRATE') || '0');
            
            var minUl = parseInt(uci.get('qosmate', 'autorate', 'min_ul_rate')) || Math.floor(uprate * 25 / 100);
            var maxUl = parseInt(uci.get('qosmate', 'autorate', 'max_ul_rate')) || Math.floor(uprate * 105 / 100);
            var minDl = parseInt(uci.get('qosmate', 'autorate', 'min_dl_rate')) || Math.floor(downrate * 25 / 100);
            var maxDl = parseInt(uci.get('qosmate', 'autorate', 'max_dl_rate')) || Math.floor(downrate * 105 / 100);

            return E('div', { 'class': 'cbi-value' }, [
                E('label', { 'class': 'cbi-value-title' }, _('Active Range')),
                E('div', { 'class': 'cbi-value-field' }, [
                    E('span', { 'style': 'color: #2196F3;' }, '↓ '),
                    minDl + ' - ' + maxDl + ' kbps',
                    E('span', { 'style': 'margin: 0 12px; color: #666;' }, '|'),
                    E('span', { 'style': 'color: #4CAF50;' }, '↑ '),
                    minUl + ' - ' + maxUl + ' kbps'
                ])
            ]);
        };
        
        return m.render();
    }
});

function updateQosmate() {
    // Implement the update logic here
    ui.showModal(_('Updating QoSmate'), [
        E('p', { 'class': 'spinning' }, _('Updating QoSmate. Please wait...'))
    ]);

    // Simulating an update process
    setTimeout(function() {
        ui.hideModal();
        window.location.reload();
    }, 5000);
}
