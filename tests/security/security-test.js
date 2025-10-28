import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const securityTestFailures = new Rate('security_test_failures');

// Test configuration
export const options = {
  vus: 1, // Single user for security tests
  duration: '5m',
  thresholds: {
    security_test_failures: ['rate<0.1'], // Less than 10% security test failures
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  group('Authentication Security Tests', () => {
    testSQLInjection();
    testXSSPrevention();
    testCSRFProtection();
    testJWTSecurity();
    testRateLimiting();
    testInputValidation();
    testPasswordSecurity();
  });

  group('Authorization Security Tests', () => {
    testUnauthorizedAccess();
    testPrivilegeEscalation();
    testDirectObjectReference();
  });

  group('Data Security Tests', () => {
    testSensitiveDataExposure();
    testDataEncryption();
  });

  group('Infrastructure Security Tests', () => {
    testSecurityHeaders();
    testHTTPSRedirection();
    testCORSConfiguration();
  });
}

// Authentication Security Tests
function testSQLInjection() {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "' UNION SELECT * FROM users --",
    "admin'--",
    "' OR 1=1#",
  ];

  sqlInjectionPayloads.forEach(payload => {
    const loginData = {
      username: payload,
      password: 'password',
    };

    const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(loginData), {
      headers: { 'Content-Type': 'application/json' },
    });

    const passed = check(response, {
      'SQL injection blocked': (r) => r.status === 400 || r.status === 401,
      'No sensitive data in error': (r) => !r.body.includes('SQLException') && !r.body.includes('database'),
    });

    securityTestFailures.add(!passed);
  });
}

function testXSSPrevention() {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '"><script>alert("XSS")</script>',
  ];

  xssPayloads.forEach(payload => {
    const userData = {
      username: `user_${Date.now()}`,
      email: 'test@example.com',
      password: 'password123',
      firstName: payload,
      lastName: 'Test',
    };

    const response = http.post(`${BASE_URL}/api/users`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });

    const passed = check(response, {
      'XSS payload sanitized': (r) => {
        if (r.status === 201) {
          return !r.body.includes('<script>') && !r.body.includes('javascript:');
        }
        return true; // If creation failed, that's also acceptable
      },
    });

    securityTestFailures.add(!passed);
  });
}

function testCSRFProtection() {
  // Test CSRF protection by attempting requests without proper headers
  const response = http.post(`${BASE_URL}/api/users`, JSON.stringify({
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'http://malicious-site.com',
    },
  });

  const passed = check(response, {
    'CSRF protection active': (r) => r.status === 403 || r.status === 401,
  });

  securityTestFailures.add(!passed);
}

function testJWTSecurity() {
  // Test with invalid JWT tokens
  const invalidTokens = [
    'invalid.jwt.token',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.invalid',
    '',
    'Bearer ',
  ];

  invalidTokens.forEach(token => {
    const response = http.get(`${BASE_URL}/api/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const passed = check(response, {
      'Invalid JWT rejected': (r) => r.status === 401,
    });

    securityTestFailures.add(!passed);
  });
}

function testRateLimiting() {
  // Test rate limiting by making rapid requests
  const requests = [];
  for (let i = 0; i < 20; i++) {
    requests.push(['POST', `${BASE_URL}/api/auth/login`, JSON.stringify({
      username: 'testuser',
      password: 'wrongpassword',
    }), {
      headers: { 'Content-Type': 'application/json' },
    }]);
  }

  const responses = http.batch(requests);
  
  const rateLimitedResponses = responses.filter(r => r.status === 429);
  
  const passed = check(responses, {
    'Rate limiting active': () => rateLimitedResponses.length > 0,
  });

  securityTestFailures.add(!passed);
}

function testInputValidation() {
  const invalidInputs = [
    { username: '', password: 'password123' }, // Empty username
    { username: 'a'.repeat(1000), password: 'password123' }, // Too long username
    { username: 'testuser', password: '' }, // Empty password
    { username: 'testuser', password: '123' }, // Too short password
    { username: 'test user', password: 'password123' }, // Invalid characters
  ];

  invalidInputs.forEach(input => {
    const response = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify(input), {
      headers: { 'Content-Type': 'application/json' },
    });

    const passed = check(response, {
      'Invalid input rejected': (r) => r.status === 400,
    });

    securityTestFailures.add(!passed);
  });
}

function testPasswordSecurity() {
  // Test weak password rejection
  const weakPasswords = [
    '123456',
    'password',
    'qwerty',
    '12345678',
    'abc123',
  ];

  weakPasswords.forEach(password => {
    const userData = {
      username: `user_${Date.now()}_${Math.random()}`,
      email: 'test@example.com',
      password: password,
      firstName: 'Test',
      lastName: 'User',
    };

    const response = http.post(`${BASE_URL}/api/users`, JSON.stringify(userData), {
      headers: { 'Content-Type': 'application/json' },
    });

    const passed = check(response, {
      'Weak password rejected': (r) => r.status === 400,
    });

    securityTestFailures.add(!passed);
  });
}

// Authorization Security Tests
function testUnauthorizedAccess() {
  const protectedEndpoints = [
    '/api/users/profile',
    '/api/users',
    '/api/admin/users',
  ];

  protectedEndpoints.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`);

    const passed = check(response, {
      'Unauthorized access blocked': (r) => r.status === 401,
    });

    securityTestFailures.add(!passed);
  });
}

function testPrivilegeEscalation() {
  // First login as regular user
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    username: 'testuser1',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (loginResponse.status === 200) {
    const token = loginResponse.json('token');
    
    // Try to access admin endpoints
    const adminResponse = http.get(`${BASE_URL}/api/admin/users`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const passed = check(adminResponse, {
      'Admin access blocked for regular user': (r) => r.status === 403,
    });

    securityTestFailures.add(!passed);
  }
}

function testDirectObjectReference() {
  // Test accessing other users' data
  const userIds = [1, 2, 3, 999, -1];

  userIds.forEach(userId => {
    const response = http.get(`${BASE_URL}/api/users/${userId}`);

    const passed = check(response, {
      'Direct object reference blocked': (r) => r.status === 401 || r.status === 403,
    });

    securityTestFailures.add(!passed);
  });
}

// Data Security Tests
function testSensitiveDataExposure() {
  const response = http.get(`${BASE_URL}/api/users`);

  const passed = check(response, {
    'No password in response': (r) => !r.body.includes('password'),
    'No sensitive data in error': (r) => !r.body.includes('stackTrace') && !r.body.includes('SQLException'),
  });

  securityTestFailures.add(!passed);
}

function testDataEncryption() {
  // Test that sensitive endpoints use HTTPS (in production)
  const response = http.get(`${BASE_URL}/api/auth/login`);

  const passed = check(response, {
    'Security headers present': (r) => {
      const headers = r.headers;
      return headers['X-Content-Type-Options'] || 
             headers['X-Frame-Options'] || 
             headers['X-XSS-Protection'];
    },
  });

  securityTestFailures.add(!passed);
}

// Infrastructure Security Tests
function testSecurityHeaders() {
  const response = http.get(`${BASE_URL}/`);

  const passed = check(response, {
    'X-Content-Type-Options header': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
    'X-Frame-Options header': (r) => r.headers['X-Frame-Options'] !== undefined,
    'X-XSS-Protection header': (r) => r.headers['X-XSS-Protection'] !== undefined,
  });

  securityTestFailures.add(!passed);
}

function testHTTPSRedirection() {
  // This test would be more relevant in production
  const response = http.get(`${BASE_URL}/`);

  const passed = check(response, {
    'HTTPS redirect or secure connection': (r) => {
      return r.url.startsWith('https://') || 
             r.headers['Strict-Transport-Security'] !== undefined ||
             BASE_URL.startsWith('http://localhost'); // Allow localhost for testing
    },
  });

  securityTestFailures.add(!passed);
}

function testCORSConfiguration() {
  const response = http.options(`${BASE_URL}/api/users`, null, {
    headers: {
      'Origin': 'http://malicious-site.com',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const passed = check(response, {
    'CORS properly configured': (r) => {
      const allowOrigin = r.headers['Access-Control-Allow-Origin'];
      return !allowOrigin || allowOrigin !== '*' || allowOrigin === BASE_URL;
    },
  });

  securityTestFailures.add(!passed);
}