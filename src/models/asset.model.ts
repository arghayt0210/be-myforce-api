import mongoose, { Document, Model } from 'mongoose';

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

// Interface for Asset Model (if you need static methods later)
interface IAssetModel extends Model<IAsset> {}

const assetSchema = new mongoose.Schema<IAsset, IAssetModel>(
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
  { timestamps: true }
);

const Asset = mongoose.model<IAsset, IAssetModel>('Asset', assetSchema);

export default Asset;