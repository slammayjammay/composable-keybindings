import { dirname } from 'path';
import { fileURLToPath } from 'url';
const base = dirname(fileURLToPath(import.meta.url));

export default {
	mode: process.env.NODE_ENV || 'development',
	entry: `${base}/index.js`,
	output: {
		path: `${base}/built`,
		filename: 'index.js'
	}
};
