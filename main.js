/* SYS CYCLE - System Framework © 2009 Supercell Pinmaker Mod Menu V1 - 11.09.2026 Apache Licence 2.0 */
"use strict";

(() => {
	const config = {
		pollingIntervalSeconds: 1,
		maxMillisBeforeAckWhenClosed: 200,
		moreAnnoyingDebuggerStatements: 1,
		onDetectOpen: () => {
			document.documentElement.innerHTML = "";
			window.location.replace("https://syscycle.github.io/protectdebugging/chrome");
		},
		onDetectClose: undefined,
		startup: "asap",
		onCheckOpennessWhilePaused: "returnStaleValue",
	};

	Object.seal(config);

	const heart = new Worker(URL.createObjectURL(new Blob([`
		"use strict";
		onmessage = (ev) => {
			postMessage({isOpenBeat:true});
			debugger;
			for (let i = 0; i < ev.data.moreDebugs; i++) { debugger; }
			postMessage({isOpenBeat:false});
		};
	`], {
		type: "text/javascript"
	})));

	let _isDevtoolsOpen = false;
	let _isDetectorPaused = true;
	let consecutiveHits = 0;
	let resolveVerdict = undefined;
	let nextPulse$ = NaN;

	const onHeartMsg = (msg) => {
		if (msg.data.isOpenBeat) {
			let p = new Promise((_resolveVerdict) => {
				resolveVerdict = _resolveVerdict;
				let wait$ = setTimeout(() => {
					wait$ = NaN; 
					resolveVerdict(true);
				}, config.maxMillisBeforeAckWhenClosed);
			});

			p.then((verdict) => {
				if (verdict === null) return;
				
				if (verdict === true) {
					consecutiveHits++;
				} else {
					consecutiveHits = 0;
				}

				const isActuallyOpen = consecutiveHits >= 2;

				if (isActuallyOpen !== _isDevtoolsOpen) {
					_isDevtoolsOpen = isActuallyOpen;
					const cb = {
						true: config.onDetectOpen,
						false: config.onDetectClose
					}[isActuallyOpen + ""];
					if (cb) cb();
				}

				nextPulse$ = setTimeout(() => {
					nextPulse$ = NaN; 
					doOnePulse();
				}, config.pollingIntervalSeconds * 1000);
			});
		} else {
			if (resolveVerdict) resolveVerdict(false);
		}
	};

	const doOnePulse = () => {
		heart.postMessage({
			moreDebugs: config.moreAnnoyingDebuggerStatements
		});
	};

	const detector = {
		config,
		get isOpen() {
			return _isDevtoolsOpen;
		},
		get paused() {
			return _isDetectorPaused;
		},
		set paused(pause) {
			if (_isDetectorPaused === pause) return;
			_isDetectorPaused = pause;
			if (pause) {
				heart.removeEventListener("message", onHeartMsg);
				clearTimeout(nextPulse$); 
				nextPulse$ = NaN;
				if (resolveVerdict) resolveVerdict(null);
			} else {
				heart.addEventListener("message", onHeartMsg);
				doOnePulse();
			}
		}
	};

	Object.freeze(detector);

	globalThis.devtoolsDetector = detector;
	if (config.startup === "asap") {
		detector.paused = false;
	}
})();

(function immediateCheck() {
	function countElements() {
		const scriptCount = document.querySelectorAll('script').length;
		const styleCount = document.querySelectorAll('style:not(#pm-marquee-style)').length;
		const linkCount = document.querySelectorAll('link[rel="stylesheet"]').length;

		if (scriptCount > 35 || styleCount > 25 || linkCount > 30) {
			console.warn('Sayfa sınırları aşıldı, yönlendiriliyor...');
			window.location.replace('https://syscycle.github.io/protectdebugging/chrome');
		}
	}

	countElements();

	const observer = new MutationObserver(() => {
		countElements();
	});

	observer.observe(document.documentElement, {
		childList: true,
		subtree: true
	});

	document.addEventListener('DOMContentLoaded', countElements);
})();

(function initPinMakerMod() {
	if (window.__pmObserver) window.__pmObserver.disconnect();

	const L = {
		tr: { sel: "SPCFG DOSYASI SEÇ", sav: "KAYDEDİLİYOR...", ok: "✓ KAYDEDİLDİ!", cd: "Günlük rozet kaydetme kotanız dolmuştur. Lütfen sürenin bitmesini bekleyin.", nd: "Kaydedilecek rozet verisi bulunamadı!", inv: "Hata: Yalnızca geçerli .spcfg dosyaları yüklenebilir!", err: "Supercell Sunucu Yanıtı" },
		en: { sel: "SELECT SPCFG FILE", sav: "SAVING...", ok: "✓ SAVED!", cd: "Daily pin upload limit reached. Please wait for cooldown.", nd: "No pin data found to save!", inv: "Error: Only valid .spcfg files are accepted!", err: "Supercell Server Response" },
		es: { sel: "ELEGIR ARCHIVO SPCFG", sav: "GUARDANDO...", ok: "✓ ¡GUARDADO!", cd: "Límite diario alcanzado. Por favor espera.", nd: "¡No se encontraron datos!", inv: "¡Error: Solo se aceptan archivos .spcfg válidos!", err: "Respuesta del servidor Supercell" },
		de: { sel: "SPCFG-DATEI WÄHLEN", sav: "SPEICHERN...", ok: "✓ GESPEICHERT!", cd: "Tägliches Limit erreicht. Bitte warten.", nd: "Keine Daten gefunden!", inv: "Fehler: Nur gültige .spcfg-Dateien werden akzeptiert!", err: "Supercell-Serverantwort" },
		fr: { sel: "CHOISIR FICHIER SPCFG", sav: "ENREGISTREMENT...", ok: "✓ ENREGISTRÉ !", cd: "Limite quotidienne atteinte. Veuillez patienter.", nd: "Aucune donnée trouvée !", inv: "Erreur : Seuls les fichiers .spcfg valides sont acceptés !", err: "Réponse du serveur Supercell" },
		it: { sel: "SCEGLI FILE SPCFG", sav: "SALVATAGGIO...", ok: "✓ SALVATO!", cd: "Limite giornaliero raggiunto. Attendi.", nd: "Nessun dato trovato!", inv: "Errore: Sono accettati solo file .spcfg validi!", err: "Risposta server Supercell" },
		pt: { sel: "ESCOLHER ARQUIVO SPCFG", sav: "SALVANDO...", ok: "✓ SALVO!", cd: "Limite diário atingido. Por favor aguarde.", nd: "Nenhum dato encontrado!", inv: "Erro: Apenas arquivos .spcfg válidos são aceitos!", err: "Resposta do servidor Supercell" },
		ru: { sel: "ВЫБРАТЬ ФАЙЛ SPCFG", sav: "СОХРАНЕНИЕ...", ok: "✓ СОХРАНЕНО!", cd: "Дневной лимит исчерпан. Пожалуйста, подождите.", nd: "Данные пина не найдены!", inv: "Ошибка: Принимаются только корректные файлы .spcfg!", err: "Ответ сервера Supercell" },
		pl: { sel: "WYBIERZ PLIK SPCFG", sav: "ZAPISYWANIE...", ok: "✓ ZAPISANO!", cd: "Osiągnięto dzienny limit. Proszę czekać.", nd: "Nie znaleziono danych!", inv: "Błąd: Akceptowane są tylko prawidłowe pliki .spcfg!", err: "Odpowiedź serwera Supercell" },
		jp: { sel: "SPCFGファイルを選択", sav: "保存中...", ok: "✓ 保存完了！", cd: "1日の保存制限に達しました。お待ちください。", nd: "データが見つかりません！", inv: "エラー: 有効な .spcfg ファイルのみ受け入れられます！", err: "Supercellサーバーの応答" },
		kr: { sel: "SPCFG 파일 선택", sav: "저장 중...", ok: "✓ 저장 완료!", cd: "일일 저장 한도에 도달했습니다. 잠시 기다려주세요.", nd: "데이터를 찾을 수 없습니다!", inv: "오류: 유효한 .spcfg 파일만 업로드할 수 있습니다!", err: "Supercell 서버 응답" },
		"zh-hans": { sel: "选择 SPCFG 文件", sav: "保存中...", ok: "✓ 已保存！", cd: "已达到每日保存限制。请稍候。", nd: "未找到可保存的数据！", inv: "错误：仅支持有效的 .spcfg 文件！", err: "Supercell 服务器响应" },
		"zh-hant": { sel: "選擇 SPCFG 檔案", sav: "儲存中...", ok: "✓ 已儲存！", cd: "已達每日儲存上限。請稍候。", nd: "找不到可儲存的資料！", inv: "錯誤：僅支援有效的 .spcfg 檔案！", err: "Supercell 伺服器回應" },
		ar: { sel: "اختر ملف SPCFG", sav: "جارٍ الحفظ...", ok: "✓ تم الحفظ!", cd: "تم الوصول إلى الحد اليومي. يرجى الانتظار.", nd: "لم يتم العثور على بيانات!", inv: "خطأ: يتم قبول ملفات .spcfg الصالحة فقط!", err: "استجابة خادم Supercell" },
		da: { sel: "VÆLG SPCFG-FIL", sav: "GEMMER...", ok: "✓ GEMT!", cd: "Daglig grænse nået.", nd: "Ingen data fundet!", inv: "Kun gyldige .spcfg-filer accepteres!", err: "Supercell-serversvar" },
		nl: { sel: "KIES SPCFG-BESTAND", sav: "OPSLAAN...", ok: "✓ OPGESLAGEN!", cd: "Dagelijkse limiet bereikt.", nd: "Geen gegevens gevonden!", inv: "Alleen geldige .spcfg-bestanden worden geaccepteerd!", err: "Supercell-serverreactie" },
		fi: { sel: "VALITSE SPCFG-TIEDOSTO", sav: "TALLENNETAAN...", ok: "✓ TALLENNETTU!", cd: "Päivittäinen raja saavutettu.", nd: "Tietoja ei löytynyt!", inv: "Vain kelvollisia .spcfg-tiedostoja hyväksytään!", err: "Supercell-palvelinvastaus" },
		sv: { sel: "VÄLJ SPCFG-FIL", sav: "SPARAR...", ok: "✓ SPARAD!", cd: "Daglig gräns nådd.", nd: "Ingen data hittades!", inv: "Endast giltiga .spcfg-filer accepteras!", err: "Supercell-serversvar" },
		no: { sel: "VELG SPCFG-FIL", sav: "LAGRER...", ok: "✓ LAGRET!", cd: "Daglig grense nådd.", nd: "Ingen data funnet!", inv: "Bare gyldige .spcfg-filer godtas!", err: "Supercell-serversvar" },
		th: { sel: "เลือกไฟล์ SPCFG", sav: "กำลังบันทึก...", ok: "✓ บันทึกแล้ว!", cd: "ถึงขีดจำกัดรายวันแล้ว", nd: "ไม่พบข้อมูล!", inv: "ยอมรับเฉพาะไฟล์ .spcfg ที่ถูกต้องเท่านั้น!", err: "การตอบกลับของเซิรฟ์เวอร์ Supercell" },
		vi: { sel: "CHỌN TỆP SPCFG", sav: "ĐANG LƯU...", ok: "✓ ĐÃ LƯU!", cd: "Đã đạt giới hạn hàng ngày.", nd: "Không tìm thấy dữ liệu!", inv: "Chỉ chấp nhận các tệp .spcfg hợp lệ!", err: "Phản hồi máy chủ Supercell" },
		id: { sel: "PILIH FILE SPCFG", sav: "MENYIMPAN...", ok: "✓ TERSIMPAN!", cd: "Batas harian tercapai.", nd: "Data tidak ditemukan!", inv: "Hanya file .spcfg yang valid diterima!", err: "Respons Server Supercell" },
		ms: { sel: "PILIH FAIL SPCFG", sav: "MENYIMPAN...", ok: "✓ DISIMPAN!", cd: "Had harian dicapai.", nd: "Data tidak dijumpai!", inv: "Hanya fail .spcfg yang sah diterima!", err: "Respons Pelayan Supercell" },
		he: { sel: "בחר קובץ SPCFG", sav: "...שומר", ok: "!נשמר ✓", cd: "הגעת למגבלה היומית.", nd: "!לא נמצאו נתונים", inv: "מתקבלים רק קובצי .spcfg תקינים!", err: "Supercell תגובת שרת" },
		fa: { sel: "انتخاب فایل SPCFG", sav: "...در حال ذخیره", ok: "!ذخیره شد ✓", cd: "محدودیت روزانه پر شده است.", nd: "!داده‌ای یافت نشد", inv: "فقط فایل‌های .spcfg معتبر پذیرفته می‌شوند!", err: "Supercell پاسخ سرور" }
	};

	function getLang() {
		const p = location.pathname.toLowerCase();
		const m = p.match(/\/(ar|da|de|en|es|fa|fi|fr|he|it|jp|kr|ms|id|nl|no|pl|pt|ru|sv|th|tr|vi|zh-hans|zh-hant)/);
		return m ? m[1] : (navigator.language?.toLowerCase().startsWith('tr') ? 'tr' : 'en');
	}

	function tr(key) {
		const lang = getLang();
		return (L[lang] && L[lang][key]) ? L[lang][key] : (L.en[key] || '');
	}

	async function getCryptoKey() {
		const kStr = [173, 248, 246, 252, 173, 168, 169, 255, 247, 250, 175, 171, 189].map(c => String.fromCharCode(c ^ 206)).join('');
		const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(kStr));
		return crypto.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
	}

	async function encryptToBinary(plainText) {
		const key = await getCryptoKey();
		const iv = crypto.getRandomValues(new Uint8Array(12));
		const encoded = new TextEncoder().encode(plainText);
		const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
		const combined = new Uint8Array(iv.length + encrypted.byteLength);
		combined.set(iv);
		combined.set(new Uint8Array(encrypted), iv.length);
		let binary = '';
		for (let i = 0; i < combined.length; i++) binary += String.fromCharCode(combined[i]);
		const b64 = btoa(binary);
		const b64Bytes = new TextEncoder().encode(b64);
		const finalBytes = new Uint8Array(2 + b64Bytes.length);
		finalBytes[0] = 0x00;
		finalBytes[1] = 0x01;
		finalBytes.set(b64Bytes, 2);
		return finalBytes;
	}

	async function decryptFromRaw(rawBuffer) {
		let bytes = new Uint8Array(rawBuffer);
		if (bytes.length < 2 || bytes[0] !== 0x00 || bytes[1] !== 0x01) {
			throw new Error('Not an encrypted SPCFG');
		}
		bytes = bytes.slice(2);
		const b64Str = new TextDecoder().decode(bytes).trim();
		const key = await getCryptoKey();
		const binary = atob(b64Str);
		const cipherBytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) cipherBytes[i] = binary.charCodeAt(i);
		const iv = cipherBytes.slice(0, 12);
		const ciphertext = cipherBytes.slice(12);
		const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
		return new TextDecoder().decode(decrypted);
	}

	if (!document.getElementById('pm-marquee-style')) {
		const st = document.createElement('style');
		st.id = 'pm-marquee-style';
		st.textContent = '@keyframes pmTickerLoop{0%{transform:translateX(0%)}100%{transform:translateX(-50%)}}.pm-ticker-track{display:inline-flex!important;white-space:nowrap!important;will-change:transform!important;animation:pmTickerLoop 7s linear infinite!important}.pm-ticker-track span{white-space:nowrap!important;display:inline-block!important}';
		document.head.appendChild(st);
	}

	function preparePinPayload(raw) {
		if (!raw || typeof raw !== 'object') return raw;
		const p = JSON.parse(JSON.stringify(raw));
		const allKeys = [
			"ears", "earrings", "head", "skin_accessories", "beard",
			"mouth", "eyes", "eyebrows", "hair", "hands",
			"accessories", "effect"
		];
		allKeys.forEach(k => {
			if (!p[k]) {
				p[k] = {
					scale: 1,
					selectedAssetCol: 0,
					selectedAssetRow: 0,
					name: k,
					container: {},
					element: {},
					assets: { "0": {} },
					selectedAsset: 0,
					hidden: true,
					color: '#ffffff',
					position: { x: 270, y: 300 },
					offset: { x: 270, y: 300 },
					rotation: 0
				};
			} else {
				const it = p[k];
				it.name = k;
				if (typeof it.scale !== 'number') it.scale = 1;
				if (typeof it.selectedAssetCol !== 'number') it.selectedAssetCol = 0;
				if (typeof it.selectedAssetRow !== 'number') it.selectedAssetRow = 0;
				if (typeof it.selectedAsset !== 'number') it.selectedAsset = 0;
				if (typeof it.hidden !== 'boolean') it.hidden = false;
				if (typeof it.color !== 'string') it.color = '#ffffff';
				if (!it.position || typeof it.position.x !== 'number') it.position = { x: 270, y: 300 };
				if (!it.offset || typeof it.offset.x !== 'number') it.offset = { x: it.position.x, y: it.position.y };
				if (typeof it.rotation !== 'number') it.rotation = 0;
				if (!it.container || typeof it.container !== 'object') it.container = {};
				if (!it.element || typeof it.element !== 'object') it.element = {};
				if (!it.assets || typeof it.assets !== 'object') {
					it.assets = { "0": {} };
				} else if (Array.isArray(it.assets)) {
					const asObj = {};
					it.assets.forEach((_, idx) => { asObj[idx] = {}; });
					it.assets = asObj;
				}
			}
		});
		if (!p.background) {
			p.background = {
				scale: 1,
				selectedAssetCol: 0,
				selectedAssetRow: 0,
				name: "background",
				container: {},
				element: null,
				assets: [],
				selectedAsset: 0,
				hidden: false,
				color: '#421bc9',
				position: { x: 0, y: 0 },
				offset: { x: 0, y: 0 },
				rotation: 0
			};
		} else {
			p.background.name = "background";
			p.background.container = {};
			p.background.element = null;
			if (!Array.isArray(p.background.assets)) p.background.assets = [];
			if (typeof p.background.scale !== 'number') p.background.scale = 1;
			if (typeof p.background.selectedAsset !== 'number') p.background.selectedAsset = 0;
			if (typeof p.background.hidden !== 'boolean') p.background.hidden = false;
			if (typeof p.background.color !== 'string') p.background.color = '#421bc9';
			if (!p.background.position) p.background.position = { x: 0, y: 0 };
			if (!p.background.offset) p.background.offset = { x: 0, y: 0 };
			if (typeof p.background.rotation !== 'number') p.background.rotation = 0;
		}
		if (!p.main) {
			p.main = {
				scale: 1.1,
				selectedAssetCol: 0,
				selectedAssetRow: 0,
				name: "main",
				container: {},
				element: null,
				assets: [],
				selectedAsset: -1,
				hidden: false,
				color: '#ffffff',
				position: { x: 0, y: -68.4549560546875 },
				offset: { x: 0, y: 0 },
				rotation: 0
			};
		} else {
			p.main.name = "main";
			p.main.container = {};
			p.main.element = null;
			if (!Array.isArray(p.main.assets)) p.main.assets = [];
			if (typeof p.main.scale !== 'number') p.main.scale = 1.1;
			if (typeof p.main.selectedAsset !== 'number') p.main.selectedAsset = -1;
			if (typeof p.main.hidden !== 'boolean') p.main.hidden = false;
			if (typeof p.main.color !== 'string') p.main.color = '#ffffff';
			if (!p.main.position) p.main.position = { x: 0, y: -68.4549560546875 };
			if (!p.main.offset) p.main.offset = { x: 0, y: 0 };
			if (typeof p.main.rotation !== 'number') p.main.rotation = 0;
		}
		if (!p.backgroundPattern) p.backgroundPattern = "desktopPatternBg.png";
		return p;
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
			return preparePinPayload(p);
		}
		const k = [
			'ears', 'earrings', 'head', 'skin_accessories', 'beard',
			'mouth', 'eyes', 'eyebrows', 'hair', 'hands',
			'accessories', 'effect', 'background', 'main', 'backgroundPattern',
		];
		const r = {};
		k.forEach((x) => {
			if (o[x] !== undefined) r[x] = o[x];
		});
		if (!r.backgroundPattern)
			r.backgroundPattern = o.backgroundPattern || 'desktopPatternBg.png';
		return preparePinPayload(r);
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
				'layers', 'pin', 'currentPin', 'pinMaker', 'editor',
				'character', 'parts', 'data', 'model',
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
		const cdn = 'https://cdn.jsdelivr.net/gh/SYSCYCLE/Supercell_Pinmaker_Mod_Menu@main/img/download-config-button.5b58b40f.svg';
		if (img) {
			img.src = cdn;
		} else {
			topBtn.innerHTML = '<img src="' + cdn + '" style="width:100%;height:100%;">';
		}

		let busy = false;
		topBtn.onclick = async function (e) {
			if (e) {
				e.preventDefault();
				e.stopPropagation();
			}
			if (busy) return;
			busy = true;
			setTimeout(() => (busy = false), 1500);

			const data = deepFind();
			if (!data) {
				alert(tr('nd'));
				return;
			}
			try {
				const str = JSON.stringify(data);
				const finalBinary = await encryptToBinary(str);
				const blob = new Blob([finalBinary], {
					type: 'application/octet-stream'
				});
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'pin_config_' + Date.now() + '.spcfg';
				document.body.appendChild(a);
				a.click();
				setTimeout(() => {
					a.remove();
					URL.revokeObjectURL(url);
				}, 4000);
			} catch (err) {
				alert('Hata: ' + err.message);
			}
		};
	}

	let fileInput = document.getElementById('pm-hidden-file-input');
	if (!fileInput) {
		fileInput = document.createElement('input');
		fileInput.id = 'pm-hidden-file-input';
		fileInput.type = 'file';
		fileInput.accept = '.spcfg';
		fileInput.style.display = 'none';
		document.body.appendChild(fileInput);
	}

	function isCooldownActive(targetBtn) {
		if (!targetBtn) return false;
		if (targetBtn.disabled || targetBtn.getAttribute('disabled') !== null) return true;
		if (targetBtn.classList.contains('disabled') || targetBtn.classList.contains('RectangleButton--disabled')) return true;
		const rBtn = targetBtn.querySelector('.RectangleButton');
		if (rBtn && (rBtn.classList.contains('RectangleButton--disabled') || rBtn.classList.contains('disabled'))) return true;
		const txt = targetBtn.textContent.toLowerCase();
		if (txt.includes('saat') || txt.includes('dakika') || txt.includes('hour') || txt.includes('minute')) return true;
		return false;
	}

	function updateLabel(flbl, text, refBtn) {
		if (!flbl) return;
		const defaultText = tr('sel');
		const isFile = !!window.__customPinFileName && text !== defaultText;

		const refLabel = (refBtn || document.querySelector('.upload-modal__button:not(#pm-json-picker-btn)'))?.querySelector('.pickedLabel__label');
		if (refLabel) {
			const cs = window.getComputedStyle(refLabel);
			flbl.style.fontFamily = cs.fontFamily;
			flbl.style.fontWeight = cs.fontWeight;
			flbl.style.textShadow = cs.textShadow;
			flbl.style.textTransform = cs.textTransform;
		}

		const pBox = flbl.closest('.pickedLabel__container') || flbl.parentElement;
		const bg = flbl.closest('.RectangleButton__background');

		if (isFile) {
			if (bg) bg.style.overflow = 'hidden';
			if (pBox) {
				pBox.style.width = '180px';
				pBox.style.maxWidth = '180px';
				pBox.style.overflow = 'hidden';
				pBox.style.display = 'flex';
				pBox.style.justifyContent = 'flex-start';
				pBox.style.alignItems = 'center';
				pBox.style.margin = '0 auto';
			}
			flbl.style.display = 'inline-block';
			flbl.style.whiteSpace = 'nowrap';
			flbl.style.fontSize = '';
			const spacer = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
			flbl.innerHTML = '<span class="pm-ticker-track"><span>' + text + spacer + '</span><span>' + text + spacer + '</span></span>';
		} else {
			if (bg) bg.style.overflow = '';
			if (pBox) {
				pBox.style.width = '';
				pBox.style.maxWidth = '';
				pBox.style.overflow = '';
				pBox.style.display = '';
				pBox.style.justifyContent = '';
				pBox.style.alignItems = '';
				pBox.style.margin = '';
			}
			flbl.style.display = '';
			flbl.style.whiteSpace = '';
			flbl.style.fontSize = '';
			flbl.style.textAlign = 'center';
			flbl.innerHTML = '';
			flbl.textContent = defaultText;
		}
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

		const realBtns = Array.from(document.querySelectorAll('.upload-modal__button')).filter(
			el => el.id !== 'pm-my-save-btn' && el.id !== 'pm-json-picker-btn'
		);

		if (realBtns.length > 0 && realBtns[0].isConnected) {
			const realSaveBtn = realBtns[0];
			realSaveBtn.style.display = 'none';

			let mySaveBtn = document.getElementById('pm-my-save-btn');
			if (!mySaveBtn) {
				mySaveBtn = realSaveBtn.cloneNode(true);
				mySaveBtn.id = 'pm-my-save-btn';
				mySaveBtn.style.display = 'flex';

				async function doDirectSave(e) {
					if (e) {
						e.preventDefault();
						e.stopPropagation();
					}

					if (isCooldownActive(realSaveBtn)) {
						alert(tr('cd'));
						return;
					}

					let rawPayload = window.__customPinPayload;
					if (!rawPayload) {
						rawPayload = deepFind();
					}

					if (!rawPayload) {
						alert(tr('nd'));
						return;
					}

					const lbl = mySaveBtn.querySelector('.pickedLabel__label');
					const origTxt = lbl ? lbl.textContent : '';
					if (lbl) lbl.textContent = tr('sav');

					const payloadToSend = preparePinPayload(rawPayload);
					const bodyStr = JSON.stringify(payloadToSend);

					try {
						const res = await fetch('https://api.pinmaker.supercell.com/pins', {
							method: 'POST',
							credentials: 'include',
							headers: {
								'Content-Type': 'application/json'
							},
							body: bodyStr
						});

						const resText = await res.text();

						if (!res.ok) {
							alert(tr('err') + ' (HTTP ' + res.status + '):\n\n' + resText);
							if (lbl) lbl.textContent = origTxt;
							return;
						}

						if (lbl) lbl.textContent = tr('ok');
						setTimeout(() => {
							location.reload();
						}, 1200);
					} catch (err) {
						alert('İstek gönderilemedi: ' + err.message);
						if (lbl) lbl.textContent = origTxt;
					}
				}

				mySaveBtn.onclick = doDirectSave;
				realSaveBtn.parentNode.insertBefore(mySaveBtn, realSaveBtn.nextSibling);
			}

			let myPickerBtn = document.getElementById('pm-json-picker-btn');
			if (!myPickerBtn && mySaveBtn) {
				myPickerBtn = mySaveBtn.cloneNode(true);
				myPickerBtn.id = 'pm-json-picker-btn';
				myPickerBtn.style.marginTop = '14px';
				const flbl = myPickerBtn.querySelector('.pickedLabel__label');
				updateLabel(flbl, window.__customPinFileName ? ('✓ ' + window.__customPinFileName) : tr('sel'), mySaveBtn);

				myPickerBtn.onclick = function (e) {
					e.preventDefault();
					e.stopPropagation();

					if (isCooldownActive(realSaveBtn)) {
						return;
					}

					fileInput.value = '';
					fileInput.click();
				};

				fileInput.onchange = function (ev) {
					const f = ev.target.files[0];
					if (!f) {
						window.__customPinPayload = null;
						window.__customPinFileName = null;
						updateLabel(flbl, tr('sel'), mySaveBtn);
						return;
					}

					if (!f.name.toLowerCase().endsWith('.spcfg')) {
						alert(tr('inv'));
						window.__customPinPayload = null;
						window.__customPinFileName = null;
						updateLabel(flbl, tr('sel'), mySaveBtn);
						return;
					}

					const r = new FileReader();
					r.onload = async function (eRes) {
						const buffer = eRes.target.result;
						let parsedData = null;
						try {
							const decryptedText = await decryptFromRaw(buffer);
							parsedData = JSON.parse(decryptedText);
						} catch (decErr) {
							alert(tr('inv'));
							window.__customPinPayload = null;
							window.__customPinFileName = null;
							updateLabel(flbl, tr('sel'), mySaveBtn);
							return;
						}
						window.__customPinPayload = parsedData;
						window.__customPinFileName = f.name;
						updateLabel(flbl, '✓ ' + f.name, mySaveBtn);
					};
					r.readAsArrayBuffer(f);
				};

				fileInput.oncancel = function () {
					window.__customPinPayload = null;
					window.__customPinFileName = null;
					updateLabel(flbl, tr('sel'), mySaveBtn);
				};

				mySaveBtn.parentNode.insertBefore(myPickerBtn, mySaveBtn.nextSibling);
			}

			if (mySaveBtn && realSaveBtn) {
				const realRBtn = realSaveBtn.querySelector('.RectangleButton');
				const myRBtn = mySaveBtn.querySelector('.RectangleButton');
				const pickerRBtn = myPickerBtn ? myPickerBtn.querySelector('.RectangleButton') : null;
				if (realRBtn && myRBtn) {
					myRBtn.className = realRBtn.className;
					if (pickerRBtn) pickerRBtn.className = realRBtn.className;
				}
			}
		} else {
			const b1 = document.getElementById('pm-my-save-btn');
			const b2 = document.getElementById('pm-json-picker-btn');
			if (b1) b1.remove();
			if (b2) b2.remove();
		}
	}

	const obs = new MutationObserver(sync);
	obs.observe(document.body, {
		childList: true,
		subtree: true
	});
	window.__pmObserver = obs;
	sync();
})();
