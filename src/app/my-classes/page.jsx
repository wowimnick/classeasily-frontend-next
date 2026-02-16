import MyClassesClient from "./_components/MyClassesClient";

export const metadata = {
  title: "My Bookings | Classeasily",
  description:
    "Manage your upcoming classes, review completed sessions, and track your learning journey.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function MyClassesPage() {
  return <MyClassesClient />;
}
