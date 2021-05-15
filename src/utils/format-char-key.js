export default {
	// if key.name is in this set, use this as the key name
	USE_KEY_NAME: new Set([
		'return', 'tab', 'space', 'backspace', 'enter', 'up', 'down', 'left', 'right'
	]),

	// keys that can theoretically be shiftable, even if Node doesn't do it well
	SHIFTABLE_KEYS: new Set([
		'escape', 'return', 'tab', 'backspace', 'up', 'down', 'left', 'right'
	]),

	getKeyName(char, key) {
		let keyName = char;
		if (this.USE_KEY_NAME.has(key.name) || key.ctrl || key.meta) {
			keyName = key.name;
		}
		return keyName;
	},

	// modifier order: ctrl+meta+shift
	toString(char, key) {
		const keyName = this.getKeyName(char, key);

		const modifiers = [];
		key.ctrl && modifiers.push('ctrl');
		(key.meta && keyName !== 'escape') && modifiers.push('meta');

		if (key.shift && this.SHIFTABLE_KEYS.has(key.name)) {
			modifiers.push('shift');
		}

		return [...modifiers, keyName].join('+');
	}
};
