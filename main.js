(function () {
	if (window.__pmObserver) window.__pmObserver.disconnect();

	if (!window.__pmFetchHooked) {
		window.__pmFetchHooked = true;
		const origFetch = window.fetch;
		window.fetch = function (resource, init) {
			try {
				let u = typeof resource === 'string' ? resource : resource?.url || '';
				let m = (init?.method || (resource instanceof Request ? resource.method : 'GET')).toUpperCase();
				if (u.includes('/pins') && m === 'POST' && window.__customPinPayload) {
					const b = typeof window.__customPinPayload === 'string' ? window.__customPinPayload : JSON.stringify(window.__customPinPayload);
					if (resource instanceof Request) {
						resource = new Request(resource, { body: b });
					} else {
						init = init || {};
						init.body = b;
					}
					showToast('🚀 Özel JSON Gönderiliyor...', '#22c55e');
				}
			} catch (e) {}
			return origFetch.call(this, resource, init);
		};
	}

	if (!window.__pmXhrHooked) {
		window.__pmXhrHooked = true;
		const origOpen = XMLHttpRequest.prototype.open;
		const origSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.open = function (method, url) {
			this._url = url;
			this._method = method;
			return origOpen.apply(this, arguments);
		};
		XMLHttpRequest.prototype.send = function (body) {
			try {
				if (this._url && String(this._url).includes('/pins') && String(this._method).toUpperCase() === 'POST' && window.__customPinPayload) {
					body = typeof window.__customPinPayload === 'string' ? window.__customPinPayload : JSON.stringify(window.__customPinPayload);
					showToast('🚀 Özel JSON Gönderiliyor...', '#22c55e');
				}
			} catch (e) {}
			return origSend.apply(this, arguments);
		};
	}

	function showToast(msg, color = '#6366f1') {
		let t = document.getElementById('pm-toast');
		if (!t) {
			t = document.createElement('div');
			t.id = 'pm-toast';
			t.style.cssText =
			'position:fixed;top:15px;left:50%;transform:translateX(-50%);background:#18181b;color:#fff;padding:10px 18px;border-radius:20px;font-size:13px;font-weight:600;z-index:9999999;box-shadow:0 6px 20px rgba(0,0,0,0.5);border:1.5px solid #3f3f46;transition:all .3s;text-align:center;pointer-events:none;font-family:sans-serif;';
			document.body.appendChild(t);
		}
		t.textContent = msg;
		t.style.borderColor = color;
		t.style.opacity = '1';
		setTimeout(() => {
			if (t) t.style.opacity = '0';
		}, 3500);
	}

	function isPinObj(o) {
		if (!o || typeof o !== 'object') return false;
		if (o.head && (o.ears || o.mouth || o.eyes) && typeof o.head === 'object')
			return true;
		if (
			Array.isArray(o) &&
			o.some((x) => x && x.name === 'head') &&
			o.some((x) => x && x.name === 'ears')
		)
			return true;
		return false;
	}

	function normalize(o) {
		if (Array.isArray(o)) {
			const p = {};
			o.forEach((x) => {
				if (x && x.name) p[x.name] = x;
			});
			if (!p.backgroundPattern) p.backgroundPattern = 'desktopPatternBg.png';
			return p;
		}
		const k = [
			'ears',
			'earrings',
			'head',
			'skin_accessories',
			'beard',
			'mouth',
			'eyes',
			'eyebrows',
			'hair',
			'hands',
			'accessories',
			'effect',
			'background',
			'main',
			'backgroundPattern',
		];
		const r = {};
		k.forEach((x) => {
			if (o[x] !== undefined) r[x] = o[x];
		});
		if (!r.backgroundPattern)
			r.backgroundPattern = o.backgroundPattern || 'desktopPatternBg.png';
		return r;
	}

	function deepFind() {
		const seen = new Set();
		function scan(obj, d = 0) {
			if (!obj || d > 4 || typeof obj !== 'object' || seen.has(obj))
				return null;
			seen.add(obj);
			if (isPinObj(obj)) return normalize(obj);
			if (obj.$store?.state) {
				const res = scan(obj.$store.state, d + 1);
				if (res) return res;
			}
			if (obj.state) {
				const res = scan(obj.state, d + 1);
				if (res) return res;
			}
			for (const pk of [
				'layers',
				'pin',
				'currentPin',
				'pinMaker',
				'editor',
				'character',
				'parts',
				'data',
				'model',
			]) {
				if (obj[pk]) {
					const res = scan(obj[pk], d + 1);
					if (res) return res;
				}
			}
			if (d < 2) {
				for (const k in obj) {
					try {
						if (obj[k] && typeof obj[k] === 'object') {
							const res = scan(obj[k], d + 1);
							if (res) return res;
						}
					} catch (e) {}
				}
			}
			return null;
		}

		const dl = getDl();
		let el = dl;
		while (el) {
			if (el.__vue__?.$store?.state) {
				const r = scan(el.__vue__.$store.state);
				if (r) return r;
			}
			el = el.parentElement;
		}
		for (const e of document.querySelectorAll('*')) {
			if (e.__vue__) {
				const r = scan(e.__vue__.$store?.state) || scan(e.__vue__);
				if (r) return r;
			}
			if (e._vnode?.component) {
				const r =
				scan(e._vnode.component.proxy) ||
				scan(e._vnode.component.setupState);
				if (r) return r;
			}
		}
		for (const k of Object.keys(window)) {
			if (k.startsWith('webpackChunk') || k === 'webpackJsonp') {
				const arr = window[k];
				if (Array.isArray(arr)) {
					let f = null;
					try {
						arr.push([
							[Symbol()],
							{},
							(req) => {
								if (req?.c) {
									for (const id in req.c) {
										const res = scan(req.c[id]?.exports);
										if (res) {
											f = res;
											break;
										}
									}
								}
							},
						]);
					} catch (e) {}
					if (f) return f;
				}
			}
		}
		for (const s of [localStorage, sessionStorage]) {
			for (let i = 0; i < s.length; i++) {
				try {
					const val = s.getItem(s.key(i));
					if (val && (val.includes('ears') || val.includes('head'))) {
						const res = scan(JSON.parse(val));
						if (res) return res;
					}
				} catch (e) {}
			}
		}
		return null;
	}

	function getDl() {
		return (
			document.querySelector('.download-button') ||
			document.querySelector('img[src*="download-button"]')?.closest('button')
		);
	}

	let topBtn = document.getElementById('pm-config-dl-btn');
	const initialDl = getDl();
	if (initialDl && !topBtn) {
		topBtn = initialDl.cloneNode(true);
		topBtn.id = 'pm-config-dl-btn';
		topBtn.type = 'button';
		topBtn.classList.remove('download-button');
		topBtn.classList.add('download-config-button');
		const img = topBtn.querySelector('img');
		const cdn =
		'https://cdn.jsdelivr.net/gh/SYSCYCLE/Supercell_Pinmaker_Mod_Menu@main/img/download-config-button.5b58b40f.svg';
		if (img) {
			img.src = cdn;
		} else {
			topBtn.innerHTML =
			'<img src="' + cdn + '" style="width:100%;height:100%;">';
		}

		let busy = false;
		topBtn.onclick = function (e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			if (busy) return;
			busy = true;
			setTimeout(() => (busy = false), 1500);

			showToast('⏳ Pin verisi taranıyor...', '#eab308');
			setTimeout(() => {
				const data = deepFind();
				if (!data) {
					alert('Pin verisi hafızada bulunamadı! Konsolu kontrol edin.');
					return;
				}
				try {
					const str = JSON.stringify(data, null, 2);
					const blob = new Blob([str], {
						type: 'application/json'
					});
					const url = URL.createObjectURL(blob);
					const a = document.createElement('a');
					a.href = url;
					a.download = 'pin_config_' + Date.now() + '.json';
					document.body.appendChild(a);
					a.click();
					setTimeout(() => {
						a.remove();
						URL.revokeObjectURL(url);
					}, 4000);
					showToast('✓ JSON Başarıyla İndirildi!', '#22c55e');
				} catch (err) {
					alert('Hata: ' + err.message);
				}
			}, 80);
		};
	}

	let fileInput = document.getElementById('pm-hidden-file-input');
	if (!fileInput) {
		fileInput = document.createElement('input');
		fileInput.id = 'pm-hidden-file-input';
		fileInput.type = 'file';
		fileInput.accept = '.json';
		fileInput.style.display = 'none';
		document.body.appendChild(fileInput);
	}

	function sync() {
		const dl = getDl();
		if (topBtn) {
			if (dl && dl.isConnected && getComputedStyle(dl).display !== 'none') {
				if (!topBtn.isConnected || topBtn.nextSibling !== dl) {
					dl.parentNode.insertBefore(topBtn, dl);
				}
				topBtn.style.display = '';
			} else {
				if (topBtn.isConnected) topBtn.remove();
			}
		}

		const upBtn = document.querySelector('.upload-modal__button');
		const existingFileBtn = document.getElementById('pm-json-picker-btn');

		if (upBtn && upBtn.isConnected) {
			if (!upBtn.__pmBound) {
				upBtn.__pmBound = true;
				upBtn.addEventListener('click', function (e) {
					if (window.__customPinPayload) {
						e.preventDefault();
						e.stopPropagation();
						e.stopImmediatePropagation();

						const saveLabel = upBtn.querySelector('.pickedLabel__label');
						const originalText = saveLabel ? saveLabel.textContent : '';
						if (saveLabel) saveLabel.textContent = 'KAYDEDİLİYOR...';
						showToast('⏳ Özel JSON kaydediliyor...', '#eab308');

						const payloadStr = typeof window.__customPinPayload === 'string'
							? window.__customPinPayload
							: JSON.stringify(window.__customPinPayload);

						fetch('https://api.pinmaker.supercell.com/pins', {
							method: 'POST',
							credentials: 'include',
							headers: {
								'Content-Type': 'application/json'
							},
							body: payloadStr
						})
						.then((res) => {
							if (!res.ok) throw new Error('HTTP ' + res.status);
							return res.text();
						})
						.then(() => {
							showToast('✓ Özel Rozet Başarıyla Kaydedildi!', '#22c55e');
							if (saveLabel) saveLabel.textContent = '✓ KAYDEDİLDİ!';
							setTimeout(() => {
								location.reload();
							}, 1200);
						})
						.catch((err) => {
							showToast('Hata: ' + err.message, '#ef4444');
							alert('Rozet kaydedilirken hata oluştu: ' + err.message);
							if (saveLabel) saveLabel.textContent = originalText;
						});
					}
				}, true);
			}

			if (!existingFileBtn) {
				const fb = upBtn.cloneNode(true);
				fb.id = 'pm-json-picker-btn';
				fb.style.marginTop = '14px';
				fb.querySelector('.RectangleButton--blue')?.classList.remove(
					'RectangleButton--blue'
				);
				const lbl = fb.querySelector('.pickedLabel__label');
				if (lbl)
					lbl.textContent = window.__customPinFileName
						? '✓ ' + window.__customPinFileName
						: 'JSON DOSYASI SEÇ';

				fb.onclick = function (e) {
					e.preventDefault();
					e.stopPropagation();
					fileInput.click();
				};

				fileInput.onchange = function (ev) {
					const f = ev.target.files[0];
					if (!f) return;
					const r = new FileReader();
					r.onload = function (eRes) {
						try {
							const j = JSON.parse(eRes.target.result);
							window.__customPinPayload = j;
							window.__customPinFileName = f.name;
							if (lbl) lbl.textContent = '✓ ' + f.name;
							showToast('✓ JSON Seçildi: ' + f.name, '#22c55e');
						} catch (err) {
							alert('Hata: Geçersiz JSON dosyası!');
						}
					};
					r.readAsText(f);
				};

				upBtn.parentNode.insertBefore(fb, upBtn.nextSibling);
			}
		} else {
			if (existingFileBtn) existingFileBtn.remove();
		}
	}

	const obs = new MutationObserver(sync);
	obs.observe(document.body, {
		childList: true,
		subtree: true
	});
	window.__pmObserver = obs;
	sync();

	showToast('✓ Mod Menü Aktif!', '#22c55e');
})();
