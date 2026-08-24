import crypto from 'crypto';

const OTP_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const generateOtp = (length: number): string => {
  if (length <= 0 || !Number.isInteger(length)) {
    throw new Error('OTP length must be a positive integer');
  }

  return Array.from(
    { length },
    () => OTP_CHARACTERS[crypto.randomInt(OTP_CHARACTERS.length)],
  ).join('');
};