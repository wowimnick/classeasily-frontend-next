"use client";

import dynamic from "next/dynamic";

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
  return (
    <ClassEditDrawer
      visible={open}
      onClose={onClose}
      classData={data}
      onSuccess={onSuccess}
      useAdminApi
      isClassDataLoading={loading || (!!open && !data)}
    />
  );
}
