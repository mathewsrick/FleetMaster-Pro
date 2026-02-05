import { Router } from 'express';
import { upload } from '../../shared/multer.config';

const router = Router();

// Carga múltiple para vehículos
// Fix: Use 'as any' on multer middleware to bypass TypeScript type compatibility issues between different versions of Express/Multer types
router.post('/vehicles', upload.array('photos', 5) as any, (req: any, res: any) => {
  try {
    const files = req.files as Express.Multer.File[];
    const urls = files.map(file => `/uploads/vehicles/${file.filename}`);
    res.json({ urls });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Carga única para documentos de conductores
// Fix: Use 'as any' on multer middleware to bypass TypeScript type compatibility issues between different versions of Express/Multer types
router.post('/drivers', upload.single('document') as any, (req: any, res: any) => {
  try {
    if (!req.file) throw new Error('No se recibió ningún archivo');
    const url = `/uploads/drivers/${req.file.filename}`;
    res.json({ url });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;