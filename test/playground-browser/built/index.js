/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/Interpreter.js":
/*!****************************!*\
  !*** ./src/Interpreter.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _Keybinding_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Keybinding.js */ \"./src/Keybinding.js\");\n/* harmony import */ var _KeyReader_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./KeyReader.js */ \"./src/KeyReader.js\");\n/* harmony import */ var _status_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./status.js */ \"./src/status.js\");\n/* harmony import */ var _utils_get_map_diff_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./utils/get-map-diff.js */ \"./src/utils/get-map-diff.js\");\n\n\n\n\n\nconst DEFAULTS = {\n\tgetKeybinding: (key, map) => map.get(key),\n\tisKeyNumber: key => /\\d/.test(key),\n\tisKeyEscape: key => key === 'escape',\n\tstore: {},\n\tfilter: null\n};\n\nclass Interpreter {\n\tconstructor(map, doneCb = (() => {}), options = {}) {\n\t\tthis.map = map;\n\t\tthis.doneCb = doneCb;\n\t\tthis.options = { ...DEFAULTS, ...options };\n\n\t\tthis.read = this.read.bind(this);\n\t\tthis.interpret = this.interpret.bind(this);\n\t\tthis.done = this.done.bind(this);\n\n\t\tthis.kb = new _Keybinding_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"]({ store: this.options.store });\n\n\t\tthis.cds = [{ action: null }];\n\t\tthis.keyReader = this.interpreter = null;\n\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t}\n\n\treset() {\n\t\tthis.cdToRoot();\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t\tthis.kb = new _Keybinding_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"]();\n\t}\n\n\thandleKeys(keys) {\n\t\tkeys.forEach(key => this.handleKey(key));\n\t}\n\n\thandleKey(key) {\n\t\tif (this.options.isKeyEscape(key)) {\n\t\t\treturn this.onDone('cancel');\n\t\t}\n\n\t\tif (this.status === _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].NEEDS_KEY) {\n\t\t\treturn this.onNeededKey(key);\n\t\t}\n\n\t\tthis.kb.keys.push(key);\n\n\t\tif (this.status === _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING) {\n\t\t\tthis.onWaiting(key);\n\t\t} else if (this.status === _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].IS_READING) {\n\t\t\tthis.keyReader.handleKey(key);\n\t\t} else if (this.status === _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].IS_INTERPRETING) {\n\t\t\tconst action = this.options.getKeybinding(key, this.map);\n\t\t\tif (action === this.getCurrentAction()) {\n\t\t\t\tthis.interpreter = this.interpreter.destroy();\n\t\t\t\tthis.onDone('cancel');\n\t\t\t} else {\n\t\t\t\tthis.interpreter.handleKey(key);\n\t\t\t}\n\t\t}\n\t}\n\n\tonWaiting(key) {\n\t\tconst action = this.options.getKeybinding(key, this.map);\n\n\t\tif (this.options.isKeyNumber(key) && !(this.kb.countChars.length === 0 && action)) {\n\t\t\tthis.onNumber(key);\n\t\t} else if (!action) {\n\t\t\tthis.onUnrecognized(this.kb);\n\t\t} else if (this.options.filter && !this.options.filter(action)) {\n\t\t\tthis.onDone('unrecognized');\n\t\t} else {\n\t\t\tthis.kb.action = action;\n\n\t\t\tif (action.keybindings instanceof Map && typeof action.behavior === 'function') {\n\t\t\t\tthis.onNeedsKey(action);\n\t\t\t} else if (action.keybindings instanceof Map) {\n\t\t\t\tthis.onKeybindingMap(action);\n\t\t\t} else if (typeof action.behavior === 'function') {\n\t\t\t\tthis.onBehavior(action);\n\t\t\t} else {\n\t\t\t\tthis.onDone('keybinding');\n\t\t\t}\n\t\t}\n\t}\n\n\tonNumber(key) {\n\t\tthis.kb.addCountChar(key);\n\t}\n\n\tonUnrecognized(kb) {\n\t\tthis.onDone('unrecognized');\n\t}\n\n\tonNeedsKey(action) {\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].NEEDS_KEY;\n\t\tthis.cdIntoAction(action);\n\t}\n\n\tonNeededKey(key) {\n\t\tconst action = this.getCurrentAction();\n\n\t\tif (action.keybindings instanceof Map && action.keybindings.has(key)) {\n\t\t\tthis.onKeybindingMap(action);\n\t\t} else if (typeof action.behavior === 'function') {\n\t\t\tthis.onBehavior(action);\n\t\t}\n\n\t\tthis.handleKey(key);\n\t}\n\n\tonKeybindingMap(action) {\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t\tthis.cdIntoAction(action);\n\t}\n\n\tonBehavior(action) {\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t\tthis.cdIntoAction(action);\n\t\tconst { read, interpret, done } = this;\n\t\taction.behavior({ read, interpret, done }, this.kb);\n\t\t// TODO: check if return value is promise\n\t}\n\n\tread(count, cb) {\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].IS_READING;\n\t\tthis.keyReader = new _KeyReader_js__WEBPACK_IMPORTED_MODULE_1__[\"default\"](count, keys => {\n\t\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t\t\tthis.keyReader.destroy();\n\t\t\tthis.keyReader = null;\n\t\t\tcb(keys);\n\t\t});\n\t}\n\n\tinterpret(cb, filter) {\n\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].IS_INTERPRETING;\n\n\t\tconst doneCb = (...args) => {\n\t\t\tthis.status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t\t\tthis.interpreter = this.interpreter.destroy();\n\t\t\tcb(...args);\n\t\t};\n\n\t\tconst { store } = this.kb;\n\t\tthis.interpreter = new Interpreter(this.map, doneCb, { ...this.options, store, filter });\n\t}\n\n\tdone(flag = 'keybinding') {\n\t\tlet type = flag, status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].DONE;\n\n\t\t// support done('resume') or done(STATUS.WAITING)\n\t\tif (flag === _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING || flag === 'resume') {\n\t\t\ttype = 'keybinding';\n\t\t\tstatus = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].WAITING;\n\t\t}\n\n\t\tthis.onDone(type, status);\n\t}\n\n\t// types\n\t// - keybinding\n\t// - unrecognized\n\t// - cancel\n\tonDone(type = 'keybinding', status = _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].DONE) {\n\t\tthis.status = status;\n\n\t\tif (this.status === _status_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"].DONE) {\n\t\t\tthis.doneCb(type, this.kb);\n\t\t\tthis.reset();\n\t\t}\n\t}\n\n\tcdIntoAction(action) {\n\t\tif (this.getCurrentAction() === action) {\n\t\t\treturn;\n\t\t}\n\n\t\tconst props = ['interprets', 'keybindings'];\n\t\tconst maps = props.map(p => action[p]).filter(m => m instanceof Map);\n\n\t\tconst [replaced, added] = (0,_utils_get_map_diff_js__WEBPACK_IMPORTED_MODULE_3__[\"default\"])(this.map, ...maps);\n\n\t\tmaps.forEach(map => map.forEach((val, key) => this.map.set(key, val)));\n\n\t\tthis.cds.push({ action, replaced, added });\n\t}\n\n\tgetCurrentAction() {\n\t\treturn this.cds[this.cds.length - 1].action;\n\t}\n\n\tcdUp() {\n\t\tconst { action, replaced, added } = this.cds.pop();\n\n\t\treplaced.forEach((val, key) => this.map.set(key, val));\n\t\tadded.forEach((_, key) => this.map.delete(key));\n\n\t\treplaced.clear();\n\t\tadded.clear();\n\t}\n\n\tcdToRoot() {\n\t\twhile (this.cds.length > 1) {\n\t\t\tthis.cdUp();\n\t\t}\n\t}\n\n\tdestroy() {\n\t\tthis.cdToRoot();\n\n\t\tthis.keyReader && this.keyReader.destroy();\n\t\tthis.interpreter && this.interpreter.cdToRoot();\n\t\tthis.interpreter && this.interpreter.destroy();\n\n\t\tthis.map = this.store = this.doneCb = null;\n\t\tthis.kb = null;\n\t\tthis.keyReader = this.interpreter = null;\n\t}\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Interpreter);\n\n\n//# sourceURL=webpack://composable-keybindings/./src/Interpreter.js?");

/***/ }),

/***/ "./src/KeyReader.js":
/*!**************************!*\
  !*** ./src/KeyReader.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\nclass KeyReader {\n\tconstructor(count, doneCb) {\n\t\tthis.count = count;\n\t\tthis.doneCb = doneCb;\n\t\tthis.keys = [];\n\t}\n\n\treset(count = this.count) {\n\t\tthis.count = count;\n\t\tthis.keys = [];\n\t}\n\n\thandleKey(key) {\n\t\tthis.keys.push(key);\n\n\t\tif (this.keys.length === this.count) {\n\t\t\tthis.doneCb(this.keys);\n\t\t}\n\t}\n\n\tdestroy() {\n\t\tthis.count = this.doneCb = this.keys = null;\n\t}\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (KeyReader);\n\n\n//# sourceURL=webpack://composable-keybindings/./src/KeyReader.js?");

/***/ }),

/***/ "./src/Keybinder.js":
/*!**************************!*\
  !*** ./src/Keybinder.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _Interpreter_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Interpreter.js */ \"./src/Interpreter.js\");\n\n\nclass Keybinder {\n\tstatic handleKeys(keys, ...args) {\n\t\tconst keybinder = new this(...args);\n\t\tkeybinder.handleKeys(keys);\n\t\treturn keybinder;\n\t}\n\n\tconstructor(map, cb, options) {\n\t\tthis.originalMap = map ? map : new Map();\n\t\tthis.map = new Map([...this.originalMap]);\n\t\tthis.interpreter = new _Interpreter_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"](this.map, cb, options);\n\t}\n\n\thandleKey(key) {\n\t\treturn this.interpreter.handleKey(key);\n\t}\n\n\thandleKeys(keys) {\n\t\treturn this.interpreter.handleKeys(keys);\n\t}\n\n\tdestroy() {\n\t\tthis.interpreter.destroy();\n\t\tthis.interpreter = null;\n\t\tthis.map.clear();\n\t\tthis.map = this.originalMap = null;\n\t}\n}\n\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Keybinder);\n\n\n//# sourceURL=webpack://composable-keybindings/./src/Keybinder.js?");

/***/ }),

/***/ "./src/Keybinding.js":
/*!***************************!*\
  !*** ./src/Keybinding.js ***!
  \***************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ Keybinding)\n/* harmony export */ });\nclass Keybinding {\n\tconstructor(options = {}) {\n\t\tthis.keys = options.keys || [];\n\t\tthis.countChars = options.countChars || [];\n\t\tthis.action = options.action;\n\t\tthis.store = options.store || {};\n\t\tthis.count = 1;\n\t}\n\n\taddCountChar(char) {\n\t\tthis.countChars.push(char);\n\t\tthis.count = parseInt(this.countChars.join(''));\n\t}\n}\n\n\n//# sourceURL=webpack://composable-keybindings/./src/Keybinding.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Interpreter: () => (/* reexport safe */ _Interpreter_js__WEBPACK_IMPORTED_MODULE_1__[\"default\"]),\n/* harmony export */   KeyReader: () => (/* reexport safe */ _KeyReader_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"]),\n/* harmony export */   Keybinder: () => (/* reexport safe */ _Keybinder_js__WEBPACK_IMPORTED_MODULE_0__[\"default\"]),\n/* harmony export */   Keybinding: () => (/* reexport safe */ _Keybinding_js__WEBPACK_IMPORTED_MODULE_3__[\"default\"]),\n/* harmony export */   STATUS: () => (/* reexport safe */ _status_js__WEBPACK_IMPORTED_MODULE_4__[\"default\"])\n/* harmony export */ });\n/* harmony import */ var _Keybinder_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./Keybinder.js */ \"./src/Keybinder.js\");\n/* harmony import */ var _Interpreter_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Interpreter.js */ \"./src/Interpreter.js\");\n/* harmony import */ var _KeyReader_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./KeyReader.js */ \"./src/KeyReader.js\");\n/* harmony import */ var _Keybinding_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./Keybinding.js */ \"./src/Keybinding.js\");\n/* harmony import */ var _status_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./status.js */ \"./src/status.js\");\n\n\n\n\n\n\n\n//# sourceURL=webpack://composable-keybindings/./src/index.js?");

/***/ }),

/***/ "./src/status.js":
/*!***********************!*\
  !*** ./src/status.js ***!
  \***********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({\n\tWAITING: 1,\n\tIS_READING: 2,\n\tIS_INTERPRETING: 3,\n\tNEEDS_KEY: 4,\n\tDONE: 5\n});\n\n\n//# sourceURL=webpack://composable-keybindings/./src/status.js?");

/***/ }),

/***/ "./src/utils/format-keyboard-event.js":
/*!********************************************!*\
  !*** ./src/utils/format-keyboard-event.js ***!
  \********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({\n\tUSE_KEY_NAME: new Set([\n\t\t'return', 'tab', 'space', 'backspace', 'enter', 'up', 'down', 'left', 'right'\n\t]),\n\n\tSHIFTABLE_KEYS: new Set([\n\t\t'escape', 'return', 'tab', 'backspace', 'up', 'down', 'left', 'right'\n\t]),\n\n\tgetKeyName(event) {\n\t\treturn event.key;\n\t},\n\n\t// modifier order: ctrl+meta+shift\n\ttoString(event) {\n\t\tconst keyName = this.getKeyName(event);\n\n\t\tconst modifiers = [];\n\t\tevent.ctrlKey && modifiers.push('ctrl');\n\t\tevent.metaKey && modifiers.push('meta');\n\n\t\tif (event.shiftKey && this.SHIFTABLE_KEYS.has(keyName)) {\n\t\t\tmodifiers.push('shift');\n\t\t}\n\n\t\treturn [...modifiers, keyName].join('+');\n\t}\n});\n\n\n//# sourceURL=webpack://composable-keybindings/./src/utils/format-keyboard-event.js?");

/***/ }),

/***/ "./src/utils/get-map-diff.js":
/*!***********************************!*\
  !*** ./src/utils/get-map-diff.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ((original, ...maps) => {\n\tconst replaced = new Map();\n\tconst added = new Map();\n\n\tmaps.forEach(map => {\n\t\tfor (const [key, val] of map.entries()) {\n\t\t\tif (original.has(key)) {\n\t\t\t\treplaced.set(key, original.get(key));\n\t\t\t} else {\n\t\t\t\tadded.set(key, val);\n\t\t\t}\n\t\t}\n\t});\n\n\treturn [replaced, added];\n});\n\n\n//# sourceURL=webpack://composable-keybindings/./src/utils/get-map-diff.js?");

/***/ }),

/***/ "./test/keybindings.js":
/*!*****************************!*\
  !*** ./test/keybindings.js ***!
  \*****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new Map([\n\t['escape', { behavior: ({ done }) => done('cancel') }],\n\n\t['b', 'back'],\n\n\t['t', { name: 'test' }],\n\t['ctrl+t', { name: 'ctrl+test' }],\n\t['f', {\n\t\tname: 'find',\n\t\ttype: 'motion',\n\t\tbehavior: ({ read, done }, kb) => {\n\t\t\tread(1, keys => {\n\t\t\t\tkb.store.find = keys[0];\n\t\t\t\tdone();\n\t\t\t});\n\t\t}\n\t}],\n\t['w', {\n\t\tbehavior: ({ interpret, done }) => {\n\t\t\tinterpret((type, kb) => done());\n\t\t}\n\t}],\n\t['q', {\n\t\tname: 'delete-filter-me',\n\t}],\n\t['d', {\n\t\tname: 'delete',\n\t\tkeybindings: new Map([\n\t\t\t['d', { name: 'delete-line' }],\n\t\t\t['z', { name: 'i-take-priority' }]\n\t\t]),\n\t\tbehavior: ({ interpret, done }, kb) => {\n\t\t\tinterpret((type, subKb) => {\n\t\t\t\tif (type !== 'keybinding') {\n\t\t\t\t\treturn done(type);\n\t\t\t\t}\n\n\t\t\t\tkb.store[subKb.action.type] = subKb.action.name;\n\t\t\t\tdone();\n\t\t\t}, action => ['textObject', 'motion'].includes(action.type));\n\t\t},\n\t\tinterprets: new Map([\n\t\t\t['z', { name: 'i-dont-take-priority' }],\n\t\t\t['i', {\n\t\t\t\tname: 'inner',\n\t\t\t\ttype: 'textObject',\n\t\t\t\tbehavior: ({ read, done }, kb) => {\n\t\t\t\t\tread(1, keys => {\n\t\t\t\t\t\tkb.store.inner = keys[0];\n\t\t\t\t\t\tdone();\n\t\t\t\t\t});\n\t\t\t\t}\n\t\t\t}],\n\t\t\t['[', {\n\t\t\t\tname: 'i-am-not-root'\n\t\t\t}]\n\t\t])\n\t}],\n\t['y', {\n\t\tname: 'yank',\n\t\tkeybindings: new Map([\n\t\t\t['y', { name: 'yank-line' }],\n\t\t\t['z', { name: 'zzzzzzzzzzzz' }],\n\t\t])\n\t}],\n\t['i', { name: 'insert' }],\n\t['j', { name: 'cursor-down', type: 'motion' }],\n\t['0', { name: 'cursor-to-start', type: 'motion' }],\n\t['\"', {\n\t\tname: 'register',\n\t\tbehavior: ({ read, done }, kb) => {\n\t\t\tread(1, keys => {\n\t\t\t\tkb.store.register = keys[0];\n\t\t\t\tdone('resume');\n\t\t\t});\n\t\t},\n\t}],\n\t['z', {\n\t\tname: 'nested-supplemental',\n\t\tbehavior: ({ read, done }, kb) => {\n\t\t\tread(1, keys => {\n\t\t\t\tkb.store.z = keys[0];\n\t\t\t\tdone('resume');\n\t\t\t});\n\t\t}\n\t}]\n]));\n\n\n//# sourceURL=webpack://composable-keybindings/./test/keybindings.js?");

/***/ }),

/***/ "./test/playground-browser/index.js":
/*!******************************************!*\
  !*** ./test/playground-browser/index.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _src_index_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../src/index.js */ \"./src/index.js\");\n/* harmony import */ var _src_utils_format_keyboard_event_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../src/utils/format-keyboard-event.js */ \"./src/utils/format-keyboard-event.js\");\n/* harmony import */ var _keybindings_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../keybindings.js */ \"./test/keybindings.js\");\n\n\n\n\nclass Playground {\n\tconstructor() {\n\t\tthis.onKeypress = this.onKeypress.bind(this);\n\t\tthis.onKeybinding = this.onKeybinding.bind(this);\n\n\t\tthis.keybinder = new _src_index_js__WEBPACK_IMPORTED_MODULE_0__.Keybinder(_keybindings_js__WEBPACK_IMPORTED_MODULE_2__[\"default\"], this.onKeybinding);\n\n\t\twindow.addEventListener('keydown', this.onKeypress);\n\t\tthis.div = document.querySelector('#console');\n\t\tdocument.querySelector('#clear').addEventListener('click', () => this.clear());\n\t}\n\n\tonKeypress(event) {\n\t\tif (['Shift', 'Control', 'Meta', 'Alt'].includes(event.key)) {\n\t\t\treturn;\n\t\t}\n\n\t\tthis.keybinder.handleKey(_src_utils_format_keyboard_event_js__WEBPACK_IMPORTED_MODULE_1__[\"default\"].toString(event));\n\n\t\tif (event.key === 'k' && event.metaKey) {\n\t\t\tthis.clear();\n\t\t}\n\t}\n\n\tonKeybinding(type, kb, status) {\n\t\tconst isAtBottom = this.div.scrollHeight - this.div.offsetHeight === this.div.scrollTop;\n\n\t\tthis.div.append(document.createElement('hr'));\n\t\tconst pre = document.createElement('pre');\n\t\tpre.textContent = `\"${type}\" -- ${this.formatKb(kb)}`;\n\t\tthis.div.append(pre);\n\n\t\tisAtBottom && this.div.scrollTo(0, this.div.scrollHeight);\n\t}\n\n\tclear() {\n\t\tthis.div.innerHTML = '';\n\t}\n\n\tformatKb(kb) {\n\t\treturn JSON.stringify({\n\t\t\tkeys: kb.keys.map(key => key.toString()),\n\t\t\tcount: kb.count,\n\t\t\taction: kb.action,\n\t\t\tstore: kb.store\n\t\t}, null, 2);\n\t}\n}\n\nnew Playground();\n\n\n//# sourceURL=webpack://composable-keybindings/./test/playground-browser/index.js?");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./test/playground-browser/index.js");
/******/ 	
/******/ })()
;