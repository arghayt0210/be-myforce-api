import multer from 'multer';
import { Request } from 'express';
import { ErrorHandler } from '@/helpers/error';

const storage = multer.memoryStorage();

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
  isMultiple = false,
) => {
  if (isMultiple) {
    // For multiple uploads - allow both images and videos
    if ([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ErrorHandler(400, 'Only image and video files are allowed'));
    }
  } else {
    // For single uploads - allow only images
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ErrorHandler(400, 'Only image files are allowed'));
    }
  }
};

// Single image upload (e.g., profile pictures)
export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => fileFilter(req, file, cb, false),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Multiple files upload (images and videos)
export const uploadMultiple = multer({
  storage,
  fileFilter: (req, file, cb) => fileFilter(req, file, cb, true),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
    files: 10, // Maximum 10 files
  },
});
