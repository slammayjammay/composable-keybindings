import assert from 'assert';
import { Keybinder, STATUS } from '../src/index.js';
import keybindings from './keybindings.js';

const keybinder = new Keybinder(keybindings);

describe('Keybinder', () => {
	describe('cb types', () => {
		it('cb calls with type "keybinding"', (done) => {
			keybinder.handleKeys(['j'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.ok(kb.action);
				assert.ok(kb.count);
				assert.ok(kb.store);
				assert.ok(kb.keys);
				assert.equal(status, STATUS.DONE);
				done();
			});
		});

		it('cb calls with type "unrecognized"', (done) => {
			keybinder.handleKeys(['['], (type, kb, status) => {
				assert.equal(type, 'unrecognized');
				assert.equal(status, STATUS.DONE);
				done();
			});
		});
	});

	describe('recognition', () => {
		it('one-to-one keybindings', (done) => {
			keybinder.handleKeys(['t'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(kb.action.name, 'test');
				assert.equal(status, STATUS.DONE);
				done();
			});
		});

		it('nested keybindings', (done) => {
			keybinder.handleKeys(['y', 'y'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'yank-line');
				done();
			});
		});

		it('reading keybindings', (done) => {
			keybinder.handleKeys(['f', 'a'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'find');
				assert.equal(kb.store.find, 'a');
				done();
			});
		});

		it('interpreting keybindings', (done) => {
			keybinder.handleKeys(['9', 'd', '3', '4', 'f', 'a'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'delete');
				assert.equal(kb.count, 9);
				assert.equal(kb.store.find, 'a');
				done();
			});
		});

		it('supplemental keybindings', (done) => {
			keybinder.handleKeys(['"', 'a', 't'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'test');
				assert.equal(kb.store.register, 'a');
				done();
			});
		});

		it('adjacent supplemental keybindings', (done) => {
			keybinder.handleKeys(['"', 'a', 'z', 'b', 'd', 'i', 'w'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				const { register, z, inner } = kb.store;
				assert.equal(kb.action.name, 'delete');
				assert.deepStrictEqual([register, z, inner], ['a', 'b', 'w']);
				done();
			});
		});

		it('accepts a filter argument when interpreting', (done) => {
			const options = {
				filter: action => action.name === 'filter-me'
			};

			Keybinder.handleKeys(['d', 'f'], keybindings, (type, kb, status) => {
				assert.equal(status, STATUS.DONE);
				assert.equal(type, 'filtered');
				done();
			}, options);
		});

		it('prioritizes "keybindings" over "interprets", when both present', (done) => {
			keybinder.handleKeys(['d', 'z'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'i-take-priority');
				done();
			});
		});

		it('accepts numbers as keybindings', (done) => {
			keybinder.handleKeys(['0'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'cursor-to-start');
				done();
			});
		});
	});

	describe('"interprets" map', () => {
		it('is recognized', () => {
			return Promise.all([
				new Promise(resolve => {
					keybinder.handleKeys(['i'], (type, kb, status) => {
						assert.equal(type, 'keybinding');
						assert.equal(status, STATUS.DONE);
						assert.equal(kb.action.name, 'insert');
						resolve();
					})
				}),

				new Promise(resolve => {
					keybinder.handleKeys(['d', 'i', 'w'], (type, kb, status) => {
						assert.equal(type, 'keybinding');
						assert.equal(status, STATUS.DONE);
						assert.equal(kb.action.name, 'delete');
						assert.equal(kb.store.inner, 'w');
						resolve();
					});
				}),
			])
		});

		it('resets map correctly', (done) => {
			keybinder.handleKeys(['d', 'i', 'w'], (type, kb, status) => {
				assert.equal(type, 'keybinding');
				assert.equal(status, STATUS.DONE);
				assert.equal(kb.action.name, 'delete');
				assert.equal(kb.store.inner, 'w');
				assert.equal(keybindings.get('i').name, 'insert');
				assert.equal(keybindings.get('z').name, 'nested-supplemental');
				assert(!keybindings.has('['));
				done();
			});
		});
	});
});
