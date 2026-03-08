const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Colors API', () => {
  test('GET /api/colors/next should return random RGB color', async () => {
    const response = await request(API_URL).get('/api/colors/next');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rgb_r');
    expect(response.body).toHaveProperty('rgb_g');
    expect(response.body).toHaveProperty('rgb_b');
    expect(response.body).toHaveProperty('hex');

    // Validate RGB range
    expect(response.body.rgb_r).toBeGreaterThanOrEqual(0);
    expect(response.body.rgb_r).toBeLessThanOrEqual(255);
    expect(response.body.rgb_g).toBeGreaterThanOrEqual(0);
    expect(response.body.rgb_g).toBeLessThanOrEqual(255);
    expect(response.body.rgb_b).toBeGreaterThanOrEqual(0);
    expect(response.body.rgb_b).toBeLessThanOrEqual(255);

    // Validate hex format
    expect(response.body.hex).toMatch(/^#[0-9A-F]{6}$/i);
  });

  test('Multiple calls to /api/colors/next should return different colors', async () => {
    const response1 = await request(API_URL).get('/api/colors/next');
    const response2 = await request(API_URL).get('/api/colors/next');

    // Very unlikely to get the same random color twice
    const isDifferent =
      response1.body.rgb_r !== response2.body.rgb_r ||
      response1.body.rgb_g !== response2.body.rgb_g ||
      response1.body.rgb_b !== response2.body.rgb_b;

    expect(isDifferent).toBe(true);
  });
});
