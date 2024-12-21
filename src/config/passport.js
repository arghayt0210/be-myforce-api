import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '@models/userModel';

export default function (passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ google_id: profile.id });

          if (user) {
            user.last_login = new Date();
            await user.save();
            return done(null, user);
          }
          user = await User.create({
            google_id: profile.id,
            email: profile.emails[0].value,
            full_name: profile.displayName,
            username: profile.emails[0].value.split('@')[0],
            profile_image: profile.photos[0].value,
            is_email_verified: true,
            last_login: new Date(),
          });
          done(null, user);
        } catch (error) {
          done(error, null);
        }
      },
    ),
  );
}
