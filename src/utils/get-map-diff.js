export default (original, ...maps) => {
	const replaced = new Map();
	const added = new Map();

	maps.forEach(map => {
		for (const [key, val] of map.entries()) {
			if (original.has(key)) {
				replaced.set(key, original.get(key));
			} else {
				added.set(key, val);
			}
		}
	});

	return [replaced, added];
};
