const { Router } = require('express');
const { formidable } = require('formidable');
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');

const router = Router();

// regex simple et suffisante pour un contrôle côté serveur
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/upload', (req, res) => {
  const form = formidable({
    keepExtensions: true,
    multiples: false,
    maxFileSize: 10 * 1024 * 1024 // 10MB
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(400).json({ success: false, message: "Upload error" });
    }

    try {
      const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
      const password = Array.isArray(fields.password) ? fields.password[0] : fields.password;
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      const errors = {};

      if (!email || !email.trim()) {
        errors.email = "L'adresse e-mail est obligatoire";
      } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.email = "L'adresse e-mail n'est pas valide";
      }

      if (!password || !password.trim()) {
        errors.password = "Le mot de passe est obligatoire";
      }

      if (!file) {
        errors.file = "Aucun fichier uploadé";
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const uploadDir = path.join(__dirname, 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const ext = path.extname(file.originalFilename || '');
      const newName = `${Date.now()}${ext}`;
      const newPath = path.join(uploadDir, newName);

      await fs.rename(file.filepath, newPath);

      return res.json({
        success: true,
        email: email.trim(),
        passwordHash: hashedPassword,
        file: newName
      });

    } catch (e) {
      console.error(e);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  });
});

module.exports = router;