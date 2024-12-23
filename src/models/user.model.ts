import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Interface for User methods
interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateOTP(): string;
  verifyOTP(otp: string): boolean;
  generatePasswordResetToken(): string;
  isGoogleUser(): boolean;
}

// Interface for User document
interface IUser extends Document {
  full_name: string;
  username: string;
  email: string;
  password?: string;
  profile_image?: string;
  profile_image_asset?: mongoose.Types.ObjectId;
  bio?: string;
  is_onboarded: boolean;
  user_type: 'user' | 'admin';
  interests: mongoose.Types.ObjectId[];
  google_id?: string;
  is_email_verified: boolean;
  reset_password_token?: string;
  reset_password_expires?: Date;
  otp?: string;
  otp_expires?: Date;
  last_login?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for User Model
interface IUserModel extends Model<IUser, {}, IUserMethods> {
  findByEmail(email: string): Promise<IUser | null>;
}

const userSchema = new mongoose.Schema<IUser, IUserModel, IUserMethods>(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: function(this: IUser) {
        return !this.google_id;
      },
    },
    profile_image: {
      type: String,
    },
    profile_image_asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
    bio: {
      type: String,
      maxLength: 2000,
    },
    is_onboarded: {
      type: Boolean,
      default: false,
    },
    user_type: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    interests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Interest',
      },
    ],
    google_id: String,
    is_email_verified: {
      type: Boolean,
      default: false,
    },
    reset_password_token: String,
    reset_password_expires: Date,
    otp: String,
    otp_expires: Date,
    last_login: Date,
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password!, salt);
  }
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password!);
};

userSchema.methods.generateOTP = function(): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otp_expires = new Date(Date.now() + 10 * 60 * 1000);
  return otp;
};

userSchema.methods.verifyOTP = function(otp: string): boolean {
  return this.otp === otp && Date.now() <= this.otp_expires!.getTime();
};

userSchema.methods.generatePasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.reset_password_expires = new Date(Date.now() + 30 * 60 * 1000);
  return resetToken;
};

userSchema.methods.isGoogleUser = function(): boolean {
  return Boolean(this.google_id);
};

// Statics
userSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

const User = mongoose.model<IUser, IUserModel>('User', userSchema);

export default User;