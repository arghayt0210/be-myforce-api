import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema(
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

const Asset = mongoose.model('Asset', assetSchema);

export default Asset;
