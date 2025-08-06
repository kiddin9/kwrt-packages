'use strict';
'require view';
'require form';
'require ui';
'require uci';
'require fs';
'require rpc';

var callInitAction = rpc.declare({
    object: 'luci',
    method: 'setInitAction',
    params: ['name', 'action'],
    expect: { result: false }
});

return view.extend({
    handleSaveApply: function(ev) {
        return this.handleSave(ev)
            .then(() => {
                return ui.changes.apply();
            })
            .then(() => {
                return callInitAction('qosmate', 'restart');
            })
            .then(() => {
                ui.addNotification(null, E('p', _('All rules have been saved and applied.')), 'success');
            })
            .catch((err) => {
                ui.addNotification(null, E('p', _('Failed to save settings or restart QoSmate: ') + err.message), 'error');
            });
    },

    load: function() {
        return Promise.all([
            fs.read('/etc/qosmate.d/custom_rules.nft')
                .then(content => {
                    content = content.replace(/^table\s+inet\s+qosmate_custom\s*{/, '');
                    content = content.replace(/}\s*$/, '');
                    return content.trim();
                })
                .catch(() => ''),
            fs.read('/etc/qosmate.d/inline_dscptag.nft')
                .catch(() => ''),
            fs.read('/tmp/qosmate_custom_rules_validation.txt')
                .catch(() => '')
        ]);
    },

    render: function([customRules, inlineRules, validationResult]) {
        var m, s, o;

        m = new form.Map('qosmate', _('QoSmate Custom Rules'),
            _('Define custom nftables rules for advanced traffic control.'));

        s = m.section(form.NamedSection, 'custom_rules', 'qosmate', _('Custom Rules'));
        s.anonymous = true;
        s.addremove = false;

        o = s.option(form.Button, '_erase', _('Erase Rules'));
        o.inputstyle = 'remove';
        o.inputtitle = _('Erase Custom Rules');
        o.onclick = function(ev) {
            return ui.showModal(_('Erase Custom Rules'), [
                E('p', _('Are you sure you want to erase all custom rules? This action cannot be undone.')),
                E('div', { 'class': 'right' }, [
                    E('button', {
                        'class': 'btn',
                        'click': ui.hideModal
                    }, _('Cancel')),
                    ' ',
                    E('button', {
                        'class': 'btn cbi-button-negative',
                        'click': ui.createHandlerFn(this, function() {
                            var customTextarea = document.querySelector('textarea[name="cbid.qosmate.custom_rules.custom_rules"]');
                            if (customTextarea) {
                                customTextarea.value = '';
                            }
                            
                            var inlineTextarea = document.querySelector('textarea[name="cbid.qosmate.custom_rules.inline_rules"]');
                            if (inlineTextarea) {
                                inlineTextarea.value = '';
                            }
                            
                            return fs.remove('/etc/qosmate.d/custom_rules.nft')
                                .then(() => {
                                    return fs.remove('/etc/qosmate.d/inline_dscptag.nft');
                                })
                                .then(() => {
                                    return ui.changes.apply();
                                })
                                .then(() => {
                                    return callInitAction('qosmate', 'restart');
                                })
                                .then(() => {
                                    ui.hideModal();
                                    ui.addNotification(null, E('p', _('All rules have been erased and changes applied.')), 'success');
                                    window.setTimeout(function() {
                                        window.location.reload();
                                    }, 2000);
                                })
                                .catch((err) => {
                                    ui.hideModal();
                                    ui.addNotification(null, E('p', _('Failed to erase custom rules or apply changes: ') + err.message), 'error');
                                });
                        })
                    }, _('Erase'))
                ])
            ]);
        };

        o = s.option(form.TextValue, 'custom_rules', _('Custom nftables Rules'));
        o.rows = 10;
        o.wrap = 'off';
        o.rmempty = true;
        o.monospace = true;
        o.datatype = 'string';
        o.description = _('Enter your custom nftables rules here. The "table inet qosmate_custom { ... }" wrapper will be added automatically.') +
            '<div style="margin-top: 8px;">' +
            '<button type="button" onclick="toggleExample(\'custom\')" class="btn cbi-button" style="font-size: 11px; padding: 3px 6px;">' +
            '▼ ' + _('Show Examples') + '</button>' +
            '<div id="custom-example" class="cbi-section-node" style="display: none; margin-top: 8px;">' +
            '<strong>' + _('Example (Full Table Rules):') + '</strong><br/>' +
            '<pre style="background:rgba(255,255,255,0.1); border:1px solid rgba(128,128,128,0.3); padding:6px; margin:4px 0; border-radius:3px; font-size:11px; white-space:pre-wrap; font-family:monospace;">' +
            'chain forward {\n' +
            '    type filter hook forward priority 0; policy accept;\n' +
            '    # Mark high-rate TCP traffic from specific IP\n' +
            '    ip saddr 192.168.138.100 tcp flags & (fin|syn|rst|ack) != 0\n' +
            '    limit rate over 300/second burst 300 packets\n' +
            '    counter ip dscp set cs1\n' +
            '}' +
            '</pre></div></div>';
        o.load = function(section_id) {
            return customRules;
        };
        o.write = function(section_id, formvalue) {
            // Prepare the new custom rules (only the table definition)
            const newRules = `table inet qosmate_custom {
${formvalue.trim()}
}`;

            // Delete the existing table before applying new rules
            // If deletion fails (table doesn't exist), ignore the error
            return fs.exec('nft', ['delete', 'table', 'inet', 'qosmate_custom'])
                .catch(() => { /* ignore deletion error */ })
                .then(() => fs.write('/etc/qosmate.d/custom_rules.nft', newRules))
                .then(() => fs.exec('/etc/init.d/qosmate', ['validate_custom_rules']))
                .then(() => fs.read('/tmp/qosmate_custom_rules_validation.txt'))
                .then((result) => {
                    if (result.includes('Overall validation: PASSED')) {
                        ui.addNotification(null, E('p', _('Rules validation successful.')), 'success');
                    } else {
                        ui.addNotification(null, E('p', _('Rules validation failed. Please check the validation result below.')), 'warning');
                    }
                });
        };

        o = s.option(form.TextValue, 'inline_rules', _('Inline Extra Rules'));
        o.rows = 10;
        o.wrap = 'off';
        o.rmempty = true;
        o.monospace = true;
        o.datatype = 'string';
        o.description = _('Statements only – run inside chain dscptag at hook $NFT_HOOK / priority $NFT_PRIORITY. Do not start with \'table\' or \'chain\'. Included only if validation passes.') +
            '<div style="margin-top: 8px;">' +
            '<button type="button" onclick="toggleExample(\'inline\')" class="btn cbi-button" style="font-size: 11px; padding: 3px 6px;">' +
            '▼ ' + _('Show Examples') + '</button>' +
            '<div id="inline-example" class="cbi-section-node" style="display: none; margin-top: 8px;">' +
            '<strong>' + _('Example (Inline Rules):') + '</strong><br/>' +
            '<pre style="background:rgba(255,255,255,0.1); border:1px solid rgba(128,128,128,0.3); padding:6px; margin:4px 0; border-radius:3px; font-size:11px; white-space:pre-wrap; font-family:monospace;">' +
            '# Mark traffic from specific IP as high priority\n' +
            'ip saddr 192.168.1.100 ip dscp set cs5 comment "Gaming PC priority"\n\n' +
            '# Rate limit and mark bulk TCP traffic\n' +
            'meta l4proto tcp limit rate 100/second ip dscp set cs1 comment "Bulk TCP limit"\n\n' +
            '# Mark VoIP traffic from specific port range\n' +
            'udp sport 5060-5070 ip dscp set ef comment "SIP/RTP VoIP traffic"' +
            '</pre></div></div>';
        o.load = function(section_id) {
            return inlineRules;
        };
        o.write = function(section_id, formvalue) {
            return fs.write('/etc/qosmate.d/inline_dscptag.nft', formvalue || '')
                .then(() => fs.exec('/etc/init.d/qosmate', ['validate_custom_rules']))
                .then(() => fs.read('/tmp/qosmate_custom_rules_validation.txt'))
                .then((result) => {
                    if (result.includes('Overall validation: PASSED')) {
                        ui.addNotification(null, E('p', _('Rules validation successful.')), 'success');
                    } else {
                        ui.addNotification(null, E('p', _('Rules validation failed. Please check the validation result below.')), 'warning');
                    }
                });
        };

        o = s.option(form.DummyValue, '_validation_result', _('Validation Result'));
        o.rawhtml = true;
        o.default = validationResult
            ? '<div class="cbi-section-node" style="margin-top: 8px; min-width: 700px;">' +
                '<pre style="background:rgba(255,255,255,0.1); border:1px solid rgba(128,128,128,0.3); padding:6px; margin:4px 0; border-radius:3px; font-size:11px; white-space:pre-wrap; font-family:monospace;">' +
                validationResult + '</pre></div>'
            : _('No validation performed yet');

        o = s.option(form.Button, '_validate', _('Validate Rules'));
        o.inputstyle = 'apply';
        o.inputtitle = _('Validate');
        o.onclick = function(ev) {
            var map = this.map;
            var section_id = 'custom_rules'; // Assuming this is the correct section_id
        
            var customRulesTextarea = document.getElementById('widget.cbid.qosmate.' + section_id + '.custom_rules');
            var inlineRulesTextarea = document.getElementById('widget.cbid.qosmate.' + section_id + '.inline_rules');
            
            if (!customRulesTextarea || !inlineRulesTextarea) {
                ui.addNotification(null, E('p', _('Error: Could not find rules textareas')), 'error');
                return;
            }
        
            var currentCustomRules = customRulesTextarea.value;
            var currentInlineRules = inlineRulesTextarea.value;
            var fullCustomContent = `table inet qosmate_custom {\n${currentCustomRules.trim()}\n}`;
        
            ui.showModal(_('Validating Rules'), [
                E('p', { 'class': 'spinning' }, _('Please wait while the rules are being validated...'))
            ]);
        
            return fs.write('/etc/qosmate.d/custom_rules.nft', fullCustomContent)
                .then(() => {
                    return fs.write('/etc/qosmate.d/inline_dscptag.nft', currentInlineRules || '');
                })
                .then(() => {
                    return fs.exec('/etc/init.d/qosmate', ['validate_custom_rules']);
                })
                .then(() => {
                    return fs.read('/tmp/qosmate_custom_rules_validation.txt');
                })
                .then((result) => {
                    ui.hideModal();
                    if (result.includes('Overall validation: PASSED')) {
                        ui.addNotification(null, E('p', _('Rules validation successful.')), 'success');
                    } else {
                        ui.addNotification(null, E('p', _('Rules validation failed. Please check the validation result below.')), 'warning');
                    }
                    var validationResultElement = document.getElementById('cbid.qosmate.custom_rules._validation_result');
                    if (validationResultElement) {
                        validationResultElement.innerHTML = '<div class="cbi-section-node" style="margin-top: 8px; min-width: 700px;">' +
                            '<pre style="background:rgba(255,255,255,0.1); border:1px solid rgba(128,128,128,0.3); padding:6px; margin:4px 0; border-radius:3px; font-size:11px; white-space:pre-wrap; font-family:monospace;">' +
                            result + '</pre></div>';
                    }
                    ui.showModal(_('Finalizing Validation'), [
                        E('p', { 'class': 'spinning' }, _('Finalizing validation results, please wait...'))
                    ]);
                    
                    setTimeout(function() {
                        window.location.reload();
                    }, 2000);
                })
                .catch((err) => {
                    ui.hideModal();
                    ui.addNotification(null, E('p', _('Error during validation: ') + err), 'error');
                    
                    ui.showModal(_('Finalizing Validation'), [
                        E('p', { 'class': 'spinning' }, _('Finalizing validation results, please wait...'))
                    ]);
                    
                    setTimeout(function() {
                        window.location.reload();
                    }, 2000);
                });
            };

        // Add toggle functionality
        if (typeof window.toggleExample === 'undefined') {
            window.toggleExample = function(type) {
                var element = document.getElementById(type + '-example');
                var button = event.target;
                if (element.style.display === 'none') {
                    element.style.display = 'block';
                    button.innerHTML = '▲ ' + button.innerHTML.split(' ').slice(1).join(' ');
                } else {
                    element.style.display = 'none';
                    button.innerHTML = '▼ ' + button.innerHTML.split(' ').slice(1).join(' ');
                }
            };
        }

        return m.render();
    }
});
