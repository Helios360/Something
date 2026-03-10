const fs = require('fs').promises;
const path = require('path');

async function deleteOldUploads() {
  const uploadDir = path.join(__dirname, 'uploads');
  const maxAgeMs = 24 * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(uploadDir);
    const now = Date.now();

    for (const fileName of files) {
      const filePath = path.join(uploadDir, fileName);

      try {
        const stats = await fs.stat(filePath);

        if (!stats.isFile()) {
          continue;
        }

        const age = now - stats.mtimeMs;

        if (age > maxAgeMs) {
          await fs.unlink(filePath);
          console.log('Fichier supprimé :', fileName);
        }
      } catch (err) {
        console.error('Erreur sur le fichier', fileName, err);
      }
    }
  } catch (err) {
    console.error('Erreur lecture dossier uploads :', err);
  }
}

module.exports = deleteOldUploads;