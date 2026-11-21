const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');

class GoogleAuthError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function verifyGoogleCredential(idToken, options = {}) {
  const clientId = options.clientId || process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new GoogleAuthError('Google sign-in is not configured on the server.', 503);
  }
  if (typeof idToken !== 'string' || !idToken || idToken.length > 10000) {
    throw new GoogleAuthError('A valid Google credential is required.', 400);
  }

  try {
    const Client = options.OAuth2Client || OAuth2Client;
    const ticket = await new Client(clientId).verifyIdToken({ idToken, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.sub || !payload.email || payload.email_verified !== true || !payload.name) {
      throw new GoogleAuthError('Google must provide a verified email address and profile.', 401);
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name.trim()
    };
  } catch (error) {
    if (error instanceof GoogleAuthError) throw error;
    throw new GoogleAuthError('Google sign-in could not be verified.', 401);
  }
}

async function findOrCreateGoogleCitizen(profile, UserModel = User) {
  let user = await UserModel.findOne({ googleId: profile.googleId });
  if (user) {
    if (user.role !== 'citizen') {
      throw new GoogleAuthError('Google sign-in is only available to citizen accounts.', 403);
    }
    return user;
  }

  user = await UserModel.findOne({ email: profile.email });
  if (user) {
    if (user.role !== 'citizen') {
      throw new GoogleAuthError('Google sign-in is only available to citizen accounts.', 403);
    }
    if (user.googleId && user.googleId !== profile.googleId) {
      throw new GoogleAuthError('This email is already linked to a different Google account.', 409);
    }
    if (!user.googleId) {
      user.googleId = profile.googleId;
      await user.save();
    }
    return user;
  }

  try {
    return await new UserModel({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      role: 'citizen'
    }).save();
  } catch (error) {
    if (error.code !== 11000) throw error;

    user = await UserModel.findOne({
      $or: [{ email: profile.email }, { googleId: profile.googleId }]
    });
    if (user?.role === 'citizen' && (!user.googleId || user.googleId === profile.googleId)) {
      if (!user.googleId) {
        user.googleId = profile.googleId;
        await user.save();
      }
      return user;
    }
    if (user?.role === 'admin') {
      throw new GoogleAuthError('Google sign-in is only available to citizen accounts.', 403);
    }
    throw new GoogleAuthError('This email is already linked to a different Google account.', 409);
  }
}

module.exports = { GoogleAuthError, findOrCreateGoogleCitizen, verifyGoogleCredential };
