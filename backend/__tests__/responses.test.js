const request = require('supertest');

const API_URL = process.env.API_URL || 'http://localhost:3000';

describe('Responses API', () => {
  let agent;

  beforeEach(() => {
    // Create agent to maintain session cookies
    agent = request.agent(API_URL);
  });

  describe('POST /api/responses - Validation', () => {
    test('should reject request missing hex field', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 255,
          rgb_g: 0,
          rgb_b: 0,
          classification: 'red'
          // Missing: hex
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('hex');
    });

    test('should reject request missing rgb_r', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_g: 0,
          rgb_b: 0,
          hex: '#FF0000',
          classification: 'red'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject request missing classification', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 255,
          rgb_g: 0,
          rgb_b: 0,
          hex: '#FF0000'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    test('should reject invalid hex format', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 255,
          rgb_g: 0,
          rgb_b: 0,
          hex: 'FF0000', // Missing #
          classification: 'red'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Hex');
    });

    test('should reject RGB values out of range', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 256, // Invalid: > 255
          rgb_g: 0,
          rgb_b: 0,
          hex: '#FF0000',
          classification: 'red'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('RGB');
    });

    test('should reject non-integer RGB values', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 100.5,
          rgb_g: 0,
          rgb_b: 0,
          hex: '#FF0000',
          classification: 'red'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('integer');
    });

    test('should reject invalid classification', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 255,
          rgb_g: 0,
          rgb_b: 0,
          hex: '#FF0000',
          classification: 'invalid_color'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('valid');
    });
  });

  describe('POST /api/responses - Success', () => {
    test('should accept valid classification', async () => {
      const response = await agent
        .post('/api/responses')
        .send({
          rgb_r: 255,
          rgb_g: 0,
          rgb_b: 0,
          hex: '#FF0000',
          classification: 'red'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('wasFirst');
      expect(typeof response.body.wasFirst).toBe('boolean');
    });

    test('should reject duplicate classification for same color', async () => {
      // First classification
      await agent.post('/api/responses').send({
        rgb_r: 128,
        rgb_g: 128,
        rgb_b: 128,
        hex: '#808080',
        classification: 'grey'
      });

      // Try to classify same color again
      const response = await agent.post('/api/responses').send({
        rgb_r: 128,
        rgb_g: 128,
        rgb_b: 128,
        hex: '#808080',
        classification: 'grey'
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('Already responded');
    });

    test('should allow different colors to be classified', async () => {
      // First color
      const response1 = await agent.post('/api/responses').send({
        rgb_r: 255,
        rgb_g: 0,
        rgb_b: 0,
        hex: '#FF0000',
        classification: 'red'
      });

      // Second color
      const response2 = await agent.post('/api/responses').send({
        rgb_r: 0,
        rgb_g: 255,
        rgb_b: 0,
        hex: '#00FF00',
        classification: 'green'
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });
});
