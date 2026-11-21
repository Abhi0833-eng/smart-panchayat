const nodemailer = require('nodemailer');

function getSmtpConfig(environment = process.env) {
  const credentials = [environment.SMTP_HOST, environment.SMTP_USER, environment.SMTP_PASS];
  if (credentials.every((value) => !value)) {
    return { status: 'not-configured' };
  }
  if (credentials.some((value) => !value)) {
    return { status: 'misconfigured' };
  }

  const secureValue = String(environment.SMTP_SECURE || '').trim().toLowerCase();
  if (secureValue && !['true', 'false'].includes(secureValue)) {
    return { status: 'misconfigured' };
  }
  const secure = secureValue === 'true';
  const port = Number(environment.SMTP_PORT || (secure ? 465 : 587));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { status: 'misconfigured' };
  }

  return {
    status: 'configured',
    host: environment.SMTP_HOST.trim(),
    port,
    secure: environment.SMTP_SECURE
      ? secure
      : port === 465,
    user: environment.SMTP_USER.trim(),
    pass: environment.SMTP_PASS,
    from: (environment.EMAIL_FROM || environment.SMTP_USER).trim()
  };
}

function getPortalUrl(environment = process.env) {
  const configuredUrl = environment.PORTAL_URL
    || environment.FRONTEND_URLS
    || 'https://smart-panchayat-six.vercel.app';
  return configuredUrl.split(',')[0].trim().replace(/\/+$/, '');
}

async function sendPortalEmail(recipient, recipientRole) {
  if (!recipient) return 'no-recipient';

  const config = getSmtpConfig();
  if (config.status !== 'configured') return config.status;

  const portalUrl = getPortalUrl();
  const isAdmin = recipientRole === 'admin';
  const message = isAdmin
    ? 'A complaint needs attention in Smart Panchayat. Sign in to the administration portal to review it.'
    : 'There is a new update to a complaint in Smart Panchayat. Sign in to view the details.';

  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      disableFileAccess: true,
      disableUrlAccess: true,
      auth: { user: config.user, pass: config.pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    });

    const result = await transporter.sendMail({
      from: config.from,
      to: recipient,
      subject: isAdmin ? 'Smart Panchayat: complaint needs attention' : 'Smart Panchayat: complaint update',
      text: `${message}\n\nSign in: ${portalUrl}/login\n\nFor your privacy, complaint details are not included in this email.`
    });
    return Array.isArray(result.accepted) && result.accepted.length === 0 ? 'failed' : 'sent';
  } catch (error) {
    console.error('Email notification delivery failed:', error.message);
    return 'failed';
  }
}

module.exports = { getSmtpConfig, getPortalUrl, sendPortalEmail };
