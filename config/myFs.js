const fs = require('fs');
const path = require('path');

exports.moveExperienceImg = (expId, file) => new Promise((resolve, reject) => {
  // Déplacer l'image dans le dossier définitif
  const folderRoot = path.join(__dirname, '..', 'uploads/experience');
  const folderDestination = path.join(folderRoot, expId);
  const newFileName = `${expId}_${file.filename}`;
  const newPath = path.join(folderDestination, newFileName);

  // Si le dossier root n'existe pas alors le créer
  if (!fs.existsSync(folderRoot)) {
    fs.mkdirSync(folderRoot);
  }

  // Si le dossier destination n'existe pas alors le créer
  if (!fs.existsSync(folderDestination)) {
    fs.mkdirSync(folderDestination);
  }

  const source = fs.createReadStream(file.path);
  const desti = fs.createWriteStream(newPath);

  source.pipe(desti);

  source.on('end', () => {
    fs.unlink(file.path, (err) => {
      resolve({ err, newFileName, newPath });
    });
  });

  source.on('error', (err) => {
    reject(err);
  });
});

exports.deleteExperienceImg = file => new Promise((resolve, reject) => {
  if (file.length > 0) {
    const filePath = `./uploads${file[0].picture}`;

    // Test si le fichier existe
    fs.stat(filePath, (err) => {
      if (err) {
        reject(err);
      }

      // Suppression de l'image dans le dossier
      fs.unlink(filePath, (err) => {
        if (err) reject(err);
        resolve('file deleted successfully');
      });
    });
  } else reject('File not found');
});
