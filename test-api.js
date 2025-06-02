// Simple test script to check API connectivity
const API_BASE = 'https://e2425-wads-l4ccg2-server.csbihub.id';

// Test basic connectivity
fetch(`${API_BASE}/health`)
  .then(response => {
    console.log('Health check status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Health check response:', data);
  })
  .catch(error => {
    console.error('Health check error:', error);
  });

// Test API test endpoint
fetch(`${API_BASE}/api/test`)
  .then(response => {
    console.log('API test status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('API test response:', data);
  })
  .catch(error => {
    console.error('API test error:', error);
  });

// Test CORS preflight
fetch(`${API_BASE}/api/tickets`, {
  method: 'OPTIONS',
  headers: {
    'Origin': 'https://e2425-wads-l4ccg2-client.csbihub.id',
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type, Authorization'
  }
})
.then(response => {
  console.log('CORS preflight status:', response.status);
  console.log('CORS headers:', response.headers);
})
.catch(error => {
  console.error('CORS preflight error:', error);
});

console.log('API connectivity tests started...'); 