import multer from 'multer';
const storage = multer.memoryStorage();

// File filter for both images and videos
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload only images or videos.'), false);
  }
};

// Basic upload configuration
const uploadConfig = {
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for videos
  },
  fileFilter,
};

// Create multer instance with config
const upload = multer(uploadConfig);

// Export different upload middlewares for different use cases
export const uploadMiddleware = {
  // Single file uploads
  single: {
    image: upload.single('image'),
    video: upload.single('video'),
    any: upload.single('file'),
  },
  // Multiple file uploads
  multiple: {
    images: upload.array('images', 10), // Max 10 images
    videos: upload.array('videos', 5), // Max 5 videos
    mixed: upload.fields([
      { name: 'images', maxCount: 10 },
      { name: 'videos', maxCount: 5 },
    ]),
  },
};
