function d20plusEngine () {
	d20plus.engine = {};

	d20plus.engine.addProFeatures = () => {
		d20plus.ut.log("Add Pro features");

		d20plus.setMode = d20plus.mod.setMode;
		window.setMode = d20plus.mod.setMode;

		// rebind buttons with new setMode
		const $drawTools = $("#drawingtools");
		const $rect = $drawTools.find(".chooserect");
		const $ellipse = $drawTools.find(".choosecircle");
		const $path = $drawTools.find(".choosepath");
		const $poly = $drawTools.find(".choosepolygon");
		$drawTools.unbind(clicktype).bind(clicktype, function () {
			$(this).hasClass("rect") ? setMode("rect") : $(this).hasClass("ellipse") ? setMode("ellipse") : $(this).hasClass("text") ? setMode("text") : $(this).hasClass("path") ? setMode("path") : $(this).hasClass("drawselect") ? setMode("drawselect") : $(this).hasClass("polygon") && setMode("polygon")
		});
		$rect.unbind(clicktype).bind(clicktype, () => {
			setMode("rect");
			return false;
		});
		$ellipse.unbind(clicktype).bind(clicktype, () => {
			setMode("ellipse");
			return false;
		});
		$path.unbind(clicktype).bind(clicktype, () => {
			setMode("path");
			return false;
		});
		$poly.unbind(clicktype).bind(clicktype, () => {
			setMode("polygon");
			return false;
		});
		$("#rect").unbind(clicktype).bind(clicktype, () => setMode("rect"));
		$("#ellipse").unbind(clicktype).bind(clicktype, () => setMode("ellipse"));
		$("#path").unbind(clicktype).bind(clicktype, () => setMode("path"));

		if (!$(`#fxtools`).length) {
			const $fxMode = $(`<li id="fxtools"/>`).append(`<span class="pictos">e</span>`);
			$fxMode.on("click", () => {
				d20plus.setMode("fxtools");
			});
			$(`#drawingtools`).after($fxMode);
		}

		if (window.is_gm) {
			// add lighting layer tool
			if (!$(`#editinglayer .choosewalls`).length) {
				$(`#editinglayer .choosegmlayer`).after(`<li class="choosewalls"><span class="pictostwo">r</span> Dynamic Lighting</li>`);
			}

			// add light placement tool
			if (!$(`#placelight`).length) {
				const $torchMode = $(`<li class="placelight" tip="Place Light"><img id="placelighticon" src="/images/editor/torch.png" width="20" height="20"></li>`);
				$torchMode.on("click", () => {
					d20plus.setMode("placelight");
				});
				$(`#measure`).after($torchMode);
			}

			$("#page-toolbar").on("mousedown", ".js__settings-page", function () {
				let e = d20.Campaign.pages.get($(this).parents(".availablepage").attr("data-pageid"));
				e.view._template = $.jqotec("#tmpl_pagesettings");
			});
		}
	};

	d20plus.engine._removeStatusEffectEntries = () => {
		$(`#5etools-status-css`).html("");
		Object.keys(d20.token_editor.statusmarkers).filter(k => k.startsWith("5etools_")).forEach(k => delete d20.token_editor.statusmarkers[k]);
	};

	d20plus.engine.enhanceStatusEffects = () => {
		d20plus.ut.log("Enhance status effects");
		$(`head`).append(`<style id="5etools-status-css"/>`);

		d20plus.mod.overwriteStatusEffects();

		d20.engine.canvas.off("object:added");
		d20.engine.canvas.on("object:added", d20plus.mod.overwriteStatusEffects);

		// the holy trinity
		// d20.engine.canvas.on("object:removed", () => console.log("added"));
		// d20.engine.canvas.on("object:removed", () => console.log("removed"));
		// d20.engine.canvas.on("object:modified", () => console.log("modified"));

		$(document).off("mouseenter", ".markermenu");
		$(document).on("mouseenter", ".markermenu", d20plus.mod.mouseEnterMarkerMenu)
	};

	d20plus.engine.swapTemplates = () => {
		d20plus.ut.log("Swapping templates...");
		$("#tmpl_charactereditor").html($(d20plus.html.characterEditor).html());
		$("#tmpl_handouteditor").html($(d20plus.html.handoutEditor).html());
		$("#tmpl_deckeditor").html($(d20plus.html.deckEditor).html());
		$("#tmpl_cardeditor").html($(d20plus.html.cardEditor).html());
		// ensure tokens have editable sight
		$("#tmpl_tokeneditor").replaceWith(d20plus.html.tokenEditor);
		// show dynamic lighting/etc page settings
		$("#tmpl_pagesettings").replaceWith(d20plus.engine._makePageSettings());
		// swap templates stashed in page.view.template for each page
		d20.Campaign.pages.models.forEach(page => page.view.template = $.jqotec("#tmpl_pagesettings"));
	};

	d20plus.engine._makePageSettings = () => {
		return `<script id='tmpl_pagesettings' type='text/html'>
			<ul class='nav nav-tabs pagedetails_navigation'>
				${d20plus.html.pageSettingsNavTabs}
			</ul>
			<div class='tab-content'>
				${d20plus.html.pageSettings}
				${d20plus.html.pageSettingsWeather}
			</div>
		</script>`;
	};

	d20plus.engine.enhancePageSelector = () => {
		d20plus.ut.log("Enhancing page selector");

		let updatePageOrder = function () {
			d20plus.ut.log("Saving page order...");
			let pos = 0;
			$("#page-toolbar .pages .chooseablepage").each(function () {
				let page = d20.Campaign.pages.get($(this).attr("data-pageid"));
				page && page.save({
					placement: pos,
				});
				pos++;
			});
			d20.pagetoolbar.noReload = false;
			d20.pagetoolbar.refreshPageListing();
		};

		function overwriteDraggables () {
			// make them draggable on both axes
			$("#page-toolbar .pages").sortable("destroy");
			$("#page-toolbar .pages").sortable({
				items: "> .chooseablepage",
				start: function () {
					d20.pagetoolbar.noReload = true;
				},
				stop: function () {
					updatePageOrder()
				},
				distance: 15,
			}).addTouch();
			$("#page-toolbar .playerbookmark").draggable("destroy");
			$("#page-toolbar .playerbookmark").draggable({
				revert: "invalid",
				appendTo: "#page-toolbar",
				helper: "original",
			}).addTouch();
			$("#page-toolbar .playerspecificbookmark").draggable("destroy");
			$("#page-toolbar .playerspecificbookmark").draggable({
				revert: "invalid",
				appendTo: "#page-toolbar",
				helper: "original",
			}).addTouch();
		}

		overwriteDraggables();
		$(`#page-toolbar`).css("top", "calc(-90vh + 40px)");

		const originalFn = d20.pagetoolbar.refreshPageListing;
		// original function is debounced at 100ms, so debounce this at 110ms and hope for the best
		const debouncedOverwrite = _.debounce(() => {
			overwriteDraggables();
			// fire an event for other parts of the script to listen for
			const pageChangeEvt = new Event(`VePageChange`);
			d20plus.ut.log("Firing page-change event");
			document.dispatchEvent(pageChangeEvt);
		}, 110);
		d20.pagetoolbar.refreshPageListing = () => {
			originalFn();
			debouncedOverwrite();
		}

		$(`body`).on("mouseup", "li.dl", (evt) => {
			// process Dynamic Lighting tabs
			const $dynLightTab = $(evt.target).closest("li.dl");
			const $isTabAnchor = $(evt.target).closest("a");
			if (!$dynLightTab.hasClass("active")) {
				setTimeout(() => {
					if (!$dynLightTab.hasClass("legacy")) $(`[data-tab=lighting]:visible`).click();
					else $(`[data-tab=legacy-lighting]:visible`).click();
				}, 10);
			}
			if ($isTabAnchor.data("tab") === "lighting") $dynLightTab.removeClass("legacy");
			if ($isTabAnchor.data("tab") === "legacy-lighting") $dynLightTab.addClass("legacy");
		}).on("mousedown", ".chooseablepage .js__settings-page", (evt) => {
			const {currentTarget: target} = evt;
			d20plus.engine._lastSettingsPageId = $(target).closest(`[data-pageid]`).data("pageid");
		}).on("click", ".weather input[type=range]", (evt) => {
			const {currentTarget: target} = evt;
			if (target.name) $(`.${target.name}`).val(target.value);
		}).on("click", ".chooseablepage .js__settings-page", () => {
			setTimeout(() => d20plus.engine.enhancePageSettings(), 50);
		}).on("click", ".nav-tabs--beta", () => {
			d20plus.engine._populateCustomOptions();
		}).on("click keyup", ".weather input, .weather .slider", () => {
			d20plus.engine._updateCustomOptions();
		});
	};

	d20plus.engine.enhancePageSettings = () => {
		if (!d20plus.engine._lastSettingsPageId) return;
		const page = d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (page && page.get) {
			const $dialog = $(`.pagedetails_navigation:visible`).closest(`.ui-dialog`);
			const $saveBtn = $dialog.find(`.btn-primary:visible`);
			// if editing active page then close pages list and add Apply button
			if (d20.Campaign.activePage().id === d20plus.engine._lastSettingsPageId) {
				const $barPage = $(`#page-toolbar`);
				const $overlay = $(`.ui-widget-overlay`);
				const templateApply = `<button type="button" class="btn btn-apply" title="Apply settings for current page">Apply</button>`;
				if (!$barPage.hasClass("closed")) {
					$barPage.find(`.handle`).click();
					$overlay.remove();
				}
				$saveBtn.before(templateApply);
				$(`.btn-apply`).on("click", d20plus.engine.applySettings);
			}
			// process options within open dialog
			if ($dialog[0]) {
				const $pageTitle = $dialog.find(`.ui-dialog-title:visible`);
				d20plus.engine._preserveCustomOptions(page);
				d20plus.engine._populateCustomOptions(page, $dialog.find(`.dialog .tab-content`));
				if ($pageTitle[0] && !$(".ui-dialog-pagename:visible")[0]) {
					$pageTitle.after(`<span class="ui-dialog-pagename">${page.get("name")}</span>`);
					$saveBtn.off("click");
					$saveBtn.on("click", d20plus.engine.applySettings);
					// closed editors behave strangely, so replace Close with Cancel
					$dialog.find(`.ui-dialog-titlebar-close:visible`).on("mousedown", () => {
						$dialog.find(`.ui-dialog-buttonpane .btn:not(.btn-apply):not(.btn-primary)`).click();
					}).off("click");
					// one property for two checkboxes, make sure they're synced
					const $dynlgtCheckbox = $(`.tab-content:visible .dyn_fog_update_on_drop`).parent().parent();
					const $legacyCheckbox = $(`.tab-content:visible .lightingupdate`);
					$dynlgtCheckbox.on("click", (evt) => {
						const $checkTarget = $(evt.target).parent().find(`input`);
						if ($checkTarget.length) {
							$legacyCheckbox.prop("checked", $checkTarget.prop("checked"));
						}
					});
				}
			}
		}
	}

	d20plus.engine.applySettings = (evt) => {
		evt.stopPropagation();
		evt.preventDefault();
		const page = d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (!page?.get) return;

		const $dialog = $(`.pagedetails_navigation:visible`).closest(".ui-dialog");
		if (!$dialog[0]) return;

		const activeTab = $(`li.active:visible:not(.dl) > a`).data("tab");
		const activeTabScroll = $dialog.find(`.ui-dialog-content`).scrollTop();
		const $settings = $dialog.find(`.dialog .tab-content`);

		d20plus.engine._saveCustomOptions(page);
		d20plus.engine._saveNativeOptions(page, $settings);

		page.save();

		if (!$(evt.currentTarget).hasClass("btn-apply")) {
			// now we should close the dialog (effectively press Cancel)
			$(`.ui-dialog-buttonpane:visible .btn:not(.btn-apply):not(.btn-primary)`).click();
		} else {
			// page.save resets current dialog, so we need to restore status quo
			$(`.nav-tabs:visible [data-tab=${activeTab}]`).click();
			$(`.ui-dialog-content:visible`).scrollTop(activeTabScroll);
			d20plus.engine._populateCustomOptions();
		}
	}

	d20plus.engine._ROLL20_PAGE_OPTIONS = {
		width: {id: "page-size-width-input", class: ".width.units.page_setting_item"},
		height: {id: "page-size-height-input", class: ".height.units.page_setting_item"},
		background_color: {class: ".pagebackground"},
		scale_number: {id: "page-size-height-input", class: ".scale_number"},
		scale_units: {id: "page-scale-grid-cell-label-select", class: ".scale_units"},
		gridlabels: {id: "page-grid-hex-label-toggle", class: ".gridlabels"},
		snapping_increment: {id: "page-grid-cell-width-input", class: ".grid-cell-width.snappingincrement.units"},
		gridcolor: {class: ".gridcolor"},
		grid_opacity: {class: ".gridopacity a.ui-slider-handle"},
		lightrestrictmove: {id: "page-dynamic-lighting-line-restrict-movement-toggle", class: ".lightrestrictmove"},
		jukeboxtrigger: {id: "page-audio-play-on-load", class: ".pagejukeboxtrigger"},

		dynamic_lighting_enabled: {class: ".dyn_fog_enabled"},
		explorer_mode: {class: ".dyn_fog_autofog_mode"},
		daylight_mode_enabled: {class: ".dyn_fog_global_illum"},
		daylightModeOpacity: {class: ".dyn_fog_daylight_slider"},
		// lightupdatedrop: {class: ".dyn_fog_update_on_drop"}, // same property
		fog_opacity: {class: ".fogopacity a.ui-slider-handle"},

		showdarkness: {class: ".darknessenabled"},

		adv_fow_enabled: {class: ".advancedfowenabled"},
		adv_fow_show_grid: {class: ".advancedfowshowgrid"},
		adv_fow_dim_reveals: {class: ".dimlightreveals"},
		adv_fow_gm_see_all: {id: "#afow_gm_see_all"},
		adv_fow_grid_size: {class: ".advancedfowgridsize"},
		showlighting: {class: ".lightingenabled"},
		lightenforcelos: {class: ".lightenforcelos"},
		lightupdatedrop: {class: ".lightingupdate"},
		lightglobalillum: {class: ".lightglobalillum"},
	};

	d20plus.engine._saveNativeOptions = (page, dialog) => {
		if (!page || !page.get) return;
		const getSlider = (el) => {
			if (el.style.left?.search("%") > 0) return el.style.left.slice(0, -1) / 100;
			else {
				// eslint-disable-next-line no-console
				console.warn("%cD20Plus > ", "color: #b93032; font-size: large", "Can't process slider value");
				return undefined;
			}
		}
		const getVal = (el) => {
			if (el.hasClass("dyn_fog_autofog_mode")) return el.prop("checked") ? "basic" : "off";
			else if (el.is(":checkbox")) return !!el.prop("checked");
			else if (el.hasClass("ui-slider-handle")) return getSlider(el.get(0));
			else return el.val();
		}
		Object.entries(d20plus.engine._ROLL20_PAGE_OPTIONS).forEach(([name, option]) => {
			const $e = dialog.find(option.class || option.id);
			const val = getVal($e);
			if (val !== undefined) page.attributes[name] = val;
		});
	}

	d20plus.engine._preserveCustomOptions = (page) => {
		if (!page || !page.get) return;
		d20plus.engine._customOptions = d20plus.engine._customOptions || {};
		d20plus.engine._customOptions[page.id] = { _defaults: {} };
		[
			"weather",
		].forEach(category => Object.entries(d20plus[category].props).forEach(([name, deflt]) => {
			d20plus.engine._customOptions[page.id][name] = page.get(`bR20cfg_${name}`) || deflt;
			d20plus.engine._customOptions[page.id]._defaults[name] = deflt;
		}));
	}

	d20plus.engine._populateCustomOptions = (page, dialog) => {
		dialog = dialog || $(`.pagedetails_navigation:visible`).closest(".ui-dialog");
		page = page || d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (!d20plus.engine._customOptions[page.id]) return;
		Object.entries(d20plus.engine._customOptions[page.id]).forEach(([name, val]) => {
			dialog.find(`[name="${name}"]`).each((i, e) => {
				const $e = $(e);
				if ($e.is(":checkbox")) {
					$e.prop("checked", !!val);
				} else if ($e.is("input[type=range]")) {
					dialog.find(`.${name}`).val(val);
					$e.val(val);
				} else {
					$e.val(val);
				}
			});
		});
		// ensure all Select elements will update options on change
		$(".weather select").each((a, b) => { b.onchange = () => d20plus.engine._updateCustomOptions() });
	}

	d20plus.engine._updateCustomOptions = (page, dialog) => {
		dialog = dialog || $(`.pagedetails_navigation:visible`).closest(".ui-dialog");
		page = page || d20.Campaign.pages.get(d20plus.engine._lastSettingsPageId);
		if (!d20plus.engine._customOptions[page.id]) return;
		Object.entries(d20plus.engine._customOptions[page.id]).forEach(([name, val]) => {
			dialog.find(`[name="${name}"]`).each((i, e) => {
				const $e = $(e);
				const val = $e.is(":checkbox") ? !!$e.prop("checked") : $e.val();
				d20plus.engine._customOptions[page.id][name] = val;
			});
		});
	}

	d20plus.engine._saveCustomOptions = (page) => {
		const values = d20plus.engine._customOptions[page.id];
		Object.entries(values).forEach(([name, val]) => {
			if (name === "_defaults") return;
			if (val && val !== values._defaults[name]) {
				page.attributes[`bR20cfg_${name}`] = val;
			} else {
				if (page.attributes.hasOwnProperty(`bR20cfg_${name}`)) {
					page.attributes[`bR20cfg_${name}`] = null;
				}
			}
		});
	}

	d20plus.engine.initQuickSearch = ($iptSearch, $outSearch) => {
		$iptSearch.on("keyup", () => {
			const searchVal = ($iptSearch.val() || "").trim();
			$outSearch.empty();
			if (searchVal.length <= 2) return; // ignore 2 characters or less, for performance reasons
			const found = $(`#journal .content`).find(`li[data-itemid]`).filter((i, ele) => {
				const $ele = $(ele);
				return $ele.find(`.name`).text().trim().toLowerCase().includes(searchVal.toLowerCase());
			});
			if (found.length) {
				$outSearch.append(`<p><b>Search results:</b></p>`);
				const $outList = $(`<ol class="dd-list Vetools-search-results"/>`);
				$outSearch.append($outList);
				found.clone().addClass("Vetools-draggable").appendTo($outList);
				$outSearch.append(`<hr>`);
				$(`.Vetools-search-results .Vetools-draggable`).draggable({
					revert: true,
					distance: 10,
					revertDuration: 0,
					helper: "clone",
					handle: ".namecontainer",
					appendTo: "body",
					scroll: true,
					start: function () {
						$("#journalfolderroot").addClass("externaldrag")
					},
					stop: function () {
						$("#journalfolderroot").removeClass("externaldrag")
					},
				});
			}
		});
	};

	/* eslint-disable */

	d20plus.engine.getSelectedToMove = () => {
		const n = [];
		for (var l = d20.engine.selected(), c = 0; c < l.length; c++)
			n.push(l[c]);
	};

	d20plus.engine.forwardOneLayer = (n) => {
		d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
			_.each(n, function (e) {
				d20.engine.canvas.bringForward(e)
			}),
			d20.Campaign.activePage().debounced_recordZIndexes()
	};

	d20plus.engine.backwardOneLayer = (n) => {
		d20.engine.canvas.getActiveGroup() && d20.engine.unselect(),
			_.each(n, function (e) {
				d20.engine.canvas.sendBackwards(e)
			}),
			d20.Campaign.activePage().debounced_recordZIndexes()
	};

	// previously "enhanceSnap"
	d20plus.engine.enhanceMouseDown = () => {
		const R = d20plus.overwrites.canvasHandlerDown

		if (FINAL_CANVAS_MOUSEDOWN_LIST.length) {
			FINAL_CANVAS_MOUSEDOWN = (FINAL_CANVAS_MOUSEDOWN_LIST.find(it => it.on === d20.engine.final_canvas) || {}).listener;
		}

		if (FINAL_CANVAS_MOUSEDOWN) {
			d20plus.ut.log("Enhancing hex snap");
			d20.engine.final_canvas.removeEventListener("mousedown", FINAL_CANVAS_MOUSEDOWN);
			d20.engine.final_canvas.addEventListener("mousedown", R);
		}

		// add sub-grid snap
		d20.engine.snapToIncrement = function(e, t) {
			t *= Number(d20plus.cfg.getOrDefault("canvas", "gridSnap"));
			return t * Math.round(e / t);
		}
	};

	d20plus.engine.enhanceMouseUp = () => { // P

	};

	// needs to be called after `enhanceMeasureTool()`
	d20plus.engine.enhanceMouseMove = () => {
		// add missing vars
		var i = d20.engine.canvas;

		// Roll20 bug (present as of 2019-5-25) workaround
		//   when box-selecting + moving tokens, the "object:moving" event throws an exception
		//   try-catch-ignore this, because it's extremely annoying
		const cachedFire = i.fire.bind(i);
		i.fire = function (namespace, opts) {
			if (namespace === "object:moving") {
				try {
					cachedFire(namespace, opts);
				} catch (e) {}
			} else {
				cachedFire(namespace, opts);
			}
		};

		const I = d20plus.overwrites.canvasHandlerMove

		if (FINAL_CANVAS_MOUSEMOVE_LIST.length) {
			FINAL_CANVAS_MOUSEMOVE = (FINAL_CANVAS_MOUSEMOVE_LIST.find(it => it.on === d20.engine.final_canvas) || {}).listener;
		}

		if (FINAL_CANVAS_MOUSEMOVE) {
			d20plus.ut.log("Enhancing mouse move");
			d20.engine.final_canvas.removeEventListener("mousemove", FINAL_CANVAS_MOUSEMOVE);
			d20.engine.final_canvas.addEventListener("mousemove", I);
		}
	};

	/* eslint-enable */

	d20plus.engine.addLineCutterTool = () => {
		const $btnTextTool = $(`.choosetext`);

		const $btnSplitTool = $(`<li class="choosesplitter">✂️ Line Splitter</li>`).click(() => {
			d20plus.setMode("line_splitter");
		});

		$btnTextTool.after($btnSplitTool);
	};

	d20plus.engine._tokenHover = null;
	d20plus.engine._drawTokenHover = () => {
		$(`.Vetools-token-hover`).remove();
		if (!d20plus.engine._tokenHover || !d20plus.engine._tokenHover.text) return;

		const pt = d20plus.engine._tokenHover.pt;
		const txt = unescape(d20plus.engine._tokenHover.text);

		$(`body`).append(`<div class="Vetools-token-hover" style="top: ${pt.y * d20.engine.canvasZoom}px; left: ${pt.x * d20.engine.canvasZoom}px">${txt}</div>`);
	};
	d20plus.engine.addTokenHover = () => {
		// gm notes on shift-hover
		const cacheRenderLoop = d20.engine.renderLoop;
		d20.engine.renderLoop = () => {
			d20plus.engine._drawTokenHover();
			cacheRenderLoop();
		};

		// store data for the rendering function to access
		d20.engine.canvas.on("mouse:move", (data, ...others) => {
			// enable hover from GM layer -> token layer
			let hoverTarget = data.target;
			if (data.e && window.currentEditingLayer === "gmlayer") {
				const cache = window.currentEditingLayer;
				window.currentEditingLayer = "objects";
				hoverTarget = d20.engine.canvas.findTarget(data.e, null, true);
				window.currentEditingLayer = cache;
			}

			if (data.e.shiftKey && hoverTarget && hoverTarget.model) {
				d20.engine.redrawScreenNextTick();
				const gmNotes = hoverTarget.model.get("gmnotes");
				const pt = d20.engine.canvas.getPointer(data.e);
				pt.x -= d20.engine.currentCanvasOffset[0];
				pt.y -= d20.engine.currentCanvasOffset[1];
				d20plus.engine._tokenHover = {
					pt: pt,
					text: gmNotes,
					id: hoverTarget.model.id,
				};
			} else {
				if (d20plus.engine._tokenHover) d20.engine.redrawScreenNextTick();
				d20plus.engine._tokenHover = null;
			}
		})
	};

	d20plus.engine.enhanceMarkdown = () => {
		const OUT_STRIKE = "<span style='text-decoration: line-through'>$1</span>";

		/* eslint-disable */

		// BEGIN ROLL20 CODE
		window.Markdown.parse = function(e) {
			{
				var t = e
					, n = []
					, i = [];
				-1 != t.indexOf("\r\n") ? "\r\n" : -1 != t.indexOf("\n") ? "\n" : ""
			}
			return t = t.replace(/{{{([\s\S]*?)}}}/g, function(e) {
				return n.push(e.substring(3, e.length - 3)),
					"{{{}}}"
			}),
				t = t.replace(new RegExp("<pre>([\\s\\S]*?)</pre>","gi"), function(e) {
					return i.push(e.substring(5, e.length - 6)),
						"<pre></pre>"
				}),
				// BEGIN MOD
				t = t.replace(/~~(.*?)~~/g, OUT_STRIKE),
				// END MOD
				t = t.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
				t = t.replace(/\*(.*?)\*/g, "<em>$1</em>"),
				t = t.replace(/``(.*?)``/g, "<code>$1</code>"),
				t = t.replace(/\[([^\]]+)\]\(([^)]+(\.png|\.gif|\.jpg|\.jpeg))\)/g, '<a href="$2"><img src="$2" alt="$1" /></a>'),
				t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>'),
				t = t.replace(new RegExp("<pre></pre>","g"), function() {
					return "<pre>" + i.shift() + "</pre>"
				}),
				t = t.replace(/{{{}}}/g, function() {
					return n.shift()
				})
		};
		// END ROLL20 CODE

		/* eslint-enable */

		// after a short delay, replace any old content in the chat
		setTimeout(() => {
			$(`.message`).each(function () {
				$(this).html($(this).html().replace(/~~(.*?)~~/g, OUT_STRIKE))
			})
		}, 2500);
	};

	d20plus.engine.enhancePathWidths = () => {
		const $selThicc = $(`#path_width`).css("width", "150px");
		$selThicc.append(`
				<option value="5">Custom 1 (5 px.)</option>
				<option value="5">Custom 2 (5 px.)</option>
				<option value="5">Custom 3 (5 px.)</option>
			`);
		const $iptThicc = $(`<input type="number" style="max-width: 50px;">`).hide();
		const $lblPixels = $(`<label style="display: inline-flex;"> pixels</label>`).hide();
		$selThicc.after($lblPixels).after($iptThicc);

		let $selOpt = null;
		$selThicc.on("change", () => {
			$selOpt = $selThicc.find(`option:selected`);
			const txt = $selOpt.text();
			if (txt.startsWith("Custom")) {
				const thicc = /\((.*?) px\.\)/.exec(txt)[1];
				$lblPixels.show();
				$iptThicc.show().val(Number(thicc));
			} else {
				$lblPixels.hide();
				$iptThicc.hide();
			}
		});

		$iptThicc.on("keyup", () => {
			if (!$selOpt) $selOpt = $selThicc.find(`option:selected`);
			if ($selOpt) {
				const clean = Math.round(Math.max(1, Number($iptThicc.val())));
				$selOpt.val(`${clean}`);
				$selOpt.text($selOpt.text().replace(/\(\d+ px\.\)/, `(${clean} px.)`));
				d20.engine.canvas.freeDrawingBrush.width = clean;
			}
		});
	};

	d20plus.engine.enhanceTransmogrifier = () => {
		JqueryUtil.addSelectors();

		$("#transmogrifier").on("click", () => {
			setTimeout(() => {
				const $btnAlpha = $(`#vetools-transmog-alpha`);
				if (!$btnAlpha.length) {
					const $prependTarget = $(`.ui-dialog-title:textEquals(transmogrifier)`).first().parent().parent().find(`.ui-dialog-content`);
					$(`<button id="#vetools-transmog-alpha" class="btn btn default" style="margin-bottom: 5px;">Sort Items Alphabetically</button>`).on("click", () => {
						// coped from a bookmarklet
						$("iframe").contents().find(".objects").each((c, e) => { let $e = $(e); $e.children().sort((a, b) => { let name1 = $(a).find(".name").text().toLowerCase(); let name2 = $(b).find(".name").text().toLowerCase(); let comp = name1.localeCompare(name2); return comp; }).each((i, c) => $e.append(c)); });
					}).prependTo($prependTarget);
				}
			}, 35);
		})
	};

	d20plus.engine.addLayers = () => {
		d20plus.ut.log("Adding layers");

		d20plus.mod.editingLayerOnclick();
		if (window.is_gm) {
			// Add layers to layer dropdown
			$(`#floatingtoolbar .choosemap`).html(`<span class="pictos" style="padding: 0 3px 0 3px;">@</span> Map`);
			if (d20plus.cfg.getOrDefault("canvas", "showBackground")) {
				$(`#floatingtoolbar .choosemap`).after(`
					<li class="choosebackground">
						<span class="pictos">a</span>
						Background
					</li>
				`);
			}
			if (d20plus.cfg.getOrDefault("canvas", "showForeground")) {
				$(`#floatingtoolbar .chooseobjects`).after(`
					<li class="chooseforeground">
						<span class="pictos">B</span>
						Foreground
					</li>
				`);
			}

			if (d20plus.cfg.getOrDefault("canvas", "showWeather")) {
				$(`#floatingtoolbar .choosewalls`).after(`
					<li class="chooseweather">
						<span class="pictos">C</span>
						Weather Exclusions
					</li>
				`);
			}
		}

		d20.engine.canvas._renderAll = _.bind(d20plus.mod.renderAll, d20.engine.canvas);
		d20.engine.canvas._layerIteratorGenerator = d20plus.mod.layerIteratorGenerator;
	};

	d20plus.engine.removeLinkConfirmation = function () {
		d20.utils.handleURL = d20plus.mod.handleURL;
		$(document).off("click", "a").on("click", "a", d20.utils.handleURL);
	};

	d20plus.engine.repairPrototypeMethods = function () {
		d20plus.mod.fixHexMethods();
		d20plus.mod.fixVideoMethods();
	};

	d20plus.engine.disableFrameRecorder = function () {
		if (d20.engine.frame_recorder) {
			d20.engine.frame_recorder.active = false;
			d20.engine.frame_recorder._active = false;
		}
	};
}

SCRIPT_EXTENSIONS.push(d20plusEngine);
