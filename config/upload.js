const multer = require('multer');
const fs = require('fs');
const path = require('path');

const profileStorage = multer.diskStorage({
  destination(req, file, cb) {
    const fileRoot = path.join(__dirname, '..', 'uploads/profile');
    const fileDestination = path.join(fileRoot, req.user._id.toString());

    // Si le dossier root n'existe pas alors le créer
    if (!fs.existsSync(fileRoot)) {
      fs.mkdirSync(fileRoot);
    }

    // Si le dossier destination n'existe pas alors le créer
    if (!fs.existsSync(fileDestination)) {
      fs.mkdirSync(fileDestination);
    }

    cb(null, fileDestination);
  },
  filename(req, file, cb) {
    let prefix = '';
    let extension = '';
    if (req.url.indexOf('profilePict') !== -1) {
      prefix = 'picture';
    } else if (req.url.indexOf('profileCover') !== -1) {
      prefix = 'cover';
    }

    extension = file.originalname.split('.').pop();

    cb(null, `${prefix}-${Date.now()}.${extension}`);
  }
});

const experienceStorage = multer.diskStorage({
  destination(req, file, cb) {
    // Mettre les fichiers dans un dossier temporaire
    const tmpFolder = path.join(__dirname, '..', 'uploads/tmp');

    // Si le dossier temporaire n'existe pas alors le créer
    if (!fs.existsSync(tmpFolder)) {
      fs.mkdirSync(tmpFolder);
    }

    cb(null, tmpFolder);
  },
  filename(req, file, cb) {
    let extension = '';

    extension = file.originalname.split('.').pop();

    cb(null, `${Date.now()}.${extension}`);
  }
});

exports.uploadProfile = multer({ storage: profileStorage });
exports.uploadExperience = multer({ storage: experienceStorage });
