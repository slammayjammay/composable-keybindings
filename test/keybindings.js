export default new Map([
	['escape', { behavior: ({ done }) => done('cancel') }],

	['b', 'back'],

	['t', { name: 'test' }],
	['ctrl+t', { name: 'ctrl+test' }],
	['f', {
		name: 'find',
		type: 'motion',
		behavior: ({ read, done }, kb) => {
			read(1, keys => {
				kb.store.find = keys[0];
				done();
			});
		}
	}],
	['q', {
		name: 'delete-filter-me',
	}],
	['d', {
		name: 'delete',
		keybindings: new Map([
			['d', { name: 'delete-line' }],
			['z', { name: 'i-take-priority' }]
		]),
		behavior: ({ interpret, done }, kb) => {
			interpret((type, subKb) => {
				if (type !== 'keybinding') {
					return done(type);
				}

				kb.store[subKb.action.type] = subKb.action.name;
				done();
			}, action => ['textObject', 'motion'].includes(action.type));
		},
		interprets: new Map([
			['z', { name: 'i-dont-take-priority' }],
			['i', {
				name: 'inner',
				type: 'textObject',
				behavior: ({ read, done }, kb) => {
					read(1, keys => {
						kb.store.inner = keys[0];
						done();
					});
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
	['0', { name: 'cursor-to-start', type: 'motion' }],
	['"', {
		name: 'register',
		behavior: ({ read, done }, kb) => {
			read(1, keys => {
				kb.store.register = keys[0];
				done('resume');
			});
		},
	}],
	['z', {
		name: 'nested-supplemental',
		behavior: ({ read, done }, kb) => {
			read(1, keys => {
				kb.store.z = keys[0];
				done('resume');
			});
		}
	}]
]);
