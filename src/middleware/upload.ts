import multer from 'multer';

const ALLOWED_MIMES = new Set([
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]);

export const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const okMime = ALLOWED_MIMES.has(file.mimetype);
    const okExt = /\.(csv|xlsx|xls)$/i.test(file.originalname);
    if (okMime || okExt) return cb(null, true);
    cb(new Error('Only CSV and Excel files (.csv, .xlsx, .xls) are allowed'));
  },
});
