const test = require('node:test');
const assert = require('node:assert/strict');
const { GoogleAuthError, findOrCreateGoogleCitizen, verifyGoogleCredential } = require('../services/googleAuth');

const profile = { googleId: 'google-subject-1', email: 'citizen@example.com', name: 'Asha Devi' };

function createUserModel(initialUsers = []) {
  const users = initialUsers;
  class FakeUser {
    constructor(values) {
      Object.assign(this, values);
      this._id = `user-${users.length + 1}`;
    }

    async save() {
      const duplicate = users.find((user) => user.email === this.email || (this.googleId && user.googleId === this.googleId));
      if (duplicate && duplicate !== this) {
        const error = new Error('Duplicate key');
        error.code = 11000;
        throw error;
      }
      if (!users.includes(this)) users.push(this);
      return this;
    }

    static async findOne(query) {
      if (query.$or) {
        return users.find((user) => query.$or.some((condition) => Object.entries(condition).every(([key, value]) => user[key] === value))) || null;
      }
      const [key, value] = Object.entries(query)[0];
      return users.find((user) => user[key] === value) || null;
    }
  }
  return { FakeUser, users };
}

test('verifies a Google credential against the configured client and requires verified email', async () => {
  class FakeOAuth2Client {
    constructor(clientId) {
      assert.equal(clientId, 'client-id');
    }

    async verifyIdToken({ idToken, audience }) {
      assert.equal(idToken, 'valid-token');
      assert.equal(audience, 'client-id');
      return { getPayload: () => ({ sub: 'subject', email: 'CITIZEN@example.com', email_verified: true, name: 'Citizen' }) };
    }
  }

  const result = await verifyGoogleCredential('valid-token', { clientId: 'client-id', OAuth2Client: FakeOAuth2Client });
  assert.deepEqual(result, { googleId: 'subject', email: 'citizen@example.com', name: 'Citizen' });

  class UnverifiedOAuth2Client {
    async verifyIdToken() {
      return { getPayload: () => ({ sub: 'subject', email: 'citizen@example.com', email_verified: false, name: 'Citizen' }) };
    }
  }
  await assert.rejects(
    verifyGoogleCredential('valid-token', { clientId: 'client-id', OAuth2Client: UnverifiedOAuth2Client }),
    { statusCode: 401 }
  );
});

test('refuses Google sign-in for an administrator account', async () => {
  const admin = { _id: 'admin-1', email: profile.email, role: 'admin' };
  const { FakeUser } = createUserModel([admin]);
  await assert.rejects(findOrCreateGoogleCitizen(profile, FakeUser), { statusCode: 403 });
});

test('links a verified Google identity to an existing citizen by email', async () => {
  const citizen = { _id: 'citizen-1', email: profile.email, role: 'citizen', save: async () => {} };
  const { FakeUser } = createUserModel([citizen]);
  const user = await findOrCreateGoogleCitizen(profile, FakeUser);
  assert.equal(user, citizen);
  assert.equal(user.googleId, profile.googleId);
});

test('creates a new citizen account without a password for Google sign-in', async () => {
  const { FakeUser, users } = createUserModel();
  const user = await findOrCreateGoogleCitizen(profile, FakeUser);
  assert.equal(users.length, 1);
  assert.equal(user.role, 'citizen');
  assert.equal(user.email, profile.email);
  assert.equal(user.googleId, profile.googleId);
  assert.equal(user.password, undefined);
});

test('does not silently relink a citizen already associated with another Google account', async () => {
  const citizen = { email: profile.email, role: 'citizen', googleId: 'different-google-subject' };
  const { FakeUser } = createUserModel([citizen]);
  await assert.rejects(
    findOrCreateGoogleCitizen(profile, FakeUser),
    (error) => error instanceof GoogleAuthError && error.statusCode === 409
  );
});
