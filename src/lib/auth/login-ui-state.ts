/** Pure login surface resolution — keeps PIN vs password mutually exclusive. */
export type LoginSurface = "pin" | "password";

export function resolveLoginSurface(input: {
  hasQuickUser: boolean;
  showPasswordForm: boolean;
  forcePassword: boolean;
}): LoginSurface {
  if (input.forcePassword || input.showPasswordForm || !input.hasQuickUser) {
    return "password";
  }
  return "pin";
}
