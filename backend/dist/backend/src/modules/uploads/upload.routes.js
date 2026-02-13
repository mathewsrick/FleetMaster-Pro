import { Router } from 'express';
import { upload } from '../../shared/multer.config';
const router = Router();
// Multi-upload for vehicle photos
router.post('/vehicles', upload.array('photos', 5), (req, res) => {
    try {
        const files = req.files;
        if (!files)
            return res.status(400).json({ error: 'No files uploaded' });
        // Devolvemos la ruta incluyendo /public para que el frontend la concatene con /api
        const urls = files.map(file => `/api/public/uploads/vehicles/${file.filename}`);
        res.json({ urls });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Single upload for driver document
router.post('/drivers', upload.single('document'), (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' });
        // Devolvemos la ruta incluyendo /public
        const url = `/api/public/uploads/drivers/${req.file.filename}`;
        res.json({ url });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=upload.routes.js.map