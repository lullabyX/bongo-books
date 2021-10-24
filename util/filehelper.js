const fs = require('fs');
const path = require('path');

exports.deleteFile = (filePath, cb) => {
	const fullPath = path.join(__dirname, '../', filePath);
	console.log(fullPath);
	fs.unlinkSync(fullPath, (err) => {
		if (err) {
			console.log('Something Went Wrong Deleting File');
		}
	});
};
