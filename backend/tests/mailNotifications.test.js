const test = require('node:test');
const assert = require('node:assert/strict');
const { getSmtpConfig, getPortalUrl } = require('../services/mailNotifications');

test('reports email as not configured when SMTP settings are absent', () => {
  assert.deepEqual(getSmtpConfig({}), { status: 'not-configured' });
});

test('rejects incomplete or invalid SMTP settings', () => {
  assert.equal(getSmtpConfig({ SMTP_HOST: 'mail.example.com' }).status, 'misconfigured');
  assert.equal(getSmtpConfig({
    SMTP_HOST: 'mail.example.com',
    SMTP_USER: 'sender@example.com',
    SMTP_PASS: 'secret',
    SMTP_PORT: 'not-a-port'
  }).status, 'misconfigured');
  assert.equal(getSmtpConfig({
    SMTP_HOST: 'mail.example.com',
    SMTP_USER: 'sender@example.com',
    SMTP_PASS: 'secret',
    SMTP_SECURE: 'sometimes'
  }).status, 'misconfigured');
});

test('uses secure transport by default on port 465', () => {
  const config = getSmtpConfig({
    SMTP_HOST: 'mail.example.com',
    SMTP_USER: 'sender@example.com',
    SMTP_PASS: 'secret',
    SMTP_PORT: '465'
  });
  assert.equal(config.status, 'configured');
  assert.equal(config.secure, true);
  assert.equal(config.from, 'sender@example.com');
});

test('uses the first allowed frontend URL for email links', () => {
  assert.equal(getPortalUrl({ FRONTEND_URLS: 'https://portal.example, http://localhost:3000' }), 'https://portal.example');
});
