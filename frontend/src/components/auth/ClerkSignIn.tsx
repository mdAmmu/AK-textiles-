import { SignIn } from "@clerk/clerk-react";

export default function ClerkSignIn() {
  return (
    <SignIn
      routing="path"
      path="/login"
      signUpUrl="/login"
      forceRedirectUrl="/redirect"
    />
  );
}
