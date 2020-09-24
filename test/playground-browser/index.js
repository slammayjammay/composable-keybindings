const { Keybinder } = require('../../src');
const formatKeyboardEvent = require('../../src/utils/format-keyboard-event');
const keybindings = require('../keybindings');

class Playground {
	constructor() {
		this.onKeypress = this.onKeypress.bind(this);
		this.onKeybinding = this.onKeybinding.bind(this);

		this.keybinder = new Keybinder(keybindings, this.onKeybinding, {
			getKeybinding: (key, map) => map.get(formatKeyboardEvent.toString(key)),
			isKeyNumber: key => /\d/.test(key.key),
			isKeyEscape: key => key.key === 'Escape'
		});

		window.addEventListener('keydown', this.onKeypress);
		this.div = document.querySelector('#console');
		document.querySelector('#clear').addEventListener('click', () => this.clear());
	}

	onKeypress(event) {
		this.keybinder.handleKey(event);

		if (event.key === 'k' && event.metaKey) {
			this.clear();
		}
	}

	onKeybinding(type, kb, status) {
		const isAtBottom = this.div.scrollHeight - this.div.offsetHeight === this.div.scrollTop;

		this.div.append(document.createElement('hr'));
		const pre = document.createElement('pre');
		const formatted = type === 'keybinding' ? this.formatKb(kb) : kb;
		pre.textContent = `"${type}" -- ${formatted}`;
		this.div.append(pre);

		isAtBottom && this.div.scrollTo(0, this.div.scrollHeight);
	}

	clear() {
		this.div.innerHTML = '';
	}

	formatKb(kb) {
		return JSON.stringify({
			keys: kb.keys.map(key => key.toString()),
			count: kb.count,
			action: kb.action,
			store: kb.store
		}, null, 2);
	}
}

console.log('-- Playground Mode --');
new Playground();
