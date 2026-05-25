"use client";

import dynamic from "next/dynamic";
import message from "@/lib/message";

const ClassEditDrawer = dynamic(
  () =>
    import(
      "@/app/business/dashboard/_components/tabs/classes/manageclasses/ClassEditDrawer"
    ),
  { ssr: false },
);

/**
 * Admin class edit: same drawer as the business dashboard, backed by PATCH /admin/classes/:id/.
 */
export default function AdminClassEditDrawer({
  open,
  onClose,
  classEntity,
  classData,
  loading = false,
  onSuccess,
}) {
  const data = classEntity ?? classData ?? null;

  const handleSuccess = (updated) => {
    const title = updated?.title || data?.title || "Class";
    message.success(`"${title}" saved successfully.`);
    onSuccess?.(updated);
  };

  return (
    <ClassEditDrawer
      visible={open}
      onClose={onClose}
      classData={data}
      onSuccess={handleSuccess}
      useAdminApi
      isClassDataLoading={loading || (!!open && !data)}
      desktopWidth="min(800px, 100vw)"
    />
  );
}
