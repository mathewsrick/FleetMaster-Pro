import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';

const getUploadPath = (folder: 'drivers' | 'vehicles') => {
  const uploadPath = path.join(
    process.cwd(),
    'backend',
    'public',
    'uploads',
    folder
  );

  // crear carpeta si no existe
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder =
      file.fieldname === 'documents' ? 'drivers' : 'vehicles';

    const uploadPath = getUploadPath(folder);
    cb(null, uploadPath);
  },

  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuid()}${ext}`);
  }
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error('Formato de archivo no permitido. Solo JPG, JPEG y PNG.')
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024 // 8MB
  }
});