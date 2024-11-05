'use strict';
'require view';
'require form';
'require uci';
'require rpc';
'require ui';
'require poll';
'require request';
'require dom';
'require fs';

let callPackagelist = rpc.declare({
	object: 'rpc-sys',
	method: 'packagelist',
});

let callSystemBoard = rpc.declare({
	object: 'system',
	method: 'board',
});

let callUpgradeStart = rpc.declare({
	object: 'rpc-sys',
	method: 'upgrade_start',
	params: ['keep'],
});

/**
 * Returns the branch of a given version. This helps to offer upgrades
 * for point releases (aka within the branch).
 *
 * Logic:
 * SNAPSHOT -> SNAPSHOT
 * 21.02-SNAPSHOT -> 21.02
 * 21.02.0-rc1 -> 21.02
 * 19.07.8 -> 19.07
 *
 * @param {string} version
 * Input version from which to determine the branch
 * @returns {string}
 * The determined branch
 */
function get_branch(version) {
	return version.replace('-SNAPSHOT', '').split('.').slice(0, 2).join('.');
}

/**
 * The OpenWrt revision string contains both a hash as well as the number
 * commits since the OpenWrt/LEDE reboot. It helps to determine if a
 * snapshot is newer than another.
 *
 * @param {string} revision
 * Revision string of a OpenWrt device
 * @returns {integer}
 * The number of commits since OpenWrt/LEDE reboot
 */
function get_revision_count(revision) {
	return parseInt(revision.substring(1).split('-')[0]);
}

return view.extend({
	steps: {
		init:                    [  0, _('Received build request')],
		container_setup:         [ 10, _('Setting up ImageBuilder')],
		validate_revision:       [ 20, _('Validating revision')],
		validate_manifest:       [ 30, _('Validating package selection')],
		calculate_packages_hash: [ 40, _('Calculating package hash')],
		building_image:          [ 50, _('Generating firmware image')],
		signing_images:          [ 95, _('Signing images')],
		done:                    [100, _('Completed generating firmware image')],
		failed:                  [100, _('Failed to generate firmware image')],

		/* Obsolete status values, retained for backward compatibility. */
		download_imagebuilder:   [ 20, _('Downloading ImageBuilder archive')],
		unpack_imagebuilder:     [ 40, _('Setting Up ImageBuilder')],
	},

	request_hash: '',
	sha256_unsigned: '',

	selectImage: function (images, data, firmware) {
		var filesystemFilter = function(e) {
			return (e.filesystem == firmware.filesystem);
		}
		var typeFilter = function(e) {
			if (firmware.target.indexOf("x86") != -1) {
				// x86 images can be combined-efi (EFI) or combined (BIOS)
				if (data.efi) {
					return (e.type == 'combined-efi');
				} else {
					return (e.type == 'combined');
				}
			} else {
				return (e.type == 'sysupgrade' || e.type == 'combined');
			}
		}
		return images.filter(filesystemFilter).filter(typeFilter)[0];
	},

	handle200: function (response, content, data, firmware) {
		response = response.json();
		let image = this.selectImage(response.images, data, firmware);

		if (image.name != undefined) {
			this.sha256_unsigned = image.sha256_unsigned;
			let sysupgrade_url = `${data.url}/store/${response.request_hash}/${image.name}`;

			let keep = E('input', { type: 'checkbox' });
			keep.checked = true;

			let fields = [
				_('Version'),
				`${response.version_number} ${response.version_code}`,
				_('SHA256'),
				image.sha256,
			];

			if (data.advanced_mode == 1) {
				fields.push(
					_('Profile'),
					response.id,
					_('Target'),
					response.target,
					_('Build Date'),
					response.build_at,
					_('Filename'),
					image.name,
					_('Filesystem'),
					image.filesystem
				);
			}

			fields.push(
				'',
				E('a', { href: sysupgrade_url }, _('Download firmware image'))
			);
			if (data.rebuilder) {
				fields.push(_('Rebuilds'), E('div', { id: 'rebuilder_status' }));
			}

			let table = E('div', { class: 'table' });

			for (let i = 0; i < fields.length; i += 2) {
				table.appendChild(
					E('tr', { class: 'tr' }, [
						E('td', { class: 'td left', width: '33%' }, [fields[i]]),
						E('td', { class: 'td left' }, [fields[i + 1]]),
					])
				);
			}

			let modal_body = [
				table,
				E(
					'p',
					{ class: 'mt-2' },
					E('label', { class: 'btn' }, [
						keep,
						' ',
						_('Keep settings and retain the current configuration'),
					])
				),
				E('div', { class: 'right' }, [
					E('div', { class: 'btn', click: ui.hideModal }, _('Cancel')),
					' ',
					E(
						'button',
						{
							class: 'btn cbi-button cbi-button-positive important',
							click: ui.createHandlerFn(this, function () {
								this.handleInstall(sysupgrade_url, keep.checked, image.sha256);
							}),
						},
						_('Install firmware image')
					),
				]),
			];

			ui.showModal(_('Successfully created firmware image'), modal_body);
			if (data.rebuilder) {
				this.handleRebuilder(content, data, firmware);
			}
		}
	},

	handle202: function (response) {
		response = response.json();
		this.request_hash = response.request_hash;

		if ('queue_position' in response) {
			ui.showModal(_('Queued...'), [
				E(
					'p',
					{ class: 'spinning' },
					_('Request in build queue position %s').format(
						response.queue_position
					)
				),
			]);
		} else {
			ui.showModal(_('Building Firmware...'), [
				E(
					'p',
					{ class: 'spinning' },
					_('Progress: %s%% %s').format(
						this.steps[response.imagebuilder_status][0],
						this.steps[response.imagebuilder_status][1]
					)
				),
			]);
		}
	},

	handleError: function (response, data, firmware) {
		response = response.json();
		const request_data = {
			...data,
			request_hash: this.request_hash,
			sha256_unsigned: this.sha256_unsigned,
			...firmware
		};
		let body = [
			E('p', {}, _('Server response: %s').format(response.detail)),
			E(
				'a',
				{ href: 'https://github.com/openwrt/asu/issues' },
				_('Please report the error message and request')
			),
			E('p', {}, _('Request Data:')),
			E('pre', {}, JSON.stringify({ ...request_data }, null, 4)),
		];

		if (response.stdout) {
			body.push(E('b', {}, 'STDOUT:'));
			body.push(E('pre', {}, response.stdout));
		}

		if (response.stderr) {
			body.push(E('b', {}, 'STDERR:'));
			body.push(E('pre', {}, response.stderr));
		}

		body = body.concat([
			E('div', { class: 'right' }, [
				E('div', { class: 'btn', click: ui.hideModal }, _('Close')),
			]),
		]);

		ui.showModal(_('Error building the firmware image'), body);
	},

	GENERATE_NG_ONE_TIME_VERIF_VALUE: function() {
    function UUID() {
      if (typeof crypto === 'object') {
        if (typeof crypto.randomUUID === 'function') {
          return crypto.randomUUID();
        }
        if (typeof crypto.getRandomValues === 'function' && typeof Uint8Array === 'function') {
          return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
          );
        }
      }
      let timestamp = new Date().getTime();
      let perforNow = (typeof performance !== 'undefined' && performance.now && performance.now() * 1000) || 0;
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        let random = Math.random() * 16;
        if (timestamp > 0) {
          random = (timestamp + random) % 16 | 0;
          timestamp = Math.floor(timestamp / 16);
        } else {
          random = (perforNow + random) % 16 | 0;
          perforNow = Math.floor(perforNow / 16);
        }
        return (c === 'x' ? random : (random & 0x3) | 0x8).toString(16);
      });
    }
    const data = {
      uuid: UUID()
    }
    const inputArray = JSON.stringify(data).split('');
    const xorArray = inputArray.map(char => String.fromCharCode(char.charCodeAt(0) ^ 80));
    const resultString = xorArray.join('');
    return btoa(resultString);
	},

	handleRequest: function (server, main, content, data, firmware) {
		let request_url = `${server}/api/v1/build`;
		let method = 'POST';
		let local_content = content;
		let headers = {'Ng-One-Time-Verif-Value':GENERATE_NG_ONE_TIME_VERIF_VALUE()};

		/**
		 * If `request_hash` is available use a GET request instead of
		 * sending the entire object.
		 */
		if (this.request_hash && main == true) {
			request_url += `/${this.request_hash}`;
			local_content = {};
			method = 'GET';
		}

		request
			.request(request_url, { method: method, content: local_content, headers:headers })
			.then((response) => {
				switch (response.status) {
					case 202:
						if (main) {
							this.handle202(response);
						} else {
							response = response.json();

							let view = document.getElementById(server);
							view.innerText = `⏳	(${
								this.steps[response.imagebuilder_status][0]
							}%) ${server}`;
						}
						break;
					case 200:
						if (main == true) {
							poll.remove(this.pollFn);
							this.handle200(response, content, data, firmware);
						} else {
							poll.remove(this.rebuilder_polls[server]);
							response = response.json();
							let view = document.getElementById(server);
							let image = this.selectImage(response.images, data, firmware);
							if (image.sha256_unsigned == this.sha256_unsigned) {
								view.innerText = '✅ %s'.format(server);
							} else {
								view.innerHTML = `⚠️ ${server} (<a href="${server}/store/${
									response.bin_dir
								}/${image.name}">${_('Download')}</a>)`;
							}
						}
						break;
					case 400: // bad request
					case 422: // bad package
					case 500: // build failed
						if (main == true) {
							poll.remove(this.pollFn);
							this.handleError(response, data, firmware);
							break;
						} else {
							poll.remove(this.rebuilder_polls[server]);
							document.getElementById(server).innerText = '🚫 %s'.format(
								server
							);
						}
				}
			});
	},

	handleRebuilder: function (content, data, firmware) {
		this.rebuilder_polls = {};
		for (let rebuilder of data.rebuilder) {
			this.rebuilder_polls[rebuilder] = L.bind(
				this.handleRequest,
				this,
				rebuilder,
				false,
				content,
				data,
				firmware
			);
			poll.add(this.rebuilder_polls[rebuilder], 5);
			document.getElementById(
				'rebuilder_status'
			).innerHTML += `<p id="${rebuilder}">⏳ ${rebuilder}</p>`;
		}
		poll.start();
	},

	handleInstall: function (url, keep, sha256) {
		ui.showModal(_('Downloading...'), [
			E(
				'p',
				{ class: 'spinning' },
				_('Downloading firmware from server to browser')
			),
		]);

		request
			.get(url, {
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				responseType: 'blob',
			})
			.then((response) => {
				let form_data = new FormData();
				form_data.append('sessionid', rpc.getSessionID());
				form_data.append('filename', '/tmp/firmware.bin');
				form_data.append('filemode', 600);
				form_data.append('filedata', response.blob());

				ui.showModal(_('Uploading...'), [
					E(
						'p',
						{ class: 'spinning' },
						_('Uploading firmware from browser to device')
					),
				]);

				request
					.get(`${L.env.cgi_base}/cgi-upload`, {
						method: 'PUT',
						content: form_data,
					})
					.then((response) => response.json())
					.then((response) => {
						if (response.sha256sum != sha256) {
							ui.showModal(_('Wrong checksum'), [
								E(
									'p',
									_('Error during download of firmware. Please try again')
								),
								E('div', { class: 'btn', click: ui.hideModal }, _('Close')),
							]);
						} else {
							ui.showModal(_('Installing...'), [
								E(
									'p',
									{ class: 'spinning' },
									_('Installing the sysupgrade. Do not unpower device!')
								),
							]);

							L.resolveDefault(callUpgradeStart(keep), {}).then((response) => {
								if (keep) {
									ui.awaitReconnect(window.location.host);
								} else {
									ui.awaitReconnect('10.0.0.1', 'kwrt.lan');
								}
							});
						}
					});
			});
	},

	handleCheck: function (data, firmware, force) {
		this.request_hash = '';
		let { url, revision, advanced_mode, branch } = data;
		let { version, target, profile, packages } = firmware;

		Number(data.distribution) ? firmware.rootfs_size_mb = Number(data.distribution) : ;
		data.efi ? firmware.efi = "efi" : firmware.efi = "not";

		let candidates = [];

		const endpoint = `revision/${version}/${target}`;
		const request_url = `${url}/api/v1/${endpoint}`;

		ui.showModal(_('Searching...'), [
			E(
				'p',
				{ class: 'spinning' },
				_('Searching for an available sysupgrade of %s - %s').format(
					version,
					revision
				)
			),
		]);

		L.resolveDefault(request.get(request_url)).then((response) => {
			if (!response.ok) {
				ui.showModal(_('Error connecting to upgrade server'), [
					E(
						'p',
						{},
						_('Could not reach API at "%s". Please try again later.').format(
							response.url
						)
					),
					E('pre', {}, response.responseText),
					E('div', { class: 'right' }, [
						E('div', { class: 'btn', click: ui.hideModal }, _('Close')),
						E('div', { class: 'btn cbi-button cbi-button-positive', click: ui.createHandlerFn(this, function () {
											this.handleCheck(1)
										}) }, _('Force Sysupgrade')),
					]),
				]);
				return;
			}

				const remote_revision = response.json().revision;
				if (
					revision < remote_revision || force == 1
				) {
					candidates.push([version, remote_revision]);
				}

			// allow to re-install running firmware in advanced mode
			if (advanced_mode == 1) {
				candidates.unshift([version, revision]);
			}

			if (candidates.length) {
				let s, o;

				let mapdata = {
					request: {
						profile,
						version: candidates[0][0],
						packages: Object.keys(packages).sort(),
					},
				};

				let map = new form.JSONMap(mapdata, '');

				s = map.section(
					form.NamedSection,
					'request',
					'',
					'',
					'Use defaults for the safest update'
				);
				o = s.option(form.ListValue, 'version', 'Select firmware version');
				for (let candidate of candidates) {
					if (candidate[0] == version && candidate[1] == revision) {
						o.value(
							candidate[0],
							_('[installed] %s').format(
								candidate[1]
									? `${candidate[0]} - ${candidate[1]}`
									: candidate[0]
							)
						);
					} else {
						o.value(
							candidate[0],
							candidate[1] ? `${candidate[0]} - ${candidate[1]}` : candidate[0]
						);
					}
				}

				if (advanced_mode == 1) {
					o = s.option(form.Value, 'profile', _('Board Name / Profile'));
					o = s.option(form.DynamicList, 'packages', _('Packages'));
				}

				L.resolveDefault(map.render()).then((form_rendered) => {
					ui.showModal(_('New firmware upgrade available'), [
						E(
							'p',
							_('Currently running: %s - %s').format(
								version,
								revision
							)
						),
						form_rendered,
						E('div', { class: 'right' }, [
							E('div', { class: 'btn', click: ui.hideModal }, _('Cancel')),
							' ',
							E(
								'button',
								{
									class: 'btn cbi-button cbi-button-positive important',
									click: ui.createHandlerFn(this, function () {
										map.save().then(() => {
											const content = {
												...firmware,
												packages: mapdata.request.packages,
												version: mapdata.request.version,
												profile: mapdata.request.profile
											};
											this.pollFn = L.bind(function () {
												this.handleRequest(url, true, content, data, firmware);
											}, this);
											poll.add(this.pollFn, 5);
											poll.start();
										});
									}),
								},
								_('Request firmware image')
							),
						]),
					]);
				});
			} else {
				ui.showModal(_('No upgrade available'), [
					E(
						'p',
						_('The device runs the latest firmware version %s - %s').format(
							version,
							revision
						)
					),
					E('div', { class: 'right' }, [
						E('div', { class: 'btn', click: ui.hideModal }, _('Close')),
					]),
				]);
			}
		});
	},

	load: async function () {
		const promises = await Promise.all([
			L.resolveDefault(callPackagelist(), {}),
			L.resolveDefault(callSystemBoard(), {}),
			L.resolveDefault(fs.stat('/sys/firmware/efi'), null),
			uci.load('attendedsysupgrade'),
		]);
		const data = {
			url: uci.get_first('attendedsysupgrade', 'server', 'url'),
			branch: get_branch(promises[1].release.version),
			revision: promises[1].release.revision,
			distribution: promises[1].release.distribution,
			efi: promises[2],
			advanced_mode: uci.get_first('attendedsysupgrade', 'client', 'advanced_mode') || 0,
			rebuilder: uci.get_first('attendedsysupgrade', 'server', 'rebuilder')
		};
		const firmware = {
			client: 'luci/' + promises[0].packages['luci-app-attendedsysupgrade'],
			packages: promises[0].packages,
			profile: promises[1].board_name,
			target: promises[1].release.target,
			version: promises[1].release.version,
			diff_packages: true,
			filesystem: promises[1].rootfs_type
		};
		Number(data.distribution) ? firmware.rootfs_size_mb = Number(data.distribution) : ;
		data.efi ? firmware.efi = "efi" : firmware.efi = "not";
		return [data, firmware];
	},

	render: function (response) {
		const data = response[0];
		const firmware = response[1];

		return E('p', [
			E('h2', _('Attended Sysupgrade')),
			E(
				'p',
				_(
					'The attended sysupgrade service allows to easily upgrade vanilla and custom firmware images.'
				)
			),
			E(
				'p',
				_(
					'This is done by building a new firmware on demand via an online service.'
				)
			),
			E(
				'p',
				_('Currently running: %s - %s').format(
					firmware.version,
					data.revision
				)
			),
			E('p', [_('更多个性化定制请使用网页版: '),E('a', {
				'class': '',
				'href': 'https://openwrt.ai',
				'target': '_balank',
			}, _('在线定制网页版'))]),
			E('p', [_('非定制固件请在此更新: '),E('a', {
				'class': '',
				'href': '/cgi-bin/luci/admin/services/gpsysupgrade',
				'target': '_balank',
			}, _('系统在线更新')),E('br')]),
			E(
				'button',
				{
					class: 'btn cbi-button cbi-button-positive important',
					click: ui.createHandlerFn(this, this.handleCheck, data, firmware),
				},
				_('Search for firmware upgrade')
			),
		]);
	},
	handleSaveApply: null,
	handleSave: null,
	handleReset: null,
});
