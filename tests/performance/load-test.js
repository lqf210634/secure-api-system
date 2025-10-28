import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const requestCount = new Counter('request_count');

// Test configuration
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 },   // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 },   // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 },   // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 },   // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },  // Stay at 100 users for 5 minutes
    // Ramp down
    { duration: '2m', target: 0 },    // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.05'],   // Error rate should be below 5%
    error_rate: ['rate<0.05'],        // Custom error rate should be below 5%
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const API_URL = __ENV.API_URL || 'http://localhost:8080';

// Test data
const testUsers = [
  { username: 'testuser1', password: 'password123' },
  { username: 'testuser2', password: 'password123' },
  { username: 'testuser3', password: 'password123' },
];

let authToken = '';

// Setup function - runs once before the test
export function setup() {
  console.log('Setting up performance test...');
  
  // Health check
  const healthResponse = http.get(`${API_URL}/actuator/health`);
  if (healthResponse.status !== 200) {
    throw new Error('Application is not healthy');
  }
  
  console.log('Application is healthy, starting test...');
  return { baseUrl: BASE_URL, apiUrl: API_URL };
}

// Main test function
export default function (data) {
  const { baseUrl, apiUrl } = data;
  
  // Test scenarios with different weights
  const scenarios = [
    { name: 'login', weight: 20 },
    { name: 'getUserProfile', weight: 30 },
    { name: 'getUsers', weight: 25 },
    { name: 'createUser', weight: 10 },
    { name: 'updateUser', weight: 10 },
    { name: 'healthCheck', weight: 5 },
  ];
  
  // Select scenario based on weight
  const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
  const random = Math.random() * totalWeight;
  let currentWeight = 0;
  let selectedScenario = scenarios[0];
  
  for (const scenario of scenarios) {
    currentWeight += scenario.weight;
    if (random <= currentWeight) {
      selectedScenario = scenario;
      break;
    }
  }
  
  // Execute selected scenario
  switch (selectedScenario.name) {
    case 'login':
      testLogin(apiUrl);
      break;
    case 'getUserProfile':
      testGetUserProfile(apiUrl);
      break;
    case 'getUsers':
      testGetUsers(apiUrl);
      break;
    case 'createUser':
      testCreateUser(apiUrl);
      break;
    case 'updateUser':
      testUpdateUser(apiUrl);
      break;
    case 'healthCheck':
      testHealthCheck(apiUrl);
      break;
  }
  
  // Random sleep between 1-3 seconds
  sleep(Math.random() * 2 + 1);
}

// Test scenarios
function testLogin(apiUrl) {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  const loginPayload = {
    username: user.username,
    password: user.password,
  };
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${apiUrl}/api/auth/login`, JSON.stringify(loginPayload), params);
  
  const success = check(response, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => r.json('token') !== undefined,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  if (success && response.json('token')) {
    authToken = response.json('token');
  }
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testGetUserProfile(apiUrl) {
  if (!authToken) {
    // Get token first
    testLogin(apiUrl);
    if (!authToken) return;
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${apiUrl}/api/users/profile`, params);
  
  const success = check(response, {
    'get profile status is 200': (r) => r.status === 200,
    'get profile has user data': (r) => r.json('username') !== undefined,
    'get profile response time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testGetUsers(apiUrl) {
  if (!authToken) {
    testLogin(apiUrl);
    if (!authToken) return;
  }
  
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${apiUrl}/api/users?page=0&size=10`, params);
  
  const success = check(response, {
    'get users status is 200': (r) => r.status === 200,
    'get users has content': (r) => r.json('content') !== undefined,
    'get users response time < 400ms': (r) => r.timings.duration < 400,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testCreateUser(apiUrl) {
  if (!authToken) {
    testLogin(apiUrl);
    if (!authToken) return;
  }
  
  const newUser = {
    username: `testuser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    email: `test_${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
  };
  
  const params = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${apiUrl}/api/users`, JSON.stringify(newUser), params);
  
  const success = check(response, {
    'create user status is 201': (r) => r.status === 201,
    'create user has id': (r) => r.json('id') !== undefined,
    'create user response time < 600ms': (r) => r.timings.duration < 600,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testUpdateUser(apiUrl) {
  if (!authToken) {
    testLogin(apiUrl);
    if (!authToken) return;
  }
  
  // First get user profile to get user ID
  const profileParams = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
  };
  
  const profileResponse = http.get(`${apiUrl}/api/users/profile`, profileParams);
  
  if (profileResponse.status !== 200) {
    errorRate.add(true);
    return;
  }
  
  const userId = profileResponse.json('id');
  const updateData = {
    firstName: `Updated_${Date.now()}`,
    lastName: 'User',
  };
  
  const response = http.put(`${apiUrl}/api/users/${userId}`, JSON.stringify(updateData), profileParams);
  
  const success = check(response, {
    'update user status is 200': (r) => r.status === 200,
    'update user response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

function testHealthCheck(apiUrl) {
  const response = http.get(`${apiUrl}/actuator/health`);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Performance test completed');
  console.log(`Base URL: ${data.baseUrl}`);
  console.log(`API URL: ${data.apiUrl}`);
}