import mongoose, { Document, Model } from 'mongoose';

// Interface for Interest document
interface IInterest extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for Interest Model (if you need static methods later)
interface IInterestModel extends Model<IInterest> {}

const interestSchema = new mongoose.Schema<IInterest, IInterestModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Interest = mongoose.model<IInterest, IInterestModel>('Interest', interestSchema);

export default Interest;