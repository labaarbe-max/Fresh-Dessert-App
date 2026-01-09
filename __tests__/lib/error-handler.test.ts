import { logError } from '@/lib/error-handler';
import { logError as loggerTransport } from '@/lib/logger';
jest.mock('next/server');

jest.mock('@/lib/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
  logError: jest.fn(),
  logRequest: jest.fn()
}));

describe('logError', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('enrichit les erreurs avec contexte et stack en dev', () => {
    const error = new Error('Boom');
    logError(error, 'TestContext', { foo: 'bar' });

    expect(loggerTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'ERROR',
        context: 'TestContext',
        message: 'Boom',
        metadata: { foo: 'bar' },
        stack: expect.any(String)
      })
    );
  });
});