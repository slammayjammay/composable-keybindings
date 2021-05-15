export default {
	USE_KEY_NAME: new Set([
		'return', 'tab', 'space', 'backspace', 'enter', 'up', 'down', 'left', 'right'
	]),

	SHIFTABLE_KEYS: new Set([
		'escape', 'return', 'tab', 'backspace', 'up', 'down', 'left', 'right'
	]),

	getKeyName(event) {
		return event.key;
	},

	// modifier order: ctrl+meta+shift
	toString(event) {
		const keyName = this.getKeyName(event);

		const modifiers = [];
		event.ctrlKey && modifiers.push('ctrl');
		event.metaKey && modifiers.push('meta');

		if (event.shiftKey && this.SHIFTABLE_KEYS.has(keyName)) {
			modifiers.push('shift');
		}

		return [...modifiers, keyName].join('+');
	}
};
