import { c as e } from "react/compiler-runtime";
import { useEffect as t, useLayoutEffect as n, useMemo as r, useRef as i, useState as a } from "react";
import { EditorContent as o, useEditor as s, useEditorState as c } from "@tiptap/react";
import l from "@tiptap/starter-kit";
import u from "@tiptap/extension-underline";
import d from "@tiptap/extension-link";
import { Table as f, TableCell as p, TableHeader as m, TableRow as h } from "@tiptap/extension-table";
import g from "@tiptap/extension-placeholder";
import { Extension as _ } from "@tiptap/core";
import v from "@tiptap/extension-image";
import { ArrowDown as y, ArrowLeft as b, ArrowRight as x, ArrowUp as S, Bold as C, ChevronDown as w, Code as T, Code2 as E, Columns3 as D, Heading1 as O, Heading2 as k, Heading3 as A, Image as j, Italic as M, Link2 as N, Link2Off as P, List as F, ListOrdered as I, Minus as L, Pilcrow as R, Quote as z, Redo2 as B, Rows3 as V, Strikethrough as H, Table as U, Trash2 as W, Underline as G, Undo2 as ee, X as K } from "lucide-react";
import { jsx as q, jsxs as J } from "react/jsx-runtime";
import { createPortal as Y } from "react-dom";
import { NodeSelection as te } from "@tiptap/pm/state";
//#region src/editor/extensions/ImageUpload.ts
var ne = v.extend({ addAttributes() {
	return {
		...this.parent?.(),
		"data-uploading": {
			default: null,
			parseHTML: (e) => e.getAttribute("data-uploading"),
			renderHTML: (e) => e["data-uploading"] ? { "data-uploading": "true" } : {}
		}
	};
} });
function X(e, t) {
	let n = -1, r = Infinity;
	return e.state.doc.descendants((e, i) => {
		if (e.type.name === "image" && e.attrs["data-uploading"]) {
			let e = Math.abs(i - t);
			e < r && (r = e, n = i);
		}
		return !0;
	}), n;
}
var re = _.create({
	name: "imageUpload",
	addOptions() {
		return { uploadImage: void 0 };
	},
	addStorage() {
		return {
			dom: null,
			cleanup: null
		};
	},
	addCommands() {
		return { uploadAndInsertImage: (e) => ({ editor: t }) => {
			let { uploadImage: n } = this.options;
			if (!n) return !1;
			let r = t.state.selection.from, i = t.schema.nodes.image.create({
				src: "",
				"data-uploading": "true"
			});
			return t.chain().insertContentAt(r, i).run(), n(e).then((e) => {
				let n = X(t, r);
				n < 0 || t.chain().command(({ tr: t }) => {
					let r = t.doc.nodeAt(n);
					return r?.type.name === "image" && (t.setNodeMarkup(n, void 0, {
						...r.attrs,
						src: e,
						"data-uploading": null
					}), !0);
				}).run();
			}).catch(() => {
				let e = X(t, r);
				e >= 0 && t.chain().deleteRange({
					from: e,
					to: e + 1
				}).run(), t.emit("imageUploadError", { message: "图片上传失败，请重试" });
			}), !0;
		} };
	},
	onCreate() {
		let { editor: e } = this, { uploadImage: t } = this.options, n = e.view.dom;
		this.storage.dom = n;
		let r = (n, r) => {
			let i = e.schema.nodes.image.create({
				src: "",
				"data-uploading": "true"
			});
			e.chain().insertContentAt(n, i).run(), t?.(r).then((t) => {
				let r = X(e, n);
				r < 0 || e.chain().command(({ tr: e }) => {
					let n = e.doc.nodeAt(r);
					return n?.type.name === "image" && (e.setNodeMarkup(r, void 0, {
						...n.attrs,
						src: t,
						"data-uploading": null
					}), !0);
				}).run();
			}).catch(() => {
				let t = X(e, n);
				t >= 0 && e.chain().deleteRange({
					from: t,
					to: t + 1
				}).run(), e.emit("imageUploadError", { message: "图片上传失败，请重试" });
			});
		}, i = (e) => Array.from(e ?? []).find((e) => e.type.startsWith("image/")), a = (n) => {
			let a = i(n.clipboardData?.files);
			if (a) {
				if (n.preventDefault(), !t) {
					e.emit("imageUploadBlocked", { message: "未配置图片上传，请使用 URL 插入" });
					return;
				}
				r(e.state.selection.from, a);
			}
		}, o = (n) => {
			let a = i(n.dataTransfer?.files);
			if (!a || (n.preventDefault(), !t)) return;
			let o = e.view.posAtCoords({
				left: n.clientX,
				top: n.clientY
			});
			o && r(o.pos, a);
		};
		n.addEventListener("paste", a), n.addEventListener("drop", o), this.storage.cleanup = () => {
			n.removeEventListener("paste", a), n.removeEventListener("drop", o);
		};
	},
	onDestroy() {
		this.storage.cleanup?.(), this.storage.cleanup = null, this.storage.dom = null;
	}
});
//#endregion
//#region src/editor/extensions/index.ts
function ie(e) {
	let t = e.extensions ?? [], n = new Set(t.map((e) => e.name));
	return [...[
		l.configure({
			heading: { levels: [
				1,
				2,
				3
			] },
			link: !1,
			underline: !1
		}),
		u,
		d.configure({
			openOnClick: !1,
			autolink: !0,
			defaultProtocol: "https",
			HTMLAttributes: {
				rel: "noopener noreferrer nofollow",
				target: "_blank"
			}
		}),
		ne.configure({ inline: !1 }),
		e.uploadImage ? re.configure({ uploadImage: e.uploadImage }) : re,
		f.configure({ resizable: !0 }),
		h,
		m,
		p,
		g.configure({ placeholder: e.placeholder ?? "请输入内容…" })
	].filter((e) => !n.has(e.name)), ...t];
}
//#endregion
//#region src/editor/useZhimoEditor.ts
function ae(e, t) {
	if (e === void 0 || e === "") return "";
	if (t === "json") try {
		return JSON.parse(e);
	} catch {
		return "";
	}
	return e;
}
function oe(e, t) {
	return t === "json" ? JSON.stringify(e.getJSON()) : e.getHTML();
}
function se(e) {
	let { value: n, defaultValue: i, format: a = "html", placeholder: o, disabled: c, extensions: l, uploadImage: u, onChange: d, onCreate: f, onFocus: p, onBlur: m, onSelectionUpdate: h } = e, g = r(() => ie({
		placeholder: o,
		extensions: l,
		uploadImage: u
	}), [
		o,
		l,
		u
	]), _ = s({
		extensions: g,
		content: ae(i ?? n, a),
		editable: !c,
		onUpdate: ({ editor: e }) => {
			d?.(oe(e, a));
		},
		onFocus: p,
		onBlur: m,
		onSelectionUpdate: h,
		onCreate: ({ editor: e }) => f?.(e)
	});
	return t(() => {
		if (!(!_ || n === void 0) && oe(_, a) !== n) {
			if (a === "json") try {
				JSON.parse(n);
			} catch {
				return;
			}
			_.commands.setContent(ae(n, a), { emitUpdate: !1 });
		}
	}, [
		_,
		n,
		a
	]), t(() => {
		_?.setEditable(!c);
	}, [_, c]), _;
}
//#endregion
//#region src/editor/toolbar/Button.tsx
function Z(t) {
	let n = e(10), { icon: r, label: i, shortcut: a, active: o, disabled: s, onClick: c } = t, l = a ? `${i}（${a}）` : i, u = o ? "true" : "false", d = o ?? !1, f;
	n[0] === r ? f = n[1] : (f = /* @__PURE__ */ q(r, {
		size: 16,
		strokeWidth: 2,
		"aria-hidden": !0
	}), n[0] = r, n[1] = f);
	let p;
	return n[2] !== s || n[3] !== i || n[4] !== c || n[5] !== u || n[6] !== d || n[7] !== f || n[8] !== l ? (p = /* @__PURE__ */ q("button", {
		type: "button",
		className: "zm-tool-btn",
		"data-active": u,
		"data-tooltip": l,
		disabled: s,
		"aria-label": i,
		"aria-pressed": d,
		onClick: c,
		children: f
	}), n[2] = s, n[3] = i, n[4] = c, n[5] = u, n[6] = d, n[7] = f, n[8] = l, n[9] = p) : p = n[9], p;
}
//#endregion
//#region src/editor/toolbar/Divider.tsx
function ce() {
	let t = e(1), n;
	return t[0] === Symbol.for("react.memo_cache_sentinel") ? (n = /* @__PURE__ */ q("span", {
		className: "zm-tool-divider",
		"aria-hidden": !0
	}), t[0] = n) : n = t[0], n;
}
//#endregion
//#region src/editor/toolbar/Select.tsx
var Q = [
	{
		label: "正文",
		isActive: (e) => e.isActive("paragraph"),
		apply: (e) => e.chain().focus().setParagraph().run()
	},
	{
		label: "标题 1",
		isActive: (e) => e.isActive("heading", { level: 1 }),
		apply: (e) => e.chain().focus().toggleHeading({ level: 1 }).run()
	},
	{
		label: "标题 2",
		isActive: (e) => e.isActive("heading", { level: 2 }),
		apply: (e) => e.chain().focus().toggleHeading({ level: 2 }).run()
	},
	{
		label: "标题 3",
		isActive: (e) => e.isActive("heading", { level: 3 }),
		apply: (e) => e.chain().focus().toggleHeading({ level: 3 }).run()
	}
];
function le(n) {
	let r = e(20), { editor: o, disabled: s } = n, l = s !== void 0 && s, [u, d] = a(!1), f = i(null), p;
	r[0] === o ? p = r[1] : (p = {
		editor: o,
		selector: de
	}, r[0] = o, r[1] = p);
	let m = c(p), h, g;
	r[2] === u ? (h = r[3], g = r[4]) : (h = () => {
		if (!u) return;
		let e = (e) => {
			f.current && !f.current.contains(e.target) && d(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, g = [u], r[2] = u, r[3] = h, r[4] = g), t(h, g);
	let _ = m ?? Q[0].label, v;
	r[5] === l ? v = r[6] : (v = () => !l && d(ue), r[5] = l, r[6] = v);
	let y;
	r[7] === Symbol.for("react.memo_cache_sentinel") ? (y = /* @__PURE__ */ q(w, {
		size: 14,
		"aria-hidden": !0
	}), r[7] = y) : y = r[7];
	let b;
	r[8] !== l || r[9] !== _ || r[10] !== u || r[11] !== v ? (b = /* @__PURE__ */ J("button", {
		type: "button",
		className: "zm-select-trigger",
		"aria-haspopup": "listbox",
		"aria-expanded": u,
		disabled: l,
		onClick: v,
		children: [_, y]
	}), r[8] = l, r[9] = _, r[10] = u, r[11] = v, r[12] = b) : b = r[12];
	let x;
	r[13] !== o || r[14] !== _ || r[15] !== u ? (x = u && /* @__PURE__ */ q("div", {
		className: "zm-dropdown",
		role: "listbox",
		children: Q.map((e) => /* @__PURE__ */ q("button", {
			type: "button",
			role: "option",
			"aria-selected": e.label === _,
			className: "zm-dropdown-item",
			"data-active": e.label === _ ? "true" : "false",
			onClick: () => {
				e.apply(o), d(!1);
			},
			children: e.label
		}, e.label))
	}), r[13] = o, r[14] = _, r[15] = u, r[16] = x) : x = r[16];
	let S;
	return r[17] !== b || r[18] !== x ? (S = /* @__PURE__ */ J("div", {
		className: "zm-tool-select",
		ref: f,
		children: [b, x]
	}), r[17] = b, r[18] = x, r[19] = S) : S = r[19], S;
}
function ue(e) {
	return !e;
}
function de(e) {
	let { editor: t } = e;
	return t ? Q.find((e) => e.isActive(t))?.label ?? Q[0].label : Q[0].label;
}
var $ = typeof navigator < "u" && /Mac|iPhone|iPad/.test(navigator.platform) ? "⌘" : "Ctrl+";
//#endregion
//#region src/editor/toolbar/Toolbar.tsx
function fe(t) {
	let n = e(2), r;
	return n[0] === t ? r = n[1] : (r = {
		editor: t,
		selector: pe
	}, n[0] = t, n[1] = r), c(r);
}
function pe(e) {
	let { editor: t } = e;
	return t ? {
		bold: t.isActive("bold"),
		italic: t.isActive("italic"),
		underline: t.isActive("underline"),
		strike: t.isActive("strike"),
		code: t.isActive("code"),
		link: t.isActive("link"),
		bulletList: t.isActive("bulletList"),
		orderedList: t.isActive("orderedList"),
		blockquote: t.isActive("blockquote"),
		codeBlock: t.isActive("codeBlock"),
		canUndo: t.can().undo(),
		canRedo: t.can().redo()
	} : null;
}
function me(t) {
	let n = e(107), { editor: r, onOpenLink: i, onOpenImage: a, disabled: o } = t, s = o !== void 0 && o, c = fe(r);
	if (!c) return null;
	let l;
	n[0] !== s || n[1] !== r ? (l = /* @__PURE__ */ q(le, {
		editor: r,
		disabled: s
	}), n[0] = s, n[1] = r, n[2] = l) : l = n[2];
	let u;
	n[3] === Symbol.for("react.memo_cache_sentinel") ? (u = /* @__PURE__ */ q(ce, {}), n[3] = u) : u = n[3];
	let d;
	n[4] === r ? d = n[5] : (d = () => r.chain().focus().toggleBold().run(), n[4] = r, n[5] = d);
	let f;
	n[6] !== s || n[7] !== c.bold || n[8] !== d ? (f = /* @__PURE__ */ q(Z, {
		icon: C,
		label: "加粗",
		shortcut: $ + "B",
		active: c.bold,
		disabled: s,
		onClick: d
	}), n[6] = s, n[7] = c.bold, n[8] = d, n[9] = f) : f = n[9];
	let p;
	n[10] === r ? p = n[11] : (p = () => r.chain().focus().toggleItalic().run(), n[10] = r, n[11] = p);
	let m;
	n[12] !== s || n[13] !== c.italic || n[14] !== p ? (m = /* @__PURE__ */ q(Z, {
		icon: M,
		label: "斜体",
		shortcut: $ + "I",
		active: c.italic,
		disabled: s,
		onClick: p
	}), n[12] = s, n[13] = c.italic, n[14] = p, n[15] = m) : m = n[15];
	let h;
	n[16] === r ? h = n[17] : (h = () => r.chain().focus().toggleUnderline().run(), n[16] = r, n[17] = h);
	let g;
	n[18] !== s || n[19] !== c.underline || n[20] !== h ? (g = /* @__PURE__ */ q(Z, {
		icon: G,
		label: "下划线",
		shortcut: $ + "U",
		active: c.underline,
		disabled: s,
		onClick: h
	}), n[18] = s, n[19] = c.underline, n[20] = h, n[21] = g) : g = n[21];
	let _;
	n[22] === r ? _ = n[23] : (_ = () => r.chain().focus().toggleStrike().run(), n[22] = r, n[23] = _);
	let v;
	n[24] !== s || n[25] !== c.strike || n[26] !== _ ? (v = /* @__PURE__ */ q(Z, {
		icon: H,
		label: "删除线",
		shortcut: $ + "Shift+X",
		active: c.strike,
		disabled: s,
		onClick: _
	}), n[24] = s, n[25] = c.strike, n[26] = _, n[27] = v) : v = n[27];
	let y;
	n[28] === r ? y = n[29] : (y = () => r.chain().focus().toggleCode().run(), n[28] = r, n[29] = y);
	let b;
	n[30] !== s || n[31] !== c.code || n[32] !== y ? (b = /* @__PURE__ */ q(Z, {
		icon: T,
		label: "行内代码",
		shortcut: $ + "E",
		active: c.code,
		disabled: s,
		onClick: y
	}), n[30] = s, n[31] = c.code, n[32] = y, n[33] = b) : b = n[33];
	let x;
	n[34] === Symbol.for("react.memo_cache_sentinel") ? (x = /* @__PURE__ */ q(ce, {}), n[34] = x) : x = n[34];
	let S;
	n[35] === r ? S = n[36] : (S = () => r.chain().focus().toggleBulletList().run(), n[35] = r, n[36] = S);
	let w;
	n[37] !== s || n[38] !== c.bulletList || n[39] !== S ? (w = /* @__PURE__ */ q(Z, {
		icon: F,
		label: "无序列表",
		shortcut: $ + "Shift+8",
		active: c.bulletList,
		disabled: s,
		onClick: S
	}), n[37] = s, n[38] = c.bulletList, n[39] = S, n[40] = w) : w = n[40];
	let D;
	n[41] === r ? D = n[42] : (D = () => r.chain().focus().toggleOrderedList().run(), n[41] = r, n[42] = D);
	let O;
	n[43] !== s || n[44] !== c.orderedList || n[45] !== D ? (O = /* @__PURE__ */ q(Z, {
		icon: I,
		label: "有序列表",
		shortcut: $ + "Shift+7",
		active: c.orderedList,
		disabled: s,
		onClick: D
	}), n[43] = s, n[44] = c.orderedList, n[45] = D, n[46] = O) : O = n[46];
	let k;
	n[47] === Symbol.for("react.memo_cache_sentinel") ? (k = /* @__PURE__ */ q(ce, {}), n[47] = k) : k = n[47];
	let A;
	n[48] === r ? A = n[49] : (A = () => r.chain().focus().toggleBlockquote().run(), n[48] = r, n[49] = A);
	let P;
	n[50] !== s || n[51] !== c.blockquote || n[52] !== A ? (P = /* @__PURE__ */ q(Z, {
		icon: z,
		label: "引用",
		shortcut: $ + "Shift+B",
		active: c.blockquote,
		disabled: s,
		onClick: A
	}), n[50] = s, n[51] = c.blockquote, n[52] = A, n[53] = P) : P = n[53];
	let R;
	n[54] === r ? R = n[55] : (R = () => r.chain().focus().toggleCodeBlock().run(), n[54] = r, n[55] = R);
	let V;
	n[56] !== s || n[57] !== c.codeBlock || n[58] !== R ? (V = /* @__PURE__ */ q(Z, {
		icon: E,
		label: "代码块",
		active: c.codeBlock,
		disabled: s,
		onClick: R
	}), n[56] = s, n[57] = c.codeBlock, n[58] = R, n[59] = V) : V = n[59];
	let W;
	n[60] === r ? W = n[61] : (W = () => r.chain().focus().setHorizontalRule().run(), n[60] = r, n[61] = W);
	let K;
	n[62] !== s || n[63] !== W ? (K = /* @__PURE__ */ q(Z, {
		icon: L,
		label: "分割线",
		disabled: s,
		onClick: W
	}), n[62] = s, n[63] = W, n[64] = K) : K = n[64];
	let Y;
	n[65] === Symbol.for("react.memo_cache_sentinel") ? (Y = /* @__PURE__ */ q(ce, {}), n[65] = Y) : Y = n[65];
	let te;
	n[66] !== s || n[67] !== i || n[68] !== c.link ? (te = /* @__PURE__ */ q(Z, {
		icon: N,
		label: "链接",
		shortcut: $ + "K",
		active: c.link,
		disabled: s,
		onClick: i
	}), n[66] = s, n[67] = i, n[68] = c.link, n[69] = te) : te = n[69];
	let ne;
	n[70] !== s || n[71] !== a ? (ne = /* @__PURE__ */ q(Z, {
		icon: j,
		label: "图片",
		disabled: s,
		onClick: a
	}), n[70] = s, n[71] = a, n[72] = ne) : ne = n[72];
	let X;
	n[73] === r ? X = n[74] : (X = () => r.chain().focus().insertTable({
		rows: 3,
		cols: 3,
		withHeaderRow: !0
	}).run(), n[73] = r, n[74] = X);
	let re;
	n[75] !== s || n[76] !== X ? (re = /* @__PURE__ */ q(Z, {
		icon: U,
		label: "插入表格",
		disabled: s,
		onClick: X
	}), n[75] = s, n[76] = X, n[77] = re) : re = n[77];
	let ie = !c.canUndo || s, ae;
	n[78] === r ? ae = n[79] : (ae = () => r.chain().focus().undo().run(), n[78] = r, n[79] = ae);
	let oe;
	n[80] !== ie || n[81] !== ae ? (oe = /* @__PURE__ */ q(Z, {
		icon: ee,
		label: "撤销",
		shortcut: $ + "Z",
		disabled: ie,
		onClick: ae
	}), n[80] = ie, n[81] = ae, n[82] = oe) : oe = n[82];
	let se = !c.canRedo || s, Q;
	n[83] === r ? Q = n[84] : (Q = () => r.chain().focus().redo().run(), n[83] = r, n[84] = Q);
	let ue;
	n[85] !== se || n[86] !== Q ? (ue = /* @__PURE__ */ q(Z, {
		icon: B,
		label: "重做",
		shortcut: $ + "Shift+Z",
		disabled: se,
		onClick: Q
	}), n[85] = se, n[86] = Q, n[87] = ue) : ue = n[87];
	let de;
	n[88] !== oe || n[89] !== ue ? (de = /* @__PURE__ */ J("div", {
		className: "ml-auto flex items-center gap-0.5",
		children: [oe, ue]
	}), n[88] = oe, n[89] = ue, n[90] = de) : de = n[90];
	let pe;
	return n[91] !== v || n[92] !== b || n[93] !== w || n[94] !== O || n[95] !== l || n[96] !== P || n[97] !== V || n[98] !== K || n[99] !== te || n[100] !== ne || n[101] !== re || n[102] !== de || n[103] !== f || n[104] !== m || n[105] !== g ? (pe = /* @__PURE__ */ J("div", {
		className: "zm-toolbar",
		role: "toolbar",
		"aria-label": "编辑工具栏",
		children: [
			l,
			u,
			f,
			m,
			g,
			v,
			b,
			x,
			w,
			O,
			k,
			P,
			V,
			K,
			Y,
			te,
			ne,
			re,
			de
		]
	}), n[91] = v, n[92] = b, n[93] = w, n[94] = O, n[95] = l, n[96] = P, n[97] = V, n[98] = K, n[99] = te, n[100] = ne, n[101] = re, n[102] = de, n[103] = f, n[104] = m, n[105] = g, n[106] = pe) : pe = n[106], pe;
}
//#endregion
//#region src/editor/menus/BubbleMenu.tsx
function he() {
	try {
		let e = window.getSelection();
		if (!e || e.rangeCount === 0 || e.isCollapsed) return null;
		let t = e.getRangeAt(0).getBoundingClientRect();
		return t.width === 0 && t.height === 0 ? null : {
			top: t.top,
			bottom: t.bottom,
			left: t.left
		};
	} catch {
		return null;
	}
}
function ge(n) {
	let r = e(54), { editor: o, onOpenLink: s } = n, [l, u] = a(null), [d, f] = a(!1), p = i(null), m;
	r[0] === o ? m = r[1] : (m = {
		editor: o,
		selector: ve
	}, r[0] = o, r[1] = m);
	let h = c(m), g, _;
	r[2] === o ? (g = r[3], _ = r[4]) : (g = () => {
		let e = () => {
			let e = o.state.selection, t = e instanceof te, n = e.isCellSelection === !0;
			if (e.empty || t || n || !o.isFocused) {
				u(null);
				return;
			}
			u(he());
		};
		return o.on("selectionUpdate", e), o.on("transaction", e), o.on("focus", e), o.on("blur", e), window.addEventListener("scroll", e, !0), window.addEventListener("resize", e), () => {
			o.off("selectionUpdate", e), o.off("transaction", e), o.off("focus", e), o.off("blur", e), window.removeEventListener("scroll", e, !0), window.removeEventListener("resize", e);
		};
	}, _ = [o], r[2] = o, r[3] = g, r[4] = _), t(g, _);
	let v, y;
	if (r[5] === l ? (v = r[6], y = r[7]) : (v = () => {
		if (!l || !p.current) return;
		let { height: e } = p.current.getBoundingClientRect();
		f(l.bottom + 12 + e > window.innerHeight);
	}, y = [l], r[5] = l, r[6] = v, r[7] = y), t(v, y), !l || !h) return null;
	let b;
	r[8] !== d || r[9] !== l.bottom || r[10] !== l.left || r[11] !== l.top ? (b = d ? {
		top: l.top,
		left: l.left
	} : {
		top: l.bottom,
		left: l.left
	}, r[8] = d, r[9] = l.bottom, r[10] = l.left, r[11] = l.top, r[12] = b) : b = r[12];
	let x = b, S = d ? "translateY(calc(-100% - 12px))" : "translateY(12px)", w;
	r[13] !== x.left || r[14] !== x.top || r[15] !== S ? (w = {
		top: x.top,
		left: x.left,
		transform: S
	}, r[13] = x.left, r[14] = x.top, r[15] = S, r[16] = w) : w = r[16];
	let E;
	r[17] === o ? E = r[18] : (E = () => o.chain().focus().toggleBold().run(), r[17] = o, r[18] = E);
	let D;
	r[19] !== h.bold || r[20] !== E ? (D = /* @__PURE__ */ q(Z, {
		icon: C,
		label: "加粗",
		active: h.bold,
		onClick: E
	}), r[19] = h.bold, r[20] = E, r[21] = D) : D = r[21];
	let O;
	r[22] === o ? O = r[23] : (O = () => o.chain().focus().toggleItalic().run(), r[22] = o, r[23] = O);
	let k;
	r[24] !== h.italic || r[25] !== O ? (k = /* @__PURE__ */ q(Z, {
		icon: M,
		label: "斜体",
		active: h.italic,
		onClick: O
	}), r[24] = h.italic, r[25] = O, r[26] = k) : k = r[26];
	let A;
	r[27] === o ? A = r[28] : (A = () => o.chain().focus().toggleUnderline().run(), r[27] = o, r[28] = A);
	let j;
	r[29] !== h.underline || r[30] !== A ? (j = /* @__PURE__ */ q(Z, {
		icon: G,
		label: "下划线",
		active: h.underline,
		onClick: A
	}), r[29] = h.underline, r[30] = A, r[31] = j) : j = r[31];
	let P;
	r[32] === o ? P = r[33] : (P = () => o.chain().focus().toggleStrike().run(), r[32] = o, r[33] = P);
	let F;
	r[34] !== h.strike || r[35] !== P ? (F = /* @__PURE__ */ q(Z, {
		icon: H,
		label: "删除线",
		active: h.strike,
		onClick: P
	}), r[34] = h.strike, r[35] = P, r[36] = F) : F = r[36];
	let I;
	r[37] === o ? I = r[38] : (I = () => o.chain().focus().toggleCode().run(), r[37] = o, r[38] = I);
	let L;
	r[39] !== h.code || r[40] !== I ? (L = /* @__PURE__ */ q(Z, {
		icon: T,
		label: "行内代码",
		active: h.code,
		onClick: I
	}), r[39] = h.code, r[40] = I, r[41] = L) : L = r[41];
	let R;
	r[42] === Symbol.for("react.memo_cache_sentinel") ? (R = /* @__PURE__ */ q(ce, {}), r[42] = R) : R = r[42];
	let z;
	r[43] !== s || r[44] !== h.link ? (z = /* @__PURE__ */ q(Z, {
		icon: N,
		label: "链接",
		active: h.link,
		onClick: s
	}), r[43] = s, r[44] = h.link, r[45] = z) : z = r[45];
	let B;
	return r[46] !== D || r[47] !== k || r[48] !== j || r[49] !== F || r[50] !== L || r[51] !== z || r[52] !== w ? (B = Y(/* @__PURE__ */ J("div", {
		ref: p,
		className: "zm-bubble-menu zm-popover",
		style: w,
		onMouseDown: _e,
		role: "toolbar",
		"aria-label": "文本格式",
		children: [
			D,
			k,
			j,
			F,
			L,
			R,
			z
		]
	}), document.body), r[46] = D, r[47] = k, r[48] = j, r[49] = F, r[50] = L, r[51] = z, r[52] = w, r[53] = B) : B = r[53], B;
}
function _e(e) {
	return e.preventDefault();
}
function ve(e) {
	let { editor: t } = e;
	return t ? {
		bold: t.isActive("bold"),
		italic: t.isActive("italic"),
		underline: t.isActive("underline"),
		strike: t.isActive("strike"),
		code: t.isActive("code"),
		link: t.isActive("link")
	} : null;
}
//#endregion
//#region src/editor/menus/SlashMenu.tsx
var ye = [
	{
		title: "文本",
		items: [
			{
				id: "p",
				label: "正文",
				icon: R,
				keywords: ["段落", "paragraph"],
				run: (e) => e.chain().focus().setParagraph().run()
			},
			{
				id: "h1",
				label: "标题 1",
				hint: "大标题",
				icon: O,
				keywords: ["一级"],
				run: (e) => e.chain().focus().toggleHeading({ level: 1 }).run()
			},
			{
				id: "h2",
				label: "标题 2",
				hint: "中标题",
				icon: k,
				keywords: ["二级"],
				run: (e) => e.chain().focus().toggleHeading({ level: 2 }).run()
			},
			{
				id: "h3",
				label: "标题 3",
				hint: "小标题",
				icon: A,
				keywords: ["三级"],
				run: (e) => e.chain().focus().toggleHeading({ level: 3 }).run()
			}
		]
	},
	{
		title: "列表",
		items: [{
			id: "ul",
			label: "无序列表",
			icon: F,
			keywords: ["圆点", "bullet"],
			run: (e) => e.chain().focus().toggleBulletList().run()
		}, {
			id: "ol",
			label: "有序列表",
			icon: I,
			keywords: ["编号", "numbered"],
			run: (e) => e.chain().focus().toggleOrderedList().run()
		}]
	},
	{
		title: "块",
		items: [
			{
				id: "quote",
				label: "引用",
				icon: z,
				keywords: ["blockquote"],
				run: (e) => e.chain().focus().toggleBlockquote().run()
			},
			{
				id: "codeblock",
				label: "代码块",
				icon: E,
				keywords: ["code"],
				run: (e) => e.chain().focus().toggleCodeBlock().run()
			},
			{
				id: "hr",
				label: "分割线",
				icon: L,
				keywords: ["分隔", "hr"],
				run: (e) => e.chain().focus().setHorizontalRule().run()
			}
		]
	},
	{
		title: "插入",
		items: [
			{
				id: "link",
				label: "链接",
				icon: N,
				keywords: ["网址", "url"],
				run: (e) => {
					let t = e.state.selection.from;
					e.chain().focus().insertContentAt(t, "链接").run(), e.commands.setTextSelection({
						from: t,
						to: t + 2
					});
				}
			},
			{
				id: "image",
				label: "图片",
				icon: j,
				keywords: ["插图", "img"],
				run: () => {}
			},
			{
				id: "table",
				label: "表格",
				icon: U,
				keywords: ["3x3"],
				run: (e) => e.chain().focus().insertTable({
					rows: 3,
					cols: 3,
					withHeaderRow: !0
				}).run()
			}
		]
	}
], be = ye.flatMap((e) => e.items);
function xe({ editor: e, onOpenLink: n, onOpenImage: o }) {
	let [s, c] = a(null), [l, u] = a(0), [d, f] = a(null), [p, m] = a(!1), h = i(null), g = r(() => {
		if (!s) return [];
		let e = s.query.trim().toLowerCase();
		return e ? be.filter((t) => t.label.toLowerCase().includes(e) || t.keywords?.some((t) => t.includes(e) || e.includes(t))) : be;
	}, [s]);
	t(() => {
		u(0);
	}, [s?.query]), t(() => {
		let t = () => {
			if (!e.isFocused) {
				c(null);
				return;
			}
			let { state: t } = e, { $from: n } = t.selection;
			if (t.selection.empty && n.parent.type.name === "paragraph") {
				let e = n.parent.textBetween(0, n.parentOffset, void 0, "￼");
				if (e.startsWith("/")) {
					c({
						pos: n.pos - e.length,
						query: e.slice(1)
					});
					return;
				}
			}
			c(null);
		};
		return e.on("update", t), () => {
			e.off("update", t);
		};
	}, [e]), t(() => {
		if (!s) return;
		let t = () => c(null);
		return e.on("selectionUpdate", t), () => {
			e.off("selectionUpdate", t);
		};
	}, [e, s]), t(() => {
		if (s) {
			try {
				let t = e.view.coordsAtPos(s.pos);
				f({
					top: t.top,
					bottom: t.bottom,
					left: t.left
				});
			} catch {
				f({
					top: 0,
					bottom: 0,
					left: 0
				});
			}
			m(!1);
		}
	}, [e, s]), t(() => {
		if (!s || g.length === 0) return;
		let t = (e) => {
			e.key === "ArrowDown" ? (e.preventDefault(), u((e) => (e + 1) % g.length)) : e.key === "ArrowUp" ? (e.preventDefault(), u((e) => (e - 1 + g.length) % g.length)) : e.key === "Enter" ? (e.preventDefault(), _(g[l])) : e.key === "Escape" && (e.preventDefault(), c(null));
		};
		return e.view.dom.addEventListener("keydown", t), () => e.view.dom.removeEventListener("keydown", t);
	}, [
		e,
		s,
		g,
		l
	]), t(() => {
		let t = () => c(null);
		return e.on("blur", t), () => {
			e.off("blur", t);
		};
	}, [e]);
	let _ = (t) => {
		if (!s) return;
		let { pos: r, query: i } = s;
		e.chain().focus().deleteRange({
			from: r,
			to: r + i.length + 1
		}).run(), c(null), t.id === "image" ? o() : (t.run(e), t.id === "link" && n());
	};
	return t(() => {
		if (!d || !h.current) return;
		let { height: e } = h.current.getBoundingClientRect();
		m(d.bottom + 8 + e > window.innerHeight);
	}, [d]), !s || !d ? null : Y(/* @__PURE__ */ J("div", {
		ref: h,
		className: "zm-slash-menu zm-popover",
		style: {
			top: p ? d.top : d.bottom,
			left: d.left,
			transform: p ? "translateY(calc(-100% - 8px))" : "translateY(8px)"
		},
		onMouseDown: (e) => e.preventDefault(),
		role: "listbox",
		"aria-label": "命令菜单",
		children: [g.length === 0 && /* @__PURE__ */ q("div", {
			className: "zm-slash-empty",
			children: "没有匹配的命令"
		}), ye.map((e) => {
			let t = g.filter((t) => e.items.some((e) => e.id === t.id));
			return t.length === 0 ? null : /* @__PURE__ */ J("div", { children: [/* @__PURE__ */ q("div", {
				className: "zm-slash-group",
				children: e.title
			}), t.map((e) => {
				let t = g.indexOf(e);
				return /* @__PURE__ */ J("button", {
					type: "button",
					role: "option",
					"aria-selected": t === l,
					className: "zm-slash-item",
					"data-active": t === l ? "true" : "false",
					onMouseEnter: () => u(t),
					onClick: () => _(e),
					children: [/* @__PURE__ */ q("span", {
						className: "zm-slash-icon",
						children: /* @__PURE__ */ q(e.icon, {
							size: 16,
							"aria-hidden": !0
						})
					}), /* @__PURE__ */ J("span", {
						className: "zm-slash-label",
						children: [e.label, e.hint && /* @__PURE__ */ q("em", {
							className: "zm-slash-hint",
							children: e.hint
						})]
					})]
				}, e.id);
			})] }, e.title);
		})]
	}), document.body);
}
//#endregion
//#region src/editor/menus/TableMenu.tsx
function Se(n) {
	let r = e(45), { editor: i } = n, [o, s] = a(null), c, l;
	if (r[0] === i ? (c = r[1], l = r[2]) : (c = () => {
		let e = () => {
			if (!i.isFocused || !i.isActive("table")) {
				s(null);
				return;
			}
			try {
				let e = i.view.coordsAtPos(i.state.selection.from);
				s({
					top: e.bottom,
					left: e.left
				});
			} catch {
				s(null);
			}
		}, t = () => s(null);
		return i.on("selectionUpdate", e), i.on("transaction", e), i.on("focus", e), i.on("blur", t), window.addEventListener("scroll", e, !0), window.addEventListener("resize", e), () => {
			i.off("selectionUpdate", e), i.off("transaction", e), i.off("focus", e), i.off("blur", t), window.removeEventListener("scroll", e, !0), window.removeEventListener("resize", e);
		};
	}, l = [i], r[0] = i, r[1] = c, r[2] = l), t(c, l), !o) return null;
	let u;
	r[3] === i ? u = r[4] : (u = {
		label: "上方插入行",
		icon: S,
		run: () => i.chain().focus().addRowBefore().run()
	}, r[3] = i, r[4] = u);
	let d;
	r[5] === i ? d = r[6] : (d = {
		label: "下方插入行",
		icon: y,
		run: () => i.chain().focus().addRowAfter().run()
	}, r[5] = i, r[6] = d);
	let f;
	r[7] === i ? f = r[8] : (f = {
		label: "左侧插入列",
		icon: b,
		run: () => i.chain().focus().addColumnBefore().run()
	}, r[7] = i, r[8] = f);
	let p;
	r[9] === i ? p = r[10] : (p = {
		label: "右侧插入列",
		icon: x,
		run: () => i.chain().focus().addColumnAfter().run()
	}, r[9] = i, r[10] = p);
	let m;
	r[11] !== u || r[12] !== d || r[13] !== f || r[14] !== p ? (m = [
		u,
		d,
		f,
		p
	], r[11] = u, r[12] = d, r[13] = f, r[14] = p, r[15] = m) : m = r[15];
	let h = m, g;
	r[16] !== o.left || r[17] !== o.top ? (g = {
		top: o.top,
		left: o.left,
		transform: "translateY(8px)"
	}, r[16] = o.left, r[17] = o.top, r[18] = g) : g = r[18];
	let _;
	r[19] === h ? _ = r[20] : (_ = h.map(Ce), r[19] = h, r[20] = _);
	let v;
	r[21] === Symbol.for("react.memo_cache_sentinel") ? (v = /* @__PURE__ */ q("span", {
		className: "zm-tool-divider",
		"aria-hidden": !0
	}), r[21] = v) : v = r[21];
	let C;
	r[22] === i ? C = r[23] : (C = () => i.chain().focus().deleteRow().run(), r[22] = i, r[23] = C);
	let w, T;
	r[24] === Symbol.for("react.memo_cache_sentinel") ? (w = /* @__PURE__ */ q(V, {
		size: 14,
		"aria-hidden": !0
	}), T = /* @__PURE__ */ q("span", {
		className: "zm-table-btn-sub",
		children: "行"
	}), r[24] = w, r[25] = T) : (w = r[24], T = r[25]);
	let E;
	r[26] === C ? E = r[27] : (E = /* @__PURE__ */ J("button", {
		type: "button",
		className: "zm-table-btn",
		title: "删除当前行",
		"aria-label": "删除当前行",
		onClick: C,
		children: [w, T]
	}), r[26] = C, r[27] = E);
	let O;
	r[28] === i ? O = r[29] : (O = () => i.chain().focus().deleteColumn().run(), r[28] = i, r[29] = O);
	let k, A;
	r[30] === Symbol.for("react.memo_cache_sentinel") ? (k = /* @__PURE__ */ q(D, {
		size: 14,
		"aria-hidden": !0
	}), A = /* @__PURE__ */ q("span", {
		className: "zm-table-btn-sub",
		children: "列"
	}), r[30] = k, r[31] = A) : (k = r[30], A = r[31]);
	let j;
	r[32] === O ? j = r[33] : (j = /* @__PURE__ */ J("button", {
		type: "button",
		className: "zm-table-btn",
		title: "删除当前列",
		"aria-label": "删除当前列",
		onClick: O,
		children: [k, A]
	}), r[32] = O, r[33] = j);
	let M;
	r[34] === i ? M = r[35] : (M = () => i.chain().focus().deleteTable().run(), r[34] = i, r[35] = M);
	let N;
	r[36] === Symbol.for("react.memo_cache_sentinel") ? (N = /* @__PURE__ */ q(W, {
		size: 14,
		"aria-hidden": !0
	}), r[36] = N) : N = r[36];
	let P;
	r[37] === M ? P = r[38] : (P = /* @__PURE__ */ q("button", {
		type: "button",
		className: "zm-table-btn zm-table-btn-danger",
		title: "删除表格",
		"aria-label": "删除表格",
		onClick: M,
		children: N
	}), r[37] = M, r[38] = P);
	let F;
	return r[39] !== E || r[40] !== j || r[41] !== P || r[42] !== g || r[43] !== _ ? (F = Y(/* @__PURE__ */ J("div", {
		className: "zm-table-menu zm-popover",
		style: g,
		onMouseDown: we,
		role: "toolbar",
		"aria-label": "表格操作",
		children: [
			_,
			v,
			E,
			j,
			P
		]
	}), document.body), r[39] = E, r[40] = j, r[41] = P, r[42] = g, r[43] = _, r[44] = F) : F = r[44], F;
}
function Ce(e) {
	return /* @__PURE__ */ q("button", {
		type: "button",
		className: "zm-table-btn",
		title: e.label,
		"aria-label": e.label,
		onClick: e.run,
		children: /* @__PURE__ */ q(e.icon, {
			size: 14,
			"aria-hidden": !0
		})
	}, e.label);
}
function we(e) {
	return e.preventDefault();
}
//#endregion
//#region src/editor/menus/LinkPopover.tsx
function Te(r) {
	let o = e(54), { editor: s, state: c, onClose: l } = r, [u, d] = a(c?.url ?? ""), [f, p] = a(null), [m, h] = a(!1), g = i(null), _ = i(null), v;
	o[0] !== s.state || o[1] !== s.view || o[2] !== c?.open ? (v = () => {
		if (c?.open) {
			try {
				let { from: e } = s.state.selection, t = s.view.coordsAtPos(e);
				p({
					top: t.top,
					bottom: t.bottom,
					left: t.left
				});
			} catch {}
			requestAnimationFrame(() => {
				g.current?.focus(), g.current?.select();
			});
		}
	}, o[0] = s.state, o[1] = s.view, o[2] = c?.open, o[3] = v) : v = o[3];
	let y;
	o[4] !== s || o[5] !== c ? (y = [c, s], o[4] = s, o[5] = c, o[6] = y) : y = o[6], t(v, y);
	let b, x;
	o[7] === f ? (b = o[8], x = o[9]) : (b = () => {
		if (!f || !_.current) return;
		let { height: e } = _.current.getBoundingClientRect();
		h(f.bottom + 12 + e > window.innerHeight);
	}, x = [f], o[7] = f, o[8] = b, o[9] = x), n(b, x);
	let S;
	o[10] === s ? S = o[11] : (S = s.isActive("link"), o[10] = s, o[11] = S);
	let C = S, w;
	o[12] !== s || o[13] !== l || o[14] !== u ? (w = () => {
		let e = u.trim();
		e ? s.chain().focus().extendMarkRange("link").setLink({ href: e }).run() : s.chain().focus().extendMarkRange("link").unsetLink().run(), l();
	}, o[12] = s, o[13] = l, o[14] = u, o[15] = w) : w = o[15];
	let T = w, E;
	o[16] !== s || o[17] !== l ? (E = () => {
		s.chain().focus().extendMarkRange("link").unsetLink().run(), l();
	}, o[16] = s, o[17] = l, o[18] = E) : E = o[18];
	let D = E;
	if (!c?.open || !f) return null;
	let O;
	o[19] !== f.bottom || o[20] !== f.left || o[21] !== f.top || o[22] !== m ? (O = m ? {
		top: f.top,
		left: f.left
	} : {
		top: f.bottom,
		left: f.left
	}, o[19] = f.bottom, o[20] = f.left, o[21] = f.top, o[22] = m, o[23] = O) : O = o[23];
	let k = O, A = m ? "translateY(calc(-100% - 12px))" : "translateY(12px)", j;
	o[24] !== k.left || o[25] !== k.top || o[26] !== A ? (j = {
		top: k.top,
		left: k.left,
		transform: A
	}, o[24] = k.left, o[25] = k.top, o[26] = A, o[27] = j) : j = o[27];
	let M;
	o[28] === Symbol.for("react.memo_cache_sentinel") ? (M = /* @__PURE__ */ q(N, {
		size: 15,
		"aria-hidden": !0
	}), o[28] = M) : M = o[28];
	let F;
	o[29] === Symbol.for("react.memo_cache_sentinel") ? (F = (e) => d(e.target.value), o[29] = F) : F = o[29];
	let I;
	o[30] !== T || o[31] !== l ? (I = (e) => {
		e.key === "Enter" && T(), e.key === "Escape" && l();
	}, o[30] = T, o[31] = l, o[32] = I) : I = o[32];
	let L;
	o[33] !== I || o[34] !== u ? (L = /* @__PURE__ */ q("input", {
		ref: g,
		className: "zm-link-input",
		value: u,
		placeholder: "输入链接地址",
		onChange: F,
		onKeyDown: I
	}), o[33] = I, o[34] = u, o[35] = L) : L = o[35];
	let R;
	o[36] === Symbol.for("react.memo_cache_sentinel") ? (R = /* @__PURE__ */ q(K, {
		size: 14,
		"aria-hidden": !0
	}), o[36] = R) : R = o[36];
	let z;
	o[37] === l ? z = o[38] : (z = /* @__PURE__ */ q("button", {
		type: "button",
		className: "zm-link-btn",
		"aria-label": "关闭",
		onClick: l,
		children: R
	}), o[37] = l, o[38] = z);
	let B;
	o[39] !== L || o[40] !== z ? (B = /* @__PURE__ */ J("div", {
		className: "zm-link-row",
		children: [
			M,
			L,
			z
		]
	}), o[39] = L, o[40] = z, o[41] = B) : B = o[41];
	let V;
	o[42] !== C || o[43] !== D ? (V = C && /* @__PURE__ */ J("button", {
		type: "button",
		className: "zm-link-btn zm-link-remove",
		onClick: D,
		children: [/* @__PURE__ */ q(P, {
			size: 14,
			"aria-hidden": !0
		}), "移除链接"]
	}), o[42] = C, o[43] = D, o[44] = V) : V = o[44];
	let H;
	o[45] === T ? H = o[46] : (H = /* @__PURE__ */ q("button", {
		type: "button",
		className: "zm-link-btn zm-link-save",
		onClick: T,
		children: "确定"
	}), o[45] = T, o[46] = H);
	let U;
	o[47] !== V || o[48] !== H ? (U = /* @__PURE__ */ J("div", {
		className: "zm-link-actions",
		children: [V, H]
	}), o[47] = V, o[48] = H, o[49] = U) : U = o[49];
	let W;
	return o[50] !== j || o[51] !== B || o[52] !== U ? (W = Y(/* @__PURE__ */ J("div", {
		ref: _,
		className: "zm-link-popover zm-popover",
		style: j,
		onMouseDown: Ee,
		role: "dialog",
		"aria-label": "编辑链接",
		children: [B, U]
	}), document.body), o[50] = j, o[51] = B, o[52] = U, o[53] = W) : W = o[53], W;
}
function Ee(e) {
	return e.stopPropagation();
}
//#endregion
//#region src/editor/menus/ImagePopover.tsx
function De({ editor: e, open: n, uploadImage: r, onClose: o }) {
	let [s, c] = a(""), [l, u] = a(null), [d, f] = a(!1), [p, m] = a(""), h = i(null), g = i(null);
	t(() => {
		if (n) {
			try {
				let { from: t } = e.state.selection, n = e.view.coordsAtPos(t);
				u({
					top: n.bottom,
					left: n.left
				});
			} catch {}
			requestAnimationFrame(() => h.current?.focus());
		}
	}, [n, e]);
	let _ = () => {
		let t = s.trim();
		t && (e.chain().focus().setImage({ src: t }).run(), o());
	}, v = async (t) => {
		if (r) {
			f(!0), m("");
			try {
				let n = await r(t);
				e.chain().focus().setImage({ src: n }).run(), o();
			} catch {
				m("图片上传失败，请重试");
			} finally {
				f(!1), g.current && (g.current.value = "");
			}
		}
	};
	return !n || !l ? null : Y(/* @__PURE__ */ J("div", {
		className: "zm-image-popover zm-popover",
		style: {
			top: l.top,
			left: l.left,
			transform: "translateY(8px)"
		},
		onMouseDown: (e) => e.stopPropagation(),
		role: "dialog",
		"aria-label": "插入图片",
		children: [
			/* @__PURE__ */ J("div", {
				className: "zm-link-row",
				children: [
					/* @__PURE__ */ q(j, {
						size: 15,
						"aria-hidden": !0
					}),
					/* @__PURE__ */ q("input", {
						ref: h,
						className: "zm-link-input",
						value: s,
						placeholder: "输入图片 URL",
						onChange: (e) => c(e.target.value),
						onKeyDown: (e) => {
							e.key === "Enter" && _(), e.key === "Escape" && o();
						}
					}),
					/* @__PURE__ */ q("button", {
						type: "button",
						className: "zm-link-btn",
						"aria-label": "关闭",
						onClick: o,
						children: /* @__PURE__ */ q(K, {
							size: 14,
							"aria-hidden": !0
						})
					})
				]
			}),
			r && /* @__PURE__ */ J("div", {
				className: "zm-image-upload",
				children: [/* @__PURE__ */ q("button", {
					type: "button",
					className: "zm-link-btn zm-link-upload",
					disabled: d,
					onClick: () => g.current?.click(),
					children: d ? "上传中…" : "上传本地图片"
				}), /* @__PURE__ */ q("input", {
					ref: g,
					type: "file",
					accept: "image/*",
					hidden: !0,
					onChange: (e) => {
						let t = e.target.files?.[0];
						t && v(t);
					}
				})]
			}),
			p && /* @__PURE__ */ q("div", {
				className: "zm-image-error",
				children: p
			}),
			/* @__PURE__ */ q("div", {
				className: "zm-link-actions",
				children: /* @__PURE__ */ q("button", {
					type: "button",
					className: "zm-link-btn zm-link-save",
					onClick: _,
					children: "插入"
				})
			})
		]
	}), document.body);
}
//#endregion
//#region src/editor/utils/cn.ts
function Oe(...e) {
	return e.filter(Boolean).join(" ");
}
//#endregion
//#region src/editor/ZhimoEditor.tsx
function ke(n) {
	let r = e(64), s, c, l, u, d, f, p;
	r[0] === n ? (s = r[1], c = r[2], l = r[3], u = r[4], d = r[5], f = r[6], p = r[7]) : ({toolbar: d, bubbleMenu: f, slashMenu: p, className: s, style: u, disabled: c, ...l} = n, r[0] = n, r[1] = s, r[2] = c, r[3] = l, r[4] = u, r[5] = d, r[6] = f, r[7] = p);
	let m = d === void 0 || d, h = f === void 0 || f, g = p === void 0 || p, _;
	r[8] !== c || r[9] !== l ? (_ = {
		...l,
		disabled: c
	}, r[8] = c, r[9] = l, r[10] = _) : _ = r[10];
	let v = se(_), [y, b] = a(null), [x, S] = a(!1), [C, w] = a(""), T = i(void 0), E, D;
	r[11] === v ? (E = r[12], D = r[13]) : (E = () => {
		if (!v) return;
		let e = (e) => {
			let { message: t } = e;
			w(t), window.clearTimeout(T.current), T.current = window.setTimeout(() => w(""), 2500);
		};
		return v.on("imageUploadError", e), v.on("imageUploadBlocked", e), () => {
			v.off("imageUploadError", e), v.off("imageUploadBlocked", e), window.clearTimeout(T.current);
		};
	}, D = [v], r[11] = v, r[12] = E, r[13] = D), t(E, D);
	let O;
	r[14] === v ? O = r[15] : (O = () => {
		if (!v) return;
		v.chain().focus().run();
		let e = v.getAttributes("link").href ?? "";
		b({
			open: !0,
			url: e
		});
	}, r[14] = v, r[15] = O);
	let k = O, A;
	r[16] === v ? A = r[17] : (A = () => {
		v && (v.chain().focus().run(), S(!0));
	}, r[16] = v, r[17] = A);
	let j = A;
	if (!v) return null;
	let M = c && "is-disabled", N;
	r[18] !== s || r[19] !== M ? (N = Oe("zhimo-editor", M, s), r[18] = s, r[19] = M, r[20] = N) : N = r[20];
	let P;
	r[21] !== c || r[22] !== v || r[23] !== j || r[24] !== k || r[25] !== m ? (P = m !== !1 && /* @__PURE__ */ q("div", {
		className: "zm-toolbar-wrap",
		children: typeof m == "boolean" ? /* @__PURE__ */ q(me, {
			editor: v,
			onOpenLink: k,
			onOpenImage: j,
			disabled: c
		}) : m
	}), r[21] = c, r[22] = v, r[23] = j, r[24] = k, r[25] = m, r[26] = P) : P = r[26];
	let F;
	r[27] === v ? F = r[28] : (F = /* @__PURE__ */ q(o, { editor: v }), r[27] = v, r[28] = F);
	let I;
	r[29] !== h || r[30] !== v || r[31] !== k ? (I = h && /* @__PURE__ */ q(ge, {
		editor: v,
		onOpenLink: k
	}), r[29] = h, r[30] = v, r[31] = k, r[32] = I) : I = r[32];
	let L;
	r[33] !== v || r[34] !== j || r[35] !== k || r[36] !== g ? (L = g && /* @__PURE__ */ q(xe, {
		editor: v,
		onOpenLink: k,
		onOpenImage: j
	}), r[33] = v, r[34] = j, r[35] = k, r[36] = g, r[37] = L) : L = r[37];
	let R = y?.open ? "link-open" : "link-closed", z;
	r[38] === Symbol.for("react.memo_cache_sentinel") ? (z = () => b(null), r[38] = z) : z = r[38];
	let B;
	r[39] !== v || r[40] !== y || r[41] !== R ? (B = /* @__PURE__ */ q(Te, {
		editor: v,
		state: y,
		onClose: z
	}, R), r[39] = v, r[40] = y, r[41] = R, r[42] = B) : B = r[42];
	let V = x ? "image-open" : "image-closed", H;
	r[43] === Symbol.for("react.memo_cache_sentinel") ? (H = () => S(!1), r[43] = H) : H = r[43];
	let U;
	r[44] !== v || r[45] !== l.uploadImage || r[46] !== x || r[47] !== V ? (U = /* @__PURE__ */ q(De, {
		editor: v,
		open: x,
		uploadImage: l.uploadImage,
		onClose: H
	}, V), r[44] = v, r[45] = l.uploadImage, r[46] = x, r[47] = V, r[48] = U) : U = r[48];
	let W;
	r[49] === v ? W = r[50] : (W = /* @__PURE__ */ q(Se, { editor: v }), r[49] = v, r[50] = W);
	let G;
	r[51] === C ? G = r[52] : (G = C && /* @__PURE__ */ q("div", {
		className: "zm-editor-error",
		role: "alert",
		children: C
	}), r[51] = C, r[52] = G);
	let ee;
	return r[53] !== u || r[54] !== P || r[55] !== F || r[56] !== I || r[57] !== L || r[58] !== B || r[59] !== U || r[60] !== W || r[61] !== G || r[62] !== N ? (ee = /* @__PURE__ */ J("div", {
		className: N,
		style: u,
		children: [
			P,
			F,
			I,
			L,
			B,
			U,
			W,
			G
		]
	}), r[53] = u, r[54] = P, r[55] = F, r[56] = I, r[57] = L, r[58] = B, r[59] = U, r[60] = W, r[61] = G, r[62] = N, r[63] = ee) : ee = r[63], ee;
}
//#endregion
export { ke as ZhimoEditor, ie as buildExtensions, se as useZhimoEditor };

//# sourceMappingURL=zhimo-editor.js.map