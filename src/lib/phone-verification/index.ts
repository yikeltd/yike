export type { PhoneVerificationChannel, PhoneVerificationProvider } from "./types";
export { resolveDefaultPhoneVerificationChannel } from "./channel";
export {
  PHONE_VERIFY_COPY,
  SMS_OTP_MESSAGE_TEMPLATE,
  buildSmsOtpMessage,
} from "./copy";
export { getPhoneVerificationProvider, sendchampPhoneVerificationProvider } from "./provider";
export {
  isSellerPhoneSmsOtpEnabled,
  sendSellerPhoneVerificationCode,
  verifySellerPhoneCode,
  markSellerPhoneVerifiedForFatBypass,
} from "./service";
