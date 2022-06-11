const fs = require('fs');
const path = require('path');
const { nextTick } = require('process');

exports.deleteFile = (filePath, cb) => {
	const fullPath = path.join(__dirname, '../', filePath);
	try {
		fs.unlinkSync(fullPath, (err) => {
			if (err) {
				console.log('Something Went Wrong Deleting File');
			}
		});
	} catch (err) {
		return 0;
	}
};

exports.deleteMultipleFiles = (files) =>
{
	if (files?.length > 0) {
		files.forEach((image) => {
			this.deleteFile(image.path);
		});
	}
}
