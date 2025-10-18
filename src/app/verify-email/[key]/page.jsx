import VerifyEmailClient from "../_components/VerifyEmailClient";

export const metadata = {
  title: "Verify Email | Classeasily",
  description:
    "Verify your email address to activate your Classeasily account.",
};

export default function VerifyEmailPage({ params }) {
  return <VerifyEmailClient verificationKey={params.key} />;
}
