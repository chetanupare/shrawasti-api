export const TEST_PHONE = "9552205033";
export const TEST_OTP = "000000";

export function isTestPhone(phone: string): boolean {
  return phone.replace(/\D/g, "").slice(-10) === TEST_PHONE;
}

export function isTestOtp(phone: string, otp: string): boolean {
  return isTestPhone(phone) && otp.trim() === TEST_OTP;
}
