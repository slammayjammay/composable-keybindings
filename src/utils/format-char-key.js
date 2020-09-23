// if key.name is in this set, use this as the key name
const USE_KEY_NAME = new Set([
	'return', 'tab', 'space', 'backspace', 'enter', 'up', 'down', 'left', 'right'
]);

// keys that can theoretically be shiftable, even if Node doesn't do it well
const SHIFTABLE_KEYS = new Set([
	'escape', 'return', 'tab', 'backspace', 'up', 'down', 'left', 'right'
]);

module.exports = {
	getKeyName(char, key) {
		let keyName = char;
		if (USE_KEY_NAME.has(key.name) || key.ctrl || key.meta) {
			keyName = key.name;
		}
		return keyName;
	},

	toString(char, key) {
		const formatted = [];
		const keyName = this.getKeyName(char, key);

		formatted.push(keyName);
		key.ctrl && formatted.unshift('ctrl');
		(key.meta && keyName !== 'escape') && formatted.unshift('meta');

		if (key.shift && SHIFTABLE_KEYS.has(key.name)) {
			formatted.unshift('shift');
		}

		return formatted.join('+');
	}
};
