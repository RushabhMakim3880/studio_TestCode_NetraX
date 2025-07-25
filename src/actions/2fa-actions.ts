
'use server';

import { authenticator } from 'otplib';
import { z } from 'zod';

const APP_NAME = 'NETRA-X';

export async function generate2faSecret(username: string): Promise<{ secret: string; otpauthUrl: string }> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(username, APP_NAME, secret);

  return { secret, otpauthUrl };
}


const VerifyTokenInputSchema = z.object({
  secret: z.string(),
  token: z.string(),
});

export async function verify2faToken(input: z.infer<typeof VerifyTokenInputSchema>): Promise<boolean> {
  const { secret, token } = input;
  try {
    return authenticator.verify({ token, secret });
  } catch (err) {
    console.error("2FA token verification error:", err);
    return false;
  }
}
