import multer from 'multer';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subfolder = file.fieldname === 'photos' ? 'vehicles' : 'drivers';
        cb(null, path.join(__dirname, '../../public/uploads', subfolder));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${uuid()}${ext}`);
    }
});
// File validation
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Formato no válido. Solo JPG y PNG.'), false);
    }
};
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 8 * 1024 * 1024 // 8MB limit
    }
});
//# sourceMappingURL=multer.config.js.map