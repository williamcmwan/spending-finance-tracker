import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { getRow, runQuery } from '../database/init.js';

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  // Configure Google OAuth Strategy
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await getRow('SELECT * FROM users WHERE google_id = ?', [profile.id]);
        
        if (!user) {
          // Check if user exists with same email
          user = await getRow('SELECT * FROM users WHERE email = ?', [profile.emails[0].value]);
          
          if (user) {
            // Update existing user with Google ID
            await runQuery(
              'UPDATE users SET google_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
              [profile.id, user.id]
            );
          } else {
            // Create new user
            const result = await runQuery(
              'INSERT INTO users (email, name, google_id, password) VALUES (?, ?, ?, ?)',
              [
                profile.emails[0].value,
                profile.displayName,
                profile.id,
                'google_oauth_user' // Placeholder password for OAuth users
              ]
            );
            
            user = await getRow('SELECT * FROM users WHERE id = ?', [result.id]);
          }
        }
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  ));
  
  console.log('✅ Google OAuth configured successfully');
} else {
  console.log('⚠️  Google OAuth not configured - skipping Google login');
  console.log('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google OAuth');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getRow('SELECT * FROM users WHERE id = ?', [id]);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
