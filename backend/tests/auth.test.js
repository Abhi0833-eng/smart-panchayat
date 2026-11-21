const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { verifyToken, requireRole } = require('../middleware/auth');

process.env.JWT_SECRET = 'test-secret-for-auth-middleware';

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

test('rejects requests without an authentication token', () => {
  const response = createResponse();
  verifyToken({ header: () => undefined }, response, () => assert.fail('next should not be called'));
  assert.equal(response.statusCode, 401);
});

test('accepts a bearer token and attaches the signed role', () => {
  const response = createResponse();
  const token = jwt.sign({ userId: 'citizen-1', role: 'citizen' }, process.env.JWT_SECRET);
  let nextCalled = false;
  verifyToken({ header: () => `Bearer ${token}` }, response, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('rejects a token signed with a different secret', () => {
  const response = createResponse();
  const token = jwt.sign({ userId: 'citizen-1', role: 'citizen' }, 'wrong-secret');
  verifyToken({ header: () => token }, response, () => assert.fail('next should not be called'));
  assert.equal(response.statusCode, 401);
});

test('blocks a citizen from an admin-only action', () => {
  const response = createResponse();
  let nextCalled = false;
  requireRole('admin')({ user: { role: 'citizen' } }, response, () => { nextCalled = true; });
  assert.equal(response.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('allows an admin to perform an admin-only action', () => {
  const response = createResponse();
  let nextCalled = false;
  requireRole('admin')({ user: { role: 'admin' } }, response, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
