'use strict';
'require form';
'require fs';
'require rpc';
'require uci';
'require ui';
'require view';


var opacity_sets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20];
var ts_sets =  [0, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95, 1];

function createColorPickers(textInput) {
	const colorPicker = document.createElement('input');
	colorPicker.type = 'color';
	colorPicker.value = textInput.value;
	colorPicker.style.width = '24px';
	colorPicker.style.height = '24px';
	colorPicker.style.padding = '0px';
	colorPicker.style.marginLeft = '5px';
	colorPicker.style.borderRadius = '4px';
	colorPicker.style.border = '1px solid #d9d9d9';
	textInput.parentNode.insertBefore(colorPicker, textInput.nextSibling);
	colorPicker.addEventListener('input', function() {
		textInput.value = colorPicker.value;
	});
	textInput.addEventListener('input', function() {
		colorPicker.value = textInput.value;
	});
}

function createColorPickerrgb(textInput) {
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    function rgbToHex(rgbStr) {
        if (!rgbStr || typeof rgbStr !== 'string') return '#000000';
        
        const rgb = rgbStr.trim().split(/\s+/).map(num => {
            const n = parseInt(num);
            return isNaN(n) ? 0 : Math.min(255, Math.max(0, n));
        });
        
        if (rgb.length >= 3) {
            return '#' + rgb.slice(0, 3).map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }
        return '#000000';
    }
    
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r} ${g} ${b}`;
    }
    
    colorPicker.value = rgbToHex(textInput.value);
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'auto 30px';
    container.style.gap = '8px';
    container.style.alignItems = 'center';
    const parent = textInput.parentNode;
    parent.insertBefore(container, textInput);
    container.appendChild(textInput);
    container.appendChild(colorPicker);
    textInput.style.width = '100%';
    textInput.style.boxSizing = 'border-box';
    colorPicker.style.width = '30px';
    colorPicker.style.height = '30px';
    colorPicker.style.padding = '0';
    colorPicker.style.margin = '0';
    colorPicker.style.borderRadius = '4px';
    colorPicker.style.border = '1px solid #d9d9d9';
    colorPicker.style.cursor = 'pointer';
    
    colorPicker.addEventListener('change', function() {
        textInput.value = hexToRgb(colorPicker.value);
    });
    
    textInput.addEventListener('input', function() {
        try {
            const hex = rgbToHex(textInput.value);
            if (hex && /^#[0-9A-F]{6}$/i.test(hex)) {
                colorPicker.value = hex;
            }
        } catch (e) {
            console.warn('Invalid RGB format:', textInput.value);
        }
    });
    
    textInput.addEventListener('blur', function() {
        const value = textInput.value.trim();
        if (value) {
            const rgb = value.split(/\s+/).map(num => {
                let n = parseInt(num);
                if (isNaN(n)) n = 0;
                return Math.min(255, Math.max(0, n));
            });
            
            if (rgb.length >= 3) {
                textInput.value = `${rgb[0]} ${rgb[1]} ${rgb[2]}`;
                colorPicker.value = rgbToHex(textInput.value);
            }
        }
    });
}
return view.extend({

    load: function() {
		return Promise.all([
			uci.load('kucat')
		]);
    },

    render: function(data) {
		var m, s, o;
		m = new form.Map('kucat', _('KuCat Theme Config'),
			_('You can set KuCat theme font size, color scheme, shortcut tools, and manage login and desktop background images here.'));

		s = m.section(form.TypedSection, 'basic', '');
		s.anonymous = true;

		// Wallpaper Source
		o = s.option( form.ListValue, 'background', _('Wallpaper Source'), 
			_('Local wallpapers need to be uploaded by oneself, and those that are automatically downloaded will only be downloaded on the first visit every day, reducing frequent remote access and making usage smoother.'));
		o.value('0', _('Local wallpaper'));
		o.value('1', _('Auto download Iciba wallpaper'));
		o.value('2', _('Auto download unsplash wallpaper'));
		o.value('3', _('Auto download Bing wallpaper'));
		o.value('4', _('Auto download Bird 4K wallpaper'));
		o.default = '0';
		o.rmempty = false;
		
		// Set font size
		o = s.option( form.ListValue, 'fontmode', _('Set font size'));
		o.rmempty = false;
		o.value('0', _('Small font'));
		o.value('1', _('Normal font'));
		o.value('2', _('Large font'));
		o.default = '0';
		
		// font3d
		o = s.option( form.Flag, 'font3d', _('3D font'));
		o.rmempty = false;
		o.default = '0';

		// box-shadow
		o = s.option( form.Flag, 'boxshadow', _('Shadow layering effect'));
		o.rmempty = false;
		o.default = '0';

		// Wallpaper synchronization
		o = s.option( form.Flag, 'bklock', _('Wallpaper synchronization'),
			_('Is the login wallpaper consistent with the desktop wallpaper? If selected, it means that the desktop wallpaper and login wallpaper are the same image.'));
		o.rmempty = false;
		o.default = '0';

		// Expand Toolbar
		o = s.option( form.Flag, 'setbar', _('Expand navigation bar'),
			_('Expand or shrink the five quick navigation bars'));
		o.rmempty = false;
		o.default = '0';

		// Refreshing mode
		o = s.option( form.Flag, 'bgqs', _('Refreshing mode'));
		o.rmempty = false;
		o.default = '0';

		// Enable Daily Word
		o = s.option( form.Flag, 'dayword', _('Enable Daily Word'));
		o.rmempty = false;
		o.default = '0';

		 o = s.option(form.Value, 'colortools', _('RGB color values'))
		 o.default = '0 0 0';
		 o.rmempty = false;

		 o.render = function(section_id, option_index, cfgvalue) {
		 	var el = form.Value.prototype.render.apply(this, arguments);
		 	setTimeout(function() {
		 		const textInput = document.querySelector('[id^="widget.cbid.kucat."][id$=".colortools"]');
		 		createColorPickerrgb(textInput);
		 	}, 0);
		 	return el;
		 };
		// Status Homekey settings
		o = s.option( form.ListValue, 'gohome', _('Status Homekey settings'));
		o.value('overview', _('Overview'));
		o.value('routes', _('Routing'));
		o.value('firewall', _('Firewall'));
		o.value('logs', _('System Log'));
		o.value('processes', _('Processes'));
		o.value('realtime', _('Realtime Graphs'));
		o.value('netdata', _('Netdata'));
		o.default = 'overview';
		o.rmempty = false;

		// System Userkey settings
		o = s.option( form.ListValue, 'gouser', _('System Userkey settings'));
		o.value('system', _('System'));
		o.value('admin', _('Administration'));
		o.value('filemanager', _('File Manager'));
		o.value('kucat-config', _('KuCat Config'));
		o.value('ttyd', _('Terminal'));
		o.value('poweroffdevice', _('PowerOff'));
		o.default = 'kucat-config';
		o.rmempty = false;

		// Services Ssrkey settings
		o = s.option( form.ListValue, 'gossr', _('Services Ssrkey settings'));
		o.value('shadowsocksr', _('SSR'));
		o.value('bypass', _('bypass'));
		o.value('nikki', _('Nikki'));
		o.value('passwall', _('passwall'));
		o.value('passwall2', _('passwall2'));
		o.value('openclash', _('OpenClash'));
		o.value('homeproxy', _('HomeProxy'));
		o.value('mosdns', _('MosDNS'));
		o.value('smartdns', _('SmartDNS'));
		o.value('AdGuardHome', _('AdGuard_Home'));
		o.default = 'OpenClash';
		o.rmempty = false;

		o = s.option(form.Button, '_save', _('Save current settings'));
		o.inputstyle = 'apply';
		o.inputtitle = _('Save & Apply');
		o.onclick = function() {
   	 	   ui.changes.apply(true);
 		   return this.map.save(null, true).then(function() {
 		       return fs.exec('/usr/bin/kucat-config');
 		   }).then(function(res) {
 		       if (res.code === 0) {
  		          location.href = location.pathname + '?_=' + Date.now();
   		     }
 		   }).catch(console.error);
		};

        return m.render();
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
