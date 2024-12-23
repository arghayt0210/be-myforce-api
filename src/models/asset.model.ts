import mongoose, { Document } from 'mongoose';

// Define asset type and related model type enums
type AssetType = 'image' | 'video';
type RelatedModelType = 'Achievement' | 'User';

// Interface for Asset document
interface IAsset extends Document {
  user?: mongoose.Types.ObjectId;
  url: string;
  public_id: string;
  asset_type: AssetType;
  related_model: RelatedModelType;
  related_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const assetSchema = new mongoose.Schema<IAsset>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    url: {
      type: String,
      required: true,
    },
    public_id: {
      type: String,
      required: true,
    },
    asset_type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },
    related_model: {
      type: String,
      enum: ['Achievement', 'User'],
      required: true,
    },
    related_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true },
);

const Asset = mongoose.model<IAsset>('Asset', assetSchema);

export default Asset;
