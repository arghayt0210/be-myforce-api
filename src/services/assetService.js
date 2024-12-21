import Asset from '@models/assetModel';
import {
  singleFileUpload,
  multiFileUpload,
  deleteSingleUpload,
  deleteMultipleUpload,
} from '@utils/cloudinaryUtil';

import logger from '@config/logger';

export const createAsset = async (file, userId, relatedModel, relatedId, folder) => {
  try {
    // Check if file exists
    if (!file) {
      throw new Error('No file provided');
    }
    // Upload to cloudinary
    const uploadResult = await singleFileUpload(file, folder);

    // Create asset record
    const asset = await Asset.create({
      user: userId,
      url: uploadResult.url,
      public_id: uploadResult.public_id,
      asset_type: file.mimetype.startsWith('image/') ? 'image' : 'video',
      related_model: relatedModel,
      related_id: relatedId,
    });
    return asset;
  } catch (error) {
    logger.error('Asset creation error:', error);
    throw error;
  }
};

export const createMultipleAssets = async (files, userId, relatedModel, relatedId, folder) => {
  try {
    const uploadResults = await multiFileUpload(files, folder);
    const assets = await Asset.insertMany(
      uploadResults.map((result) => ({
        user: userId,
        url: result.url,
        public_id: result.public_id,
        asset_type: result.asset_type,
        related_model: relatedModel,
        related_id: relatedId,
      })),
    );
    return assets;
  } catch (error) {
    logger.error('Multiple assets creation error:', error);
    throw error;
  }
};

export const deleteAsset = async (assetId) => {
  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    await deleteSingleUpload(asset.public_id);
    await asset.deleteOne();
    return { message: 'Asset deleted successfully' };
  } catch (error) {
    logger.error('Asset deletion error:', error);
    throw error;
  }
};

export const deleteUserAssets = async (userId) => {
  try {
    const assets = await Asset.find({ user: userId });
    if (assets.length === 0) return;
    const public_ids = assets.map((asset) => asset.public_id);
    await deleteMultipleUpload(public_ids);
    await Asset.deleteMany({ user: userId });
    return { message: 'All user assets deleted successfully' };
  } catch (error) {
    logger.error('User assets deletion error:', error);
    throw error;
  }
};
