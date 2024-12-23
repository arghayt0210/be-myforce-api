import cloudinary from '@config/cloudinary.config';
import logger from '@/utils/logger.util';
import { DeleteApiResponse } from 'cloudinary';

interface CloudinaryUploadResult {
  url: string;
  public_id: string;
  asset_type: string;
}

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
}

interface CloudinaryOptions {
  folder: string;
  resource_type?: 'auto' | 'image' | 'video' | 'raw';
}

/**
 * Upload a single file to Cloudinary
 */
export const singleFileUpload = async (
  file: UploadedFile,
  options: CloudinaryOptions
): Promise<CloudinaryUploadResult> => {
  try {
    if (!file?.buffer) {
      throw new Error('No file provided');
    }

    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: options.folder,
      resource_type: options.resource_type || 'auto',
    });

    return {
      url: result.secure_url,
      public_id: result.public_id,
      asset_type: result.resource_type,
    };
  } catch (error) {
    logger.error('Cloudinary single file upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 */
export const multiFileUpload = async (
  files: UploadedFile[],
  options: CloudinaryOptions
): Promise<CloudinaryUploadResult[]> => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadPromises = files.map((file) => singleFileUpload(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Cloudinary multiple files upload error:', error);
    throw error;
  }
};

/**
 * Delete a single file from Cloudinary
 */
export const deleteSingleUpload = async (
  publicId: string
): Promise<DeleteApiResponse> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw error;
  }
};

/**
 * Delete multiple files from Cloudinary
 */
export const deleteMultipleUpload = async (
  publicIds: string[]
): Promise<DeleteApiResponse> => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    logger.error('Cloudinary multiple delete error:', error);
    throw error;
  }
};