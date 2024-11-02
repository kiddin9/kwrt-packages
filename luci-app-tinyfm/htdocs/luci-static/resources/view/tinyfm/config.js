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
'require form';
'require view';
'require uci';
'require fs';
'require ui';

return view.extend({
    render: function() {
        var m, s, o, footerSection;

        m = new form.Map('tinyfm', _('Konfigurasi TinyFM'),
            _('Atur pengaturan TinyFileManager'));

        s = m.section(form.NamedSection, 'auth', 'tinyfm', _('Pengaturan Autentikasi'));
        s.anonymous = true;
        s.addremove = false;

        s.tab('general', _('Pengaturan Umum'));
        s.tab('symlink', _('Buat Symlink'));

        o = s.taboption('general', form.DummyValue, '_password_generator', _('Password'));
        o.rawhtml = true;
        o.default = E('div', { 'style': 'font-style: italic;' }, [
            _('Untuk mengganti password, silakan gunakan '),
            E('a', { 'href': 'https://tinyfilemanager.github.io/docs/pwd.html', 'target': '_blank' }, 
              'Password Generator')
        ]);

        // Tab Umum
        o = s.taboption('general', form.Flag, 'enable', _('Aktifkan Autentikasi'),
            _('Aktifkan atau nonaktifkan autentikasi untuk TinyFileManager'));
        o.rmempty = false;

        o = s.taboption('general', form.Value, 'username', _('Username'),
            _('Masukkan username untuk autentikasi'));
        o.depends('enable', '1');

        o = s.taboption('general', form.Value, 'password', _('Password'),
            _('Masukkan password yang telah di-hash untuk autentikasi'));
        o.password = true;
        o.depends('enable', '1');

        o = s.taboption('general', form.Value, 'readonly_users', _('Pengguna Hanya-Baca'),
            _('Daftar pengguna dengan akses hanya-baca, pisahkan dengan spasi'));
        o.depends('enable', '1');

        // Tab Buat Symlink
        var scriptPath = '/usr/bin/tinyfm.sh';

        o = s.taboption('symlink', form.ListValue, 'pilihan', _('Pilih Opsi'));
        o.value('rootfs', _('Rootfs'));
        o.value('openclash', _('Openclash'));
        o.value('mihomo', _('Mihomo'));
        o.default = 'rootfs';

        o = s.taboption('symlink', form.Button, '_create_symlink', _('Buat Symlink'));
        o.inputstyle = 'apply';
        o.onclick = function(ev) {
            var target = this.section.getOption('pilihan').formvalue(this.section.section);
            return fs.exec(scriptPath, [target])
                .then(function(res) {
                    if (res.code === 0) {
                        ui.addNotification(null, E('p', _('Symlink berhasil dibuat untuk: ') + target), 'success');
                    } else {
                        ui.addNotification(null, E('p', _('Gagal membuat symlink untuk: ') + target), 'error');
                    }
                })
                .catch(function(err) {
                    ui.addNotification(null, E('p', _('Error saat menjalankan script: ') + err), 'error');
                });
        };

        footerSection = m.section(form.NamedSection, 'footer', 'tinyfm');
        footerSection.render = function() {
            return E('div', { 'style': 'text-align: center; padding: 10px; font-style: italic;' }, [
                E('span', {}, [
                    _('Dibuat oleh '),
                    E('a', { 
                        // Binatang biasa nya akan hapus ini
                        // Cuma binatang yang tidak mengghargai kerja orang lain
                        'href': 'https://github.com/bobbyunknow', 
                        'target': '_blank',
                        'style': ' text-decoration: none;'
                    }, 'BobbyUnknown')
                ])
            ]);
        };

        return m.render();
    }
});