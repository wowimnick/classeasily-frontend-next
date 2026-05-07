"use client";

import { useCallback, useEffect, useState } from "react";
import { Tabs, message } from "antd";
import { corporateAdminService } from "@/services/adminDash";
import InquiriesTable from "./InquiriesTable";
import BookingsTable from "./BookingsTable";
import InquiryDetailDrawer from "./InquiryDetailDrawer";
import BookingDetailDrawer from "./BookingDetailDrawer";

function normList(res) {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  return d?.results || [];
}

export default function CorporateInquiriesTab() {
  const [loading, setLoading] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [drawerInq, setDrawerInq] = useState(null);
  const [shortlist, setShortlist] = useState(null);
  const [slLoading, setSlLoading] = useState(false);
  const [bookingDrawerId, setBookingDrawerId] = useState(null);
  const [bookingReloadNonce, setBookingReloadNonce] = useState(0);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateAdminService.listInquiries();
      setInquiries(normList(res));
    } catch (e) {
      message.error(e?.response?.data?.detail || "Failed to load inquiries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  const loadShortlistForInquiry = useCallback(async (inquiryId) => {
    setSlLoading(true);
    setShortlist(null);
    try {
      const res = await corporateAdminService.getShortlistForInquiry(inquiryId);
      if (res.data) setShortlist(res.data);
      else setShortlist(null);
    } catch {
      setShortlist(null);
    } finally {
      setSlLoading(false);
    }
  }, []);

  const openDrawer = (row) => {
    setDrawerInq(row);
    loadShortlistForInquiry(row.id);
  };

  const onRefreshShortlist = useCallback(async () => {
    if (!drawerInq) return;
    await loadShortlistForInquiry(drawerInq.id);
    await loadInquiries();
  }, [drawerInq, loadShortlistForInquiry, loadInquiries]);

  const onShortlistCreated = async (created) => {
    if (created) setShortlist(created);
    else if (drawerInq) await loadShortlistForInquiry(drawerInq.id);
    await loadInquiries();
  };

  return (
    <div style={{ padding: 16 }}>
      <Tabs
        defaultActiveKey="inquiries"
        items={[
          {
            key: "inquiries",
            label: "Inquiries",
            children: (
              <InquiriesTable
                loading={loading}
                inquiries={inquiries}
                onOpenRow={openDrawer}
              />
            ),
          },
          {
            key: "bookings",
            label: "Bookings",
            children: (
              <BookingsTable
                reloadNonce={bookingReloadNonce}
                onOpenRow={(id) => setBookingDrawerId(id)}
              />
            ),
          },
        ]}
      />
      <InquiryDetailDrawer
        open={!!drawerInq}
        inquiryRow={drawerInq}
        shortlist={shortlist}
        slLoading={slLoading}
        onClose={() => {
          setDrawerInq(null);
          setShortlist(null);
        }}
        onRefreshShortlist={onRefreshShortlist}
        onShortlistCreated={onShortlistCreated}
      />
      <BookingDetailDrawer
        open={!!bookingDrawerId}
        bookingId={bookingDrawerId}
        onClose={() => setBookingDrawerId(null)}
        onInvoiceIssued={() => {
          setBookingReloadNonce((n) => n + 1);
          loadInquiries();
        }}
      />
    </div>
  );
}
