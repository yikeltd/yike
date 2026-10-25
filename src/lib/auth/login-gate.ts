/** Pure password-login step resolution — keeps email verify vs device OTP mutually consistent. */
export function resolvePasswordLoginSteps(input: {
  emailVerified: boolean;
  deviceTrusted: boolean;
  isReviewer: boolean;
}): {
  needsEmailVerify: boolean;
  needsLoginOtp: boolean;
  requiresPinSetupEligible: boolean;
} {
  const needsEmailVerify = !input.emailVerified && !input.isReviewer;
  const needsLoginOtp =
    !input.deviceTrusted && !input.isReviewer && !needsEmailVerify;
  return {
    needsEmailVerify,
    needsLoginOtp,
    requiresPinSetupEligible: !needsEmailVerify && !needsLoginOtp,
  };
}
