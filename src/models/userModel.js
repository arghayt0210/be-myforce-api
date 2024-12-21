import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema(
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
      required: function () {
        return !this.google_id; // Password is required only for local authentication
      },
    },
    profile_image: {
      type: String,
    },
    // Used when credential registration is done
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

    // Google OAuth fields
    google_id: String,

    // Email verification fields
    is_email_verified: {
      type: Boolean,
      default: false,
    },

    // Password reset fields
    reset_password_token: String,
    reset_password_expires: Date,

    // OTP fields
    otp: String,
    otp_expires: Date,

    // Timestamps
    last_login: Date,
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  },
);

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  const user = this;

  if (user.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }

  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate OTP
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  this.otp = otp;
  this.otp_expires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
  return otp;
};

// Method to verify OTP
userSchema.methods.verifyOTP = function (otp) {
  return this.otp === otp && Date.now() <= this.otp_expires;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.reset_password_expires = Date.now() + 30 * 60 * 1000; // Token expires in 30 minutes
  return resetToken;
};

userSchema.methods.isGoogleUser = function () {
  return Boolean(this.google_id);
};

const User = mongoose.model('User', userSchema);

export default User;
