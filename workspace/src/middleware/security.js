const SecureAuth = require('secureauth-sdk');

/**
 * Banking Security Middleware
 * Integrates SecureAuth AI monitoring for behavioral threat detection.
 */
function securityMiddleware(req, res, next) {
  const monitor = new SecureAuth({
    platformId: '75f2dd70-c5b6-4283-87b3-ec391d4cdc38',
    clientId: 'client_2rnufsdhx'
  });

  const user_id = req.user?.id || 'anonymous';
  const behavioral_data = {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  };

  // Track the login attempt
  monitor.trackEvent(user_id, 'LOG_ATTEMPT', behavioral_data);

  console.log(`[SecureAuth] Event tracked for user: ${user_id}`);
  
  next();
}

module.exports = securityMiddleware;
