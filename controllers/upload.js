const multer = require('multer');
const fs = require('fs');

const fileStorage = multer.diskStorage({
	destination: async (req, file, cb) => {
		const types = ['profile', 'author', 'publication', 'genre', 'book'];
		const where = types.filter((i) => {
			return req.path.includes(i);
		});

		let path = 'images/' + where[0];
		if (!fs.existsSync(path)) {
			fs.mkdirSync(path);
		}

		cb(null, path);
	},
	filename: (req, file, cb) => {
		cb(
			null,
			new Date().toISOString().replace(/:/g, '-') +
				'-' +
				file.originalname
		);
	},
});

const fileFilter = (req, file, cb) => {
	if (
		file.mimetype == 'image/png' ||
		file.mimetype == 'image/jpg' ||
		file.mimetype == 'image/jls' ||
		file.mimetype == 'image/jp2' ||
		file.mimetype == 'image/jpx' ||
		file.mimetype == 'image/tiff' ||
		file.mimetype == 'image/jpeg'
	) {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

exports.single = multer({
	storage: fileStorage,
	fileFilter: fileFilter,
}).single('image');

exports.multiple = multer({
	storage: fileStorage,
	fileFilter: fileFilter,
}).array('multi-files', 10);
