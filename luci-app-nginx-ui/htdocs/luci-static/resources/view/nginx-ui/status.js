'use strict';
'require baseclass';
'require fs';
'require rpc';
'require uci';
'require ui';

var callServiceList = rpc.declare({
    object: 'service',
    method: 'list',
    params: ['name'],
    expect: { '': {} }
});

function getServiceStatus() {
    return L.resolveDefault(callServiceList('nginx-ui'), {}).then(function(res) {
        var service = Array.isArray(res) ? res[0] : res;
        return service ? service.running : false;
    });
}

return baseclass.extend({
    title: _('Nginx UI Status'),

    load: function() {
        return Promise.all([
            uci.load('nginx-ui'),
            getServiceStatus()
        ]);
    },

    render: function(data) {
        var status = data[1];
        var statusText = status ? _('Running') : _('Not running');
        var statusClass = status ? 'success' : 'danger';

        return E('div', { class: 'cbi-map' }, [
            E('h2', {}, _('Nginx UI Status')),
            E('div', { class: 'cbi-section' }, [
                E('div', { class: 'cbi-value' }, [
                    E('label', { class: 'cbi-value-title' }, _('Service Status')),
                    E('div', { class: 'cbi-value-field' }, [
                        E('span', { class: 'badge ' + statusClass }, statusText)
                    ])
                ])
            ])
        ]);
    }
});
