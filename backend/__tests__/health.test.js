const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Health Endpoint', () => {
  test('GET /api/health should return status ok', async () => {
    const response = await request(API_URL).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });
});
