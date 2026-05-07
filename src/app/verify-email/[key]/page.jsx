import VerifyEmailClient from "../_components/VerifyEmailClient";

export const metadata = {
  title: "Verify Email | ClassEasily",
  description:
    "Verify your email address to activate your ClassEasily account.",
};

export default function VerifyEmailPage({ params }) {
  return <VerifyEmailClient verificationKey={params.key} />;
}
