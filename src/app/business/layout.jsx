import ClientOnlyWrapper from "@/components/common/ClientOnlyWrapper";

export default function BusinessLayout({ children }) {
  return <ClientOnlyWrapper>{children}</ClientOnlyWrapper>;
}
