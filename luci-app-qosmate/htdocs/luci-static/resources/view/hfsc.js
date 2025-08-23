'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require rpc';
'require fs';

// Helper function to add relevance info to descriptions
function addRelevanceInfo(description, settingName, rootQdisc, gameqdisc) {
    var isRelevant = true;
    var note = '';
    
    // Check basic ROOT_QDISC relevance
    if (rootQdisc !== 'hfsc' && rootQdisc !== 'hybrid') {
        isRelevant = false;
        note = ' ⚠ Not used with ' + rootQdisc.toUpperCase();
    } else {
        // Check gameqdisc-specific dependencies
        var gameqdiscDependencies = {
            'netem': ['netemdelayms', 'netemjitterms', 'netemdist', 'netem_direction', 'pktlossp'],
            'pfifo': ['PFIFOMIN', 'PACKETSIZE'], // PFIFO-specific settings
            // MAXDEL is used by multiple qdiscs, so handle separately
        };
        
        // Settings that are used by multiple gameqdiscs
        var multiGameqdiscSettings = {
            'MAXDEL': ['red', 'pfifo', 'bfifo', 'drr', 'qfq'] // Used for burst/limit calculations
        };
        
        // Check if setting is gameqdisc-specific
        var isGameqdiscSpecific = false;
        var requiredGameqdisc = '';
        var supportedGameqdiscs = [];
        
        // Check single-gameqdisc dependencies
        for (var qdisc in gameqdiscDependencies) {
            if (gameqdiscDependencies[qdisc].includes(settingName)) {
                isGameqdiscSpecific = true;
                if (qdisc !== gameqdisc) {
                    isRelevant = false;
                    requiredGameqdisc = qdisc;
                }
                break;
            }
        }
        
        // Check multi-gameqdisc settings
        if (!isGameqdiscSpecific && multiGameqdiscSettings[settingName]) {
            supportedGameqdiscs = multiGameqdiscSettings[settingName];
            isGameqdiscSpecific = true;
            if (!supportedGameqdiscs.includes(gameqdisc)) {
                isRelevant = false;
            }
        }
        
        // Check hybrid-specific settings
        if (rootQdisc === 'hybrid') {
            if (settingName === 'nongameqdisc' || settingName === 'nongameqdiscoptions') {
                isRelevant = false;
                note = ' ⚠ Hybrid mode uses CAKE for default class and fq_codel for bulk traffic';
            }
        }
        
        // Generate appropriate note
        if (isRelevant) {
            if (isGameqdiscSpecific) {
                note = ' ✓ Active for ' + rootQdisc.toUpperCase() + ' + ' + gameqdisc.toUpperCase();
            } else {
                note = ' ✓ Active for ' + rootQdisc.toUpperCase();
            }
        } else {
            if (requiredGameqdisc) {
                note = ' ⚠ Only relevant for ' + requiredGameqdisc.toUpperCase() + ' gameqdisc';
            } else if (supportedGameqdiscs.length > 0) {
                var gameqdiscList = supportedGameqdiscs.map(function(q) { return q.toUpperCase(); }).join(', ');
                note = ' ⚠ Only relevant for ' + gameqdiscList + ' gameqdisc' + (supportedGameqdiscs.length > 1 ? 's' : '');
            }
        }
    }
    
    return description + note;
}

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

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
            uci.load('qosmate')
        ]).then(() => {
            var m, s, o;
            var rootQdisc = uci.get('qosmate', 'settings', 'ROOT_QDISC') || 'hfsc';
            var gameqdisc = uci.get('qosmate', 'hfsc', 'gameqdisc') || 'pfifo';

            var relevanceText = '';
            if (rootQdisc === 'hfsc') {
                relevanceText = _('HFSC mode active.');
            } else if (rootQdisc === 'hybrid') {
                relevanceText = _('Hybrid mode - these settings control realtime traffic (high priority class).');
            } else {
                relevanceText = _('Current Root QDisc is %s - HFSC settings are not used.').format(rootQdisc.toUpperCase());
            }

            m = new form.Map('qosmate', _('QoSmate HFSC Settings'), _('Configure HFSC settings for QoSmate.') + ' ' + relevanceText);

            s = m.section(form.NamedSection, 'hfsc', 'hfsc', _('HFSC Settings'));
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
            
            // Add relevance info to description
            opt.description = addRelevanceInfo(description, name, rootQdisc, gameqdisc);
            
            return opt;
        }

        o = s.option(form.ListValue, 'gameqdisc', _('Game Queue Discipline'), 
            addRelevanceInfo(_('Queueing method for traffic classified as realtime'), 'gameqdisc', rootQdisc, gameqdisc));
        o.value('pfifo', _('PFIFO'));
        o.value('fq_codel', _('FQ_CODEL'));
        o.value('bfifo', _('BFIFO'));
        o.value('red', _('RED'));
        o.value('netem', _('NETEM'));
        o.default = 'pfifo';

        createOption('GAMEUP', _('Game Upload (kbps)'), _('Bandwidth reserved for realtime upload traffic'), _('Default: 15% of UPRATE + 400'), 'uinteger');
        createOption('GAMEDOWN', _('Game Download (kbps)'), _('Bandwidth reserved for realtime download traffic'), _('Default: 15% of DOWNRATE + 400'), 'uinteger');

        o = s.option(form.ListValue, 'nongameqdisc', _('Non-Game Queue Discipline'), 
            addRelevanceInfo(_('Select the queueing discipline for non-realtime traffic'), 'nongameqdisc', rootQdisc, gameqdisc));
        o.value('fq_codel', _('FQ_CODEL'));
        o.value('cake', _('CAKE'));
        o.default = 'fq_codel';

        createOption('nongameqdiscoptions', _('Non-Game QDisc Options'), _('Cake options for non-realtime queueing discipline'), _('Default: besteffort ack-filter'));
        createOption('MAXDEL', _('Max Delay (ms)'), _('Target max delay for realtime packets after burst (pfifo, bfifo, red)'), _('Default: 24'), 'uinteger');
        createOption('PFIFOMIN', _('PFIFO Min'), _('Minimum packet count for PFIFO queue'), _('Default: 5'), 'uinteger');
        createOption('PACKETSIZE', _('Avg Packet Size (B)'), _('Used with PFIFOMIN to calculate PFIFO limit'), _('Default: 450'), 'uinteger');
        createOption('netemdelayms', _('NETEM Delay (ms)'), _('NETEM delay in milliseconds'), _('Default: 30'), 'uinteger');
        createOption('netemjitterms', _('NETEM Jitter (ms)'), _('NETEM jitter in milliseconds'), _('Default: 7'), 'uinteger');

        o = s.option(form.ListValue, 'netem_direction', _('NETEM Direction'), 
            addRelevanceInfo(_('Select which direction to apply the NETEM delay/jitter settings'), 'netem_direction', rootQdisc, gameqdisc));
        o.depends('gameqdisc', 'netem');
        o.value('both', _('Both Directions'));
        o.value('egress', _('Egress Only'));
        o.value('ingress', _('Ingress Only'));
        o.default = 'both';
        
        o = s.option(form.ListValue, 'netemdist', _('NETEM Distribution'), 
            addRelevanceInfo(_('NETEM delay distribution'), 'netemdist', rootQdisc, gameqdisc));
        o.value('experimental', _('Experimental'));
        o.value('normal', _('Normal'));
        o.value('pareto', _('Pareto'));
        o.value('paretonormal', _('Pareto Normal'));
        o.default = 'normal';

        createOption('pktlossp', _('Packet Loss Percentage'), _('Percentage of packet loss'), _('Default: none'));

        return m.render();
        });
    }
});
