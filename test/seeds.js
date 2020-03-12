module.exports = new Map([
	['t', { name: 'test' }],
	['f', {
		name: 'find',
		type: 'motion',
		behavior: ({ read }, store) => {
			return read(1).then(keys => store.find = keys[0]);
		}
	}],
	['d', {
		name: 'delete',
		keybindings: new Map([
			['d', { name: 'delete-line' }],
			['z', { name: 'i-take-priority' }]
		]),
		behavior: ({ interpret }, store) => {
			const filter = kb => ['textObject', 'motion'].includes(kb.type);
			return interpret(filter).then(kb => store[kb.action.type] = kb);
		},
		interprets: new Map([
			['z', { name: 'i-dont-take-priority' }],
			['i', {
				name: 'inner',
				type: 'textObject',
				behavior: async ({ read }, store) => {
					store.inner = (await read(1))[0];
				}
			}],
			['[', {
				name: 'i-am-not-root'
			}]
		])
	}],
	['y', {
		name: 'yank',
		keybindings: new Map([
			['y', { name: 'yank-line' }],
			['z', { name: 'zzzzzzzzzzzz' }],
		])
	}],
	['i', { name: 'insert' }],
	['j', { name: 'cursor-down', type: 'motion' }],
	['"', {
		name: 'register',
		supplemental: true,
		behavior: async ({ read }, store) => {
			store.register = (await read(1))[0];
		},
	}],
	['z', {
		name: 'nested-supplemental',
		supplemental: true,
		behavior: async ({ read }, store) => {
			store.z = (await read(1))[0];
		}
	}]
]);
