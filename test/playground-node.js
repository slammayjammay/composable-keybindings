import util from 'util';
import { Keybinder } from '../src/index.js';
import NodeListener from '../src/utils/NodeListener.js';
import keybindings from './keybindings.js';

class Playground {
	constructor() {
		this.onKeypress = this.onKeypress.bind(this);
		this.onKeybinding = this.onKeybinding.bind(this);

		this.listener = new NodeListener(this.onKeypress, { autoFormat: true });
		this.keybinder = new Keybinder(keybindings, this.onKeybinding);
	}

	onKeypress(_, key) {
		this.keybinder.handleKey(key.formatted);
	}

	onKeybinding(type, kb, status) {
		console.log(type, util.inspect(kb, { depth: 10, colors: true }));
	}
}

console.log('-- Playground Mode --');
new Playground();
