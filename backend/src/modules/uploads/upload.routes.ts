import { Router } from 'express';
import { upload } from '../../shared/multer.config';

const router = Router();

// Multi-upload for vehicle photos
router.post('/vehicles', upload.array('photos', 5) as any, (req: any, res: any) => {
  try {
    // Use any[] to avoid "Cannot find namespace 'Express'" if Multer types are not globally registered
    const files = req.files as any[];
    if (!files) return res.status(400).json({ error: 'No files uploaded' });
    
    const urls = files.map(file => `/uploads/vehicles/${file.filename}`);
    res.json({ urls });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Single upload for driver document
router.post('/drivers', upload.single('document') as any, (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/drivers/${req.file.filename}`;
    res.json({ url });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;