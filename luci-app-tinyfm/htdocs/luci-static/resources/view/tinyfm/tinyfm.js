/*
 * Ini adalah perangkat lunak open source, dilisensikan di bawah Lisensi Open Source Kustom
 *
 * Hak Cipta (C) 2024 BobbyUnknown
 *
 * Deskripsi:
 * Perangkat lunak ini menyediakan aplikasi filemanager tinyfilemanager untuk OpenWrt.
 * Aplikasi ini memungkinkan pengguna untuk mengelola file dan direktori pada router
 * OpenWrt melalui antarmuka web yang mudah digunakan.
 */




'use strict';
'require view';
'require ui';
'require dom';

return view.extend({
    handleSaveApply: null,
    handleSave: null,
    handleReset: null,

    load: function() {
        return Promise.resolve();
    },

    render: function() {
        var iframe = E('iframe', {
            src: '/tinyfm/index.php',
            style: 'width: 100%; height: 800px; border: none;'
        });
        // Binatang biasa nya akan hapus ini
        // Cuma binatang yang tidak mengghargai kerja orang lain
        var footer = E('div', { 
            class: 'cbi-section',
            style: 'text-align: center; padding: 10px; font-style: italic;'
        }, [
            E('span', {}, [
                _('Dibuat oleh '),
                E('a', { href: 'https://github.com/bobbyunknow', target: '_blank' }, 'BobbyUnknown')
            ])
        ]);

        var content = E('div', { class: 'cbi-map' }, [
            E('h2', _('Tiny File Manager')),
            E('div', { class: 'cbi-section' }, [
                E('div', { class: 'cbi-section-descr' }, _('Manajemen file dan direktori untuk OpenWrt')),
                iframe
            ]),
            footer
        ]);

        window.addEventListener('DOMContentLoaded', function() {
            var pageActions = document.querySelector('.cbi-page-actions');
            if (pageActions) {
                pageActions.remove();
            }
        });

        return content;
    }
});


