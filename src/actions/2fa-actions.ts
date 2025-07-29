
'use server';

import { authenticator } from 'otplib';
import { z } from 'zod';

const APP_NAME = 'SynapseCDE';

export async function generate2faSecret(username: string): Promise<{ secret: string; otpauthUrl: string }> {
  try {
    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(username, APP_NAME, secret);
    return { secret, otpauthUrl };
  } catch (err) {
    console.error("Failed to generate 2FA secret:", err);
    throw new Error("Could not generate a 2FA secret at this time.");
  }
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
