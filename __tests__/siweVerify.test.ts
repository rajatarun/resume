// @ts-nocheck
import { SiweMessage } from 'siwe';
import { siweVerify } from '@/lib/siweClient';

function mockSignMessage(message: string): string {
  // Deterministic signature used by tests so assertions are stable.
  return `0xmocked-signature-${Buffer.from(message).toString('hex').slice(0, 24)}`;
}

describe('SIWE verification behavior', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_SIWE_API_BASE: 'https://siwe.example.test'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('accepts ABNF prepared message', async () => {
    const siwe = new SiweMessage({
      domain: 'localhost',
      address: '0x1234567890abcdef1234567890abcdef12345678',
      statement: 'Sign in to the app.',
      uri: 'http://localhost:3000',
      version: '1',
      chainId: 1,
      nonce: 'abcdef12',
      issuedAt: new Date('2026-01-01T00:00:00.000Z').toISOString()
    });

    // Build the EIP-4361 plaintext SIWE message used for signing and verification.
    const preparedMessage = siwe.prepareMessage();
    // Log the exact string output so regressions (like JSON output) are easy to spot.
    console.log('[test] prepared SIWE message:\n', preparedMessage);
    // Guard against the JSON failure mode: a valid prepared message must not start with '{'.
    expect(preparedMessage.trim().startsWith('{')).toBe(false);

    // Mock wallet signer behavior: signing the prepared message returns a deterministic signature.
    const signer = {
      signMessage: jest.fn(async (message: string) => mockSignMessage(message))
    };
    const signature = await signer.signMessage(preparedMessage);

    // Mock the SIWE verify API response for a valid message/signature pair.
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, token: 'jwt-token-123' })
    } as Response);

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await siweVerify({
      sessionId: 'session-1',
      preparedMessage,
      signature
    });

    // Verifies success flag is true for a valid SIWE request.
    expect(result.ok).toBe(true);
    // Verifies a token is returned in a successful SIWE verification response.
    expect(result.token).toBeDefined();

    // Verifies the request was issued once to the SIWE verify endpoint.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://siwe.example.test/siwe/verify',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('rejects JSON-shaped message', async () => {
    const invalidJsonMessage = JSON.stringify({ hello: 'world', not: 'siwe' });
    const signature = mockSignMessage(invalidJsonMessage);

    // Verifies non-SIWE JSON strings fail local SIWE message validation before network call.
    await expect(
      siweVerify({
        sessionId: 'session-2',
        preparedMessage: invalidJsonMessage,
        signature
      })
    ).rejects.toThrow(/Invalid SIWE message|Invalid message format|status 400/i);
  });
});
