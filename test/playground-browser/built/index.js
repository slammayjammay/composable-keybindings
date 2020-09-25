/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./test/playground-browser/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/Interpreter.js":
/*!****************************!*\
  !*** ./src/Interpreter.js ***!
  \****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const Keybinding = __webpack_require__(/*! ./Keybinding */ \"./src/Keybinding.js\");\nconst KeyReader = __webpack_require__(/*! ./KeyReader */ \"./src/KeyReader.js\");\nconst STATUS = __webpack_require__(/*! ./status */ \"./src/status.js\");\nconst getMapDiff = __webpack_require__(/*! ./utils/get-map-diff */ \"./src/utils/get-map-diff.js\");\n\nconst DEFAULTS = {\n\tgetKeybinding: (key, map) => map.get(key),\n\tisKeyNumber: key => /\\d/.test(key),\n\tisKeyEscape: key => key === 'escape'\n};\n\nclass Interpreter {\n\tconstructor(map, doneCb, options = {}) {\n\t\tthis.map = map;\n\t\tthis.doneCb = doneCb;\n\t\tthis.options = { ...DEFAULTS, ...options };\n\n\t\tthis.read = this.read.bind(this);\n\t\tthis.interpret = this.interpret.bind(this);\n\t\tthis.done = this.done.bind(this);\n\n\t\tthis.kb = new Keybinding({ store: this.options.store || {} });\n\n\t\tthis.cds = [{ action: null }];\n\t\tthis.keyReader = this.interpreter = null;\n\n\t\tthis.status = STATUS.WAITING;\n\t}\n\n\treset() {\n\t\tthis.cdToRoot();\n\t\tthis.status = STATUS.WAITING;\n\t\tthis.kb = new Keybinding();\n\t}\n\n\thandleKey(key) {\n\t\tif (this.options.isKeyEscape(key)) {\n\t\t\treturn this.onDone('cancel');\n\t\t}\n\n\t\tif (this.status === STATUS.NEEDS_KEY) {\n\t\t\treturn this.onNeededKey(key);\n\t\t}\n\n\t\tthis.kb.keys.push(key);\n\n\t\tif (this.status === STATUS.WAITING) {\n\t\t\tthis.onWaiting(key);\n\t\t} else if (this.status === STATUS.IS_READING) {\n\t\t\tthis.keyReader.handleKey(key);\n\t\t} else if (this.status === STATUS.IS_INTERPRETING) {\n\t\t\tthis.interpreter.handleKey(key);\n\t\t}\n\t}\n\n\tonWaiting(key) {\n\t\tconst action = this.options.getKeybinding(key, this.map);\n\n\t\tif (this.options.isKeyNumber(key) && !(this.kb.countChars.length === 0 && action)) {\n\t\t\tthis.onNumber(key);\n\t\t} else if (!action) {\n\t\t\tthis.onUnrecognized(key);\n\t\t} else if (this.options.filter && this.options.filter(action)) {\n\t\t\tthis.onFiltered(action);\n\t\t} else if (action.keybindings instanceof Map && typeof action.behavior === 'function') {\n\t\t\tthis.onNeedsKey(action);\n\t\t} else if (action.keybindings instanceof Map) {\n\t\t\tthis.onKeybindingMap(action);\n\t\t} else if (typeof action.behavior === 'function') {\n\t\t\tthis.onBehavior(action);\n\t\t} else {\n\t\t\tthis.onDone('keybinding', action);\n\t\t}\n\t}\n\n\tonNumber(key) {\n\t\tthis.kb.countChars.push(key);\n\t}\n\n\tonUnrecognized(key) {\n\t\tthis.onDone('unrecognized', key);\n\t}\n\n\tonFiltered(action) {\n\t\tthis.onDone('filtered', action);\n\t}\n\n\tonNeedsKey(action) {\n\t\tthis.status = STATUS.NEEDS_KEY;\n\t\tthis.cdIntoAction(action);\n\t}\n\n\tonNeededKey(key) {\n\t\tconst action = this.getCurrentAction();\n\n\t\tif (action.keybindings instanceof Map && action.keybindings.has(key)) {\n\t\t\tthis.onKeybindingMap(action);\n\t\t} else if (typeof action.behavior === 'function') {\n\t\t\tthis.onBehavior(action);\n\t\t}\n\n\t\tthis.handleKey(key);\n\t}\n\n\tonKeybindingMap(action) {\n\t\tthis.status = STATUS.WAITING;\n\t\tthis.cdIntoAction(action);\n\t}\n\n\tonBehavior(action) {\n\t\tthis.status = STATUS.WAITING;\n\t\tthis.cdIntoAction(action);\n\t\tconst { read, interpret, done } = this;\n\t\tconst lastKey = this.kb.keys[this.kb.keys.length - 1];\n\t\taction.behavior({ read, interpret, done }, this.kb, lastKey);\n\t}\n\n\tread(count, cb) {\n\t\tthis.status = STATUS.IS_READING;\n\t\tthis.keyReader = new KeyReader(count, keys => {\n\t\t\tthis.status = STATUS.WAITING;\n\t\t\tthis.keyReader.destroy();\n\t\t\tthis.keyReader = null;\n\t\t\tcb(keys);\n\t\t});\n\t}\n\n\tinterpret(cb, filter) {\n\t\tthis.status = STATUS.IS_INTERPRETING;\n\n\t\tconst doneCb = (...args) => {\n\t\t\tthis.status = STATUS.WAITING;\n\t\t\tthis.interpreter.cdToRoot();\n\t\t\tthis.interpreter.destroy();\n\t\t\tthis.interpreter = null;\n\t\t\tcb(...args);\n\t\t};\n\n\t\tconst { store } = this.kb;\n\t\tthis.interpreter = new Interpreter(this.map, doneCb, { ...this.options, store, filter });\n\t}\n\n\tdone(type = 'keybinding', data = this.getCurrentAction(), status) {\n\t\tstatus = status || {\n\t\t\tresume: STATUS.WAITING\n\t\t}[type];\n\n\t\tthis.onDone(type, data, status);\n\t}\n\n\t// types\n\t// - keybinding\n\t// - unrecognized\n\t// - cancel\n\tonDone(type, data, status = STATUS.DONE) {\n\t\tthis.status = status;\n\n\t\tif (type === 'keybinding') {\n\t\t\tthis.kb.action = data;\n\t\t\tdata = this.kb;\n\t\t}\n\n\t\tif (this.status === STATUS.DONE) {\n\t\t\tthis.doneCb(type, data, this.status);\n\t\t\tthis.reset();\n\t\t}\n\t}\n\n\tcdIntoAction(action) {\n\t\tif (this.getCurrentAction() === action) {\n\t\t\treturn;\n\t\t}\n\n\t\tconst props = ['interprets', 'keybindings'];\n\t\tconst maps = props.map(p => action[p]).filter(m => m instanceof Map);\n\n\t\tconst [replaced, added] = getMapDiff(this.map, ...maps);\n\n\t\tmaps.forEach(map => map.forEach((val, key) => this.map.set(key, val)));\n\n\t\tthis.cds.push({ action, replaced, added });\n\t}\n\n\tgetCurrentAction() {\n\t\treturn this.cds[this.cds.length - 1].action;\n\t}\n\n\tcdUp() {\n\t\tconst { action, replaced, added } = this.cds.pop();\n\n\t\treplaced.forEach((val, key) => this.map.set(key, val));\n\t\tadded.forEach((_, key) => this.map.delete(key));\n\n\t\treplaced.clear();\n\t\tadded.clear();\n\t}\n\n\tcdToRoot() {\n\t\twhile (this.cds.length > 1) {\n\t\t\tthis.cdUp();\n\t\t}\n\t}\n\n\tdestroy() {\n\t\tthis.keyReader && this.keyReader.destroy();\n\t\tthis.interpreter && this.interpreter.cdToRoot();\n\t\tthis.interpreter && this.interpreter.destroy();\n\n\t\tthis.map = this.store = this.doneCb = this.filter = null;\n\t\tthis.kb = null;\n\t\tthis.keyReader = this.interpreter = null;\n\t}\n}\n\nmodule.exports = Interpreter;\n\n\n//# sourceURL=webpack:///./src/Interpreter.js?");

/***/ }),

/***/ "./src/KeyReader.js":
/*!**************************!*\
  !*** ./src/KeyReader.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("class KeyReader {\n\tconstructor(count, doneCb) {\n\t\tthis.count = count;\n\t\tthis.doneCb = doneCb;\n\t\tthis.keys = [];\n\t}\n\n\treset(count = this.count) {\n\t\tthis.count = count;\n\t\tthis.keys = [];\n\t}\n\n\thandleKey(key) {\n\t\tthis.keys.push(key);\n\n\t\tif (this.keys.length === this.count) {\n\t\t\tthis.doneCb(this.keys);\n\t\t}\n\t}\n\n\tdestroy() {\n\t\tthis.count = this.doneCb = this.keys = null;\n\t}\n}\n\nmodule.exports = KeyReader;\n\n\n//# sourceURL=webpack:///./src/KeyReader.js?");

/***/ }),

/***/ "./src/Keybinder.js":
/*!**************************!*\
  !*** ./src/Keybinder.js ***!
  \**************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const Interpreter = __webpack_require__(/*! ./Interpreter */ \"./src/Interpreter.js\");\n\nclass Keybinder {\n\tstatic handleKeys(keys, ...args) {\n\t\tconst keybinder = new this(...args);\n\t\tkeys.forEach(key => keybinder.handleKey(key));\n\t}\n\n\tconstructor(map, cb, options) {\n\t\tthis.originalMap = map ? map : new Map();\n\t\tthis.map = new Map([...this.originalMap]);\n\t\tthis.interpreter = new Interpreter(this.map, cb, options);\n\t}\n\n\thandleKey(key) {\n\t\treturn this.interpreter.handleKey(key);\n\t}\n\n\thandleKeys(keys, cb) {\n\t\treturn this.constructor.handleKeys(keys, new Map([...this.originalMap]), cb);\n\t}\n\n\tdestroy() {\n\t\tthis.interpreter.destroy();\n\t\tthis.interpreter = null;\n\t\tthis.map.clear();\n\t\tthis.map = this.originalMap = null;\n\t}\n}\n\nmodule.exports = Keybinder;\n\n\n//# sourceURL=webpack:///./src/Keybinder.js?");

/***/ }),

/***/ "./src/Keybinding.js":
/*!***************************!*\
  !*** ./src/Keybinding.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = class Keybinding {\n\tconstructor(options = {}) {\n\t\tthis.keys = options.keys || [];\n\t\tthis.countChars = options.countChars || [];\n\t\tthis.action = options.action;\n\t\tthis.store = options.store || {};\n\t}\n\n\tget count() {\n\t\treturn this.countChars.length === 0 ? 1 : parseInt(this.countChars.join(''));\n\t}\n}\n\n\n//# sourceURL=webpack:///./src/Keybinding.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = {\n\tKeybinder: __webpack_require__(/*! ./Keybinder */ \"./src/Keybinder.js\"),\n\tInterpreter: __webpack_require__(/*! ./Interpreter */ \"./src/Interpreter.js\"),\n\tKeyReader: __webpack_require__(/*! ./KeyReader */ \"./src/KeyReader.js\"),\n\tKeybinding: __webpack_require__(/*! ./Keybinding */ \"./src/Keybinding.js\"),\n\tSTATUS: __webpack_require__(/*! ./status */ \"./src/status.js\")\n};\n\n\n//# sourceURL=webpack:///./src/index.js?");

/***/ }),

/***/ "./src/status.js":
/*!***********************!*\
  !*** ./src/status.js ***!
  \***********************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = {\n\tWAITING: 1,\n\tIS_READING: 2,\n\tIS_INTERPRETING: 3,\n\tNEEDS_KEY: 4,\n\tDONE: 5\n};\n\n\n//# sourceURL=webpack:///./src/status.js?");

/***/ }),

/***/ "./src/utils/format-keyboard-event.js":
/*!********************************************!*\
  !*** ./src/utils/format-keyboard-event.js ***!
  \********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = {\n\tUSE_KEY_NAME: new Set([\n\t\t'return', 'tab', 'space', 'backspace', 'enter', 'up', 'down', 'left', 'right'\n\t]),\n\n\tSHIFTABLE_KEYS: new Set([\n\t\t'escape', 'return', 'tab', 'backspace', 'up', 'down', 'left', 'right'\n\t]),\n\n\tgetKeyName(event) {\n\t\treturn event.key;\n\t},\n\n\t// modifier order: ctrl+meta+shift\n\ttoString(event) {\n\t\tconst keyName = this.getKeyName(event);\n\n\t\tconst modifiers = [];\n\t\tevent.ctrlKey && modifiers.push('ctrl');\n\t\tevent.metaKey && modifiers.push('meta');\n\n\t\tif (event.shiftKey && this.SHIFTABLE_KEYS.has(keyName)) {\n\t\t\tmodifiers.push('shift');\n\t\t}\n\n\t\treturn [...modifiers, keyName].join('+');\n\t}\n};\n\n\n//# sourceURL=webpack:///./src/utils/format-keyboard-event.js?");

/***/ }),

/***/ "./src/utils/get-map-diff.js":
/*!***********************************!*\
  !*** ./src/utils/get-map-diff.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = (original, ...maps) => {\n\tconst replaced = new Map();\n\tconst added = new Map();\n\n\tmaps.forEach(map => {\n\t\tfor (const [key, val] of map.entries()) {\n\t\t\tif (original.has(key)) {\n\t\t\t\treplaced.set(key, original.get(key));\n\t\t\t} else {\n\t\t\t\tadded.set(key, val);\n\t\t\t}\n\t\t}\n\t});\n\n\treturn [replaced, added];\n};\n\n\n//# sourceURL=webpack:///./src/utils/get-map-diff.js?");

/***/ }),

/***/ "./test/keybindings.js":
/*!*****************************!*\
  !*** ./test/keybindings.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = new Map([\n\t['escape', { behavior: ({ done }) => done('cancel') }],\n\n\t['b', 'back'],\n\n\t['t', { name: 'test' }],\n\t['ctrl+t', { name: 'ctrl+test' }],\n\t['f', {\n\t\tname: 'find',\n\t\ttype: 'motion',\n\t\tbehavior: ({ read, done }, kb) => {\n\t\t\tread(1, keys => {\n\t\t\t\tkb.store.find = keys[0];\n\t\t\t\tdone();\n\t\t\t});\n\t\t}\n\t}],\n\t['d', {\n\t\tname: 'delete',\n\t\tkeybindings: new Map([\n\t\t\t['d', { name: 'delete-line' }],\n\t\t\t['z', { name: 'i-take-priority' }]\n\t\t]),\n\t\tbehavior: ({ interpret, done }, kb, key) => {\n\t\t\tinterpret((type, subKb, status) => {\n\t\t\t\tif (type !== 'keybinding') {\n\t\t\t\t\treturn done('cancel');\n\t\t\t\t}\n\n\t\t\t\tkb.store[subKb.action.type] = kb.name;\n\t\t\t\tdone();\n\t\t\t}, kb => !['textObject', 'motion'].includes(kb.type));\n\t\t},\n\t\tinterprets: new Map([\n\t\t\t['z', { name: 'i-dont-take-priority' }],\n\t\t\t['i', {\n\t\t\t\tname: 'inner',\n\t\t\t\ttype: 'textObject',\n\t\t\t\tbehavior: ({ read, done }, kb) => {\n\t\t\t\t\tread(1, keys => {\n\t\t\t\t\t\tkb.store.inner = keys[0];\n\t\t\t\t\t\tdone();\n\t\t\t\t\t});\n\t\t\t\t}\n\t\t\t}],\n\t\t\t['[', {\n\t\t\t\tname: 'i-am-not-root'\n\t\t\t}]\n\t\t])\n\t}],\n\t['y', {\n\t\tname: 'yank',\n\t\tkeybindings: new Map([\n\t\t\t['y', { name: 'yank-line' }],\n\t\t\t['z', { name: 'zzzzzzzzzzzz' }],\n\t\t])\n\t}],\n\t['i', { name: 'insert' }],\n\t['j', { name: 'cursor-down', type: 'motion' }],\n\t['0', { name: 'cursor-to-start', type: 'motion' }],\n\t['\"', {\n\t\tname: 'register',\n\t\tbehavior: ({ read, done }, kb) => {\n\t\t\tread(1, keys => {\n\t\t\t\tkb.store.register = keys[0];\n\t\t\t\tdone('resume');\n\t\t\t});\n\t\t},\n\t}],\n\t['z', {\n\t\tname: 'nested-supplemental',\n\t\tbehavior: ({ read, done }, kb) => {\n\t\t\tread(1, keys => {\n\t\t\t\tkb.store.z = keys[0];\n\t\t\t\tdone('resume');\n\t\t\t});\n\t\t}\n\t}]\n]);\n\n\n//# sourceURL=webpack:///./test/keybindings.js?");

/***/ }),

/***/ "./test/playground-browser/index.js":
/*!******************************************!*\
  !*** ./test/playground-browser/index.js ***!
  \******************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const { Keybinder } = __webpack_require__(/*! ../../src */ \"./src/index.js\");\nconst formatKeyboardEvent = __webpack_require__(/*! ../../src/utils/format-keyboard-event */ \"./src/utils/format-keyboard-event.js\");\nconst keybindings = __webpack_require__(/*! ../keybindings */ \"./test/keybindings.js\");\n\nclass Playground {\n\tconstructor() {\n\t\tthis.onKeypress = this.onKeypress.bind(this);\n\t\tthis.onKeybinding = this.onKeybinding.bind(this);\n\n\t\tthis.keybinder = new Keybinder(keybindings, this.onKeybinding, {\n\t\t\tgetKeybinding: (key, map) => map.get(formatKeyboardEvent.toString(key)),\n\t\t\tisKeyNumber: key => /\\d/.test(key.key),\n\t\t\tisKeyEscape: key => key.key === 'Escape'\n\t\t});\n\n\t\twindow.addEventListener('keydown', this.onKeypress);\n\t\tthis.div = document.querySelector('#console');\n\t\tdocument.querySelector('#clear').addEventListener('click', () => this.clear());\n\t}\n\n\tonKeypress(event) {\n\t\tthis.keybinder.handleKey(event);\n\n\t\tif (event.key === 'k' && event.metaKey) {\n\t\t\tthis.clear();\n\t\t}\n\t}\n\n\tonKeybinding(type, kb, status) {\n\t\tconst isAtBottom = this.div.scrollHeight - this.div.offsetHeight === this.div.scrollTop;\n\n\t\tthis.div.append(document.createElement('hr'));\n\t\tconst pre = document.createElement('pre');\n\t\tconst formatted = type === 'keybinding' ? this.formatKb(kb) : kb;\n\t\tpre.textContent = `\"${type}\" -- ${formatted}`;\n\t\tthis.div.append(pre);\n\n\t\tisAtBottom && this.div.scrollTo(0, this.div.scrollHeight);\n\t}\n\n\tclear() {\n\t\tthis.div.innerHTML = '';\n\t}\n\n\tformatKb(kb) {\n\t\treturn JSON.stringify({\n\t\t\tkeys: kb.keys.map(key => key.toString()),\n\t\t\tcount: kb.count,\n\t\t\taction: kb.action,\n\t\t\tstore: kb.store\n\t\t}, null, 2);\n\t}\n}\n\nconsole.log('-- Playground Mode --');\nnew Playground();\n\n\n//# sourceURL=webpack:///./test/playground-browser/index.js?");

/***/ })

/******/ });