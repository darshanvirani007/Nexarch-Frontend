import { buildAuthCallbackUrl, type AppUrlOptions } from "@/lib/auth-redirect";

type ResendResult = Promise<{ error: unknown | null }>;
type SignupResendAuth = {
  resend(input: {
    type: "signup";
    email: string;
    options: { emailRedirectTo: string };
  }): ResendResult;
};

export function resendSignupVerification(
  auth: SignupResendAuth,
  email: string,
  appUrlOptions: AppUrlOptions = {},
) {
  return auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: buildAuthCallbackUrl("/onboarding", appUrlOptions) },
  });
}
