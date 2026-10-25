export type PinLoginGateReason =
  | "new_device"
  | "pin_locked"
  | "not_eligible";

export type PinLoginGateStep = "pin" | "password";

export type PinLoginGateResult = {
  step: PinLoginGateStep;
  canUsePin: boolean;
  reason?: PinLoginGateReason;
  pinLocked?: boolean;
  message: string;
};
