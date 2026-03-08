import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import ColorClassifier from './ColorClassifier';

// Mock axios
vi.mock('axios');

describe('ColorClassifier', () => {
  const mockColor = {
    rgb_r: 255,
    rgb_g: 128,
    rgb_b: 64,
    hex: '#FF8040'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock initial color fetch
    axios.get.mockResolvedValue({ data: mockColor });
  });

  describe('Classification Submission Payload', () => {
    test('should include hex field when submitting classification', async () => {
      // Mock successful POST
      axios.post.mockResolvedValue({
        data: { success: true, wasFirst: false }
      });

      render(<ColorClassifier />);

      // Wait for color to load
      await waitFor(() => {
        expect(axios.get).toHaveBeenCalledWith('/api/colors/next');
      });

      // Find and click a classification button
      const redButton = screen.getByRole('button', { name: /red/i });
      await userEvent.click(redButton);

      // Verify POST was called with correct payload
      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith(
          '/api/responses',
          expect.objectContaining({
            rgb_r: mockColor.rgb_r,
            rgb_g: mockColor.rgb_g,
            rgb_b: mockColor.rgb_b,
            hex: mockColor.hex,
            classification: 'red'
          })
        );
      });
    });

    test('should include all required fields in submission', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, wasFirst: false }
      });

      render(<ColorClassifier />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const blueButton = screen.getByRole('button', { name: /blue/i });
      await userEvent.click(blueButton);

      await waitFor(() => {
        const postCall = axios.post.mock.calls[0];
        expect(postCall).toBeDefined();
        const payload = postCall[1];

        // Verify all required fields are present
        expect(payload).toHaveProperty('rgb_r');
        expect(payload).toHaveProperty('rgb_g');
        expect(payload).toHaveProperty('rgb_b');
        expect(payload).toHaveProperty('hex');
        expect(payload).toHaveProperty('classification');

        // Verify hex format
        expect(payload.hex).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });

    test('should not submit if color is null', async () => {
      axios.get.mockResolvedValue({ data: null });

      render(<ColorClassifier />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      // Should not be able to click classification buttons if color is null
      // This prevents submission without a color
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should show alert on classification error', async () => {
      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      axios.post.mockRejectedValue(new Error('400 Bad Request'));

      render(<ColorClassifier />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const redButton = screen.getByRole('button', { name: /red/i });
      await userEvent.click(redButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(
          'Failed to save your answer. Please try again.'
        );
      });

      alertSpy.mockRestore();
    });
  });

  describe('First Classification Badge', () => {
    test('should log message when user is first to classify', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      axios.post.mockResolvedValue({
        data: { success: true, wasFirst: true }
      });

      render(<ColorClassifier />);

      await waitFor(() => {
        expect(axios.get).toHaveBeenCalled();
      });

      const greenButton = screen.getByRole('button', { name: /green/i });
      await userEvent.click(greenButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('first to classify')
        );
      });

      consoleSpy.mockRestore();
    });
  });
});
