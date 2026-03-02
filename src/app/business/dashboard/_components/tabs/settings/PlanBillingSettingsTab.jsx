"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button, Modal, message as antMessage } from "antd";
import { ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { useSubscription } from "@/context/SubscriptionContext";
import { getPlanById, PLANS, isUpgrade } from "@/lib/subscriptionPlans";
import message from "@/lib/message";

const SEL_COLOR = "#111827";

export default function PlanBillingSettingsTab() {
  const { subscription, loading: subLoading, cancel, reactivate, refetch: refetchSubscription } = useSubscription();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const currentPlan = subscription?.planId ? getPlanById(subscription.planId) : null;
  const nextBilling = subscription?.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  const handleCancelConfirm = async () => {
    setCancelling(true);
    const result = await cancel();
    setCancelling(false);
    setCancelModalOpen(false);
    if (result.success) {
      message.success("Subscription will cancel at the end of the billing period.");
      refetchSubscription();
    } else {
      antMessage.error(result.error || "Failed to cancel.");
    }
  };

  const handleReactivate = async () => {
    const result = await reactivate();
    if (result.success) {
      message.success("Subscription reactivated.");
      refetchSubscription();
    } else {
      antMessage.error(result.error || "Failed to reactivate.");
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600, color: "#111827" }}>
          Widget plan & billing
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
          Manage your booking widget subscription. Changes to plan or cancellation take effect at the end of the current billing period.
        </p>
      </div>

      {subLoading ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "24px 0" }}>
          <Loader2 size={18} style={{ animation: "spin 1s linear infinite", color: "#9ca3af" }} />
          <span style={{ fontSize: 14, color: "#9ca3af" }}>Loading…</span>
        </div>
      ) : !subscription?.planId ? (
        <div style={{
          background: "#f9fafb",
          border: "1px dashed #d1d5db",
          borderRadius: 12,
          padding: 28,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, color: "#374151", margin: "0 0 16px", lineHeight: 1.5 }}>
            You don&apos;t have an active widget plan. Subscribe to embed the booking widget on your website.
          </p>
          <Link href="/booking-widget">
            <Button type="primary" icon={<ArrowRight size={14} />} size="middle"
              style={{ background: SEL_COLOR, borderColor: SEL_COLOR }}>
              View plans
            </Button>
          </Link>
        </div>
      ) : (
        <div style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 24,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>
                {currentPlan?.name ?? subscription.planId}
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                ${currentPlan?.price ?? 0}/mo
                {currentPlan?.commission ? ` · ${currentPlan.commission}% per booking` : ""}
                {nextBilling ? ` · Renews ${nextBilling}` : ""}
              </div>
              {subscription.cancelAtPeriodEnd && (
                <div style={{ marginTop: 10, display: "inline-block", padding: "4px 12px", background: "#fef3c7", borderRadius: 20, fontSize: 12, color: "#92400e" }}>
                  Cancels {nextBilling || "at period end"}
                </div>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
              {subscription.cancelAtPeriodEnd ? (
                <Button size="small" icon={<RefreshCw size={12} />} onClick={handleReactivate}
                  style={{ background: SEL_COLOR, borderColor: SEL_COLOR, color: "white" }}>
                  Reactivate
                </Button>
              ) : (
                <>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {PLANS.filter((p) => p.id !== subscription.planId).map((p) => (
                      <Link key={p.id} href={`/booking-widget/checkout?plan=${p.id}`}>
                        <Button size="small" style={{ fontSize: 12 }}>
                          {isUpgrade(subscription.planId, p.id) ? "Upgrade" : "Downgrade"} to {p.name}
                        </Button>
                      </Link>
                    ))}
                  </div>
                  <Button size="small" danger onClick={() => setCancelModalOpen(true)} style={{ fontSize: 12 }}>
                    Cancel subscription
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        title="Cancel subscription"
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        onOk={handleCancelConfirm}
        okText={cancelling ? "Cancelling…" : "Cancel at period end"}
        okButtonProps={{ danger: true, loading: cancelling }}
        cancelText="Keep subscription"
      >
        <p style={{ margin: 0 }}>
          Your subscription will cancel at the end of the current billing period ({nextBilling || "see above"}).
          You&apos;ll keep access until then.
        </p>
      </Modal>
    </div>
  );
}
