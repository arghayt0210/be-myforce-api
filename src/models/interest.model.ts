import mongoose, { Document } from 'mongoose';

// Interface for Interest document
interface IInterest extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const interestSchema = new mongoose.Schema<IInterest>(
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
  { timestamps: true },
);

const Interest = mongoose.model<IInterest>('Interest', interestSchema);

export default Interest;
