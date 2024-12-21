import cloudinary from '@config/cloudinary';
import logger from '@config/logger';

/**
 * Upload a single file to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The folder name in Cloudinary
 * @returns {Promise<Object>} Cloudinary upload response
 */
export const singleFileUpload = async (file, folder) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('No file provided');
    }
    // Convert buffer to base64
    const b64 = Buffer.from(file.buffer).toString('base64');
    const dataURI = `data:${file.mimetype};base64,${b64}`;
    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: 'auto',
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
 * @param {File[]} files - Array of files to upload
 * @param {string} folder - The folder name in Cloudinary
 * @returns {Promise<Object[]>} Array of Cloudinary upload responses
 */
export const multiFileUpload = async (files, folder) => {
  try {
    if (!Array.isArray(files) || files.length === 0) {
      throw new Error('No files provided');
    }
    const uploadPromises = files.map((file) => singleFileUpload(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error('Cloudinary multiple files upload error:', error);
    throw error;
  }
};

/**
 * Delete a single file from Cloudinary
 * @param {string} public_id - The public_id of the file to delete
 * @returns {Promise<Object>} Cloudinary deletion response
 */
export const deleteSingleUpload = async (publicId) => {
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
 * @param {string[]} public_ids - Array of public_ids to delete
 * @returns {Promise<Object>} Cloudinary deletion response
 */
export const deleteMultipleUpload = async (publicIds) => {
  try {
    const result = await cloudinary.api.delete_resources(publicIds);
    return result;
  } catch (error) {
    logger.error('Cloudinary multiple delete error:', error);
    throw error;
  }
};
