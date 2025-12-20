"use client";

import React, { useState, useEffect, useRef, useLayoutEffect, Suspense } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Modal, Button, Result, Typography, ConfigProvider, Skeleton } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, Users, AlertTriangle, Info, Check } from "lucide-react";
import { Drawer } from "vaul";
import { useSearchParams, useRouter } from "next/navigation";
import message from "@/lib/message";

import { guestBookingService } from "@/services/apiService";
import { getCancellationPolicyText } from "@/app/classes/_components/steps/utils";
import { theme } from "@/components/theme";

const { Title, Text, Paragraph } = Typography;

const ModalGlobalStyle = createGlobalStyle`
  .no-padding-modal .ant-modal-content {
    padding: 0 !important;
  }
`;

const useElementSize = () => {
    const ref = useRef(null);
    const [size, setSize] = useState({ width: 0, height: 0 });
    useLayoutEffect(() => {
        if (!ref.current) return;
        const observer = new ResizeObserver(([entry]) => {
            setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
        });
        observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);
    return [ref, size];
};

const AnimatedModalContent = ({ children }) => {
    const [ref, { height }] = useElementSize();
    return (
        <motion.div
            animate={{ height: height || "auto" }}
            style={{ overflow: "hidden" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
            <div ref={ref}>{children}</div>
        </motion.div>
    );
};

const ContentWrapper = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const InfoGrid = styled.div`
  display: grid;
  gap: 12px;
  text-align: left;
  margin: 24px 0;
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  min-height: 54px; 
  svg { flex-shrink: 0; color: ${theme.token.colorPrimary}; }
`;

const StyledModal = styled(Modal)`
  .ant-modal-container {
    padding: 0 !important;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  @media (max-width: 768px) { flex-direction: column-reverse; }
`;

const SuccessBloom = styled(motion.div)`
  width: 72px;
  height: 72px;
  background: #52c41a;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  position: relative;
  color: white;
  box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
`;

const Particle = styled(motion.div)`
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #52c41a;
`;

const ConfettiBurst = () => {
    return (
        <>
            {[...Array(12)].map((_, i) => (
                <Particle
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                        scale: [0, 1, 0],
                        x: Math.cos(i * (Math.PI / 6)) * 60,
                        y: Math.sin(i * (Math.PI / 6)) * 60
                    }}
                    transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}
                />
            ))}
        </>
    );
};

const CancellationSkeleton = () => (
    <ContentWrapper>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <Skeleton.Avatar active size={48} shape="circle" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <Skeleton.Input active style={{ width: 200, height: 28 }} />
            <Skeleton.Input active style={{ width: 280, height: 20 }} />
        </div>
        <InfoGrid>
            {[1, 2, 3].map(i => (
                <InfoRow key={i}>
                    <Skeleton.Avatar active size={20} shape="square" />
                    <Skeleton.Input active size="small" style={{ width: i === 1 ? '140px' : '180px' }} />
                </InfoRow>
            ))}
        </InfoGrid>
        <ButtonGroup>
            <Skeleton.Button active block style={{ height: 40 }} />
            <Skeleton.Button active block style={{ height: 40 }} />
        </ButtonGroup>
    </ContentWrapper>
);

function CancellationContent({ token, onClose }) {
    const [status, setStatus] = useState("loading");
    const [booking, setBooking] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isCancelling, setIsCancelling] = useState(false);
    const [policyText, setPolicyText] = useState("");

    useEffect(() => {
        if (!token) return;
        const fetchBookingDetails = async () => {
            const result = await guestBookingService.getBookingDetails(token);
            if (result.success) {
                const b = result.data;
                setBooking(b);
                setPolicyText(getCancellationPolicyText(
                    b.cancellation_policy, b.cancellation_refund_percentage, b.cancellation_custom_hours,
                    `${b.date}T${b.time}`, Intl.DateTimeFormat().resolvedOptions().timeZone, b.business_timezone
                ));
                setStatus("confirm");
            } else {
                setErrorMessage(result.error);
                setStatus("error");
            }
        };
        fetchBookingDetails();
    }, [token]);

    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        message.loading({ content: "Cancelling...", key: "cancel" });
        const result = await guestBookingService.cancelBooking(token);
        if (result.success) {
            message.success({ content: "Cancelled", key: "cancel" });
            setStatus("success");
        } else {
            message.error({ content: result.error, key: "cancel" });
            setErrorMessage(result.error);
            setStatus("error");
        }
        setIsCancelling(false);
    };

    if (status === "loading") return <CancellationSkeleton />;

    // Formatting date and time for consistent spacing
    const dateStr = booking ? new Date(booking.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }) : "";
    const timeStr = booking ? new Date(`2000-01-01T${booking.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "";
    const fullSchedule = `${dateStr} at ${timeStr}`;

    return (
        <ContentWrapper>
            <AnimatePresence mode="wait">
                {status === "confirm" && (
                    <motion.div
                        key="confirm"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                        transition={{ duration: 0.3 }}
                    >
                        <AlertTriangle size={48} style={{ marginBottom: 16, color: "#faad14" }} />
                        <Title level={3} style={{ marginBottom: 4 }}>Confirm Cancellation</Title>
                        <Paragraph type="secondary">Are you sure you want to cancel your booking?</Paragraph>
                        <InfoGrid>
                            <InfoRow><Calendar size={18} /><Text strong>{booking.class_name}</Text></InfoRow>
                            <InfoRow>
                                <Clock size={18} />
                                <Text>{fullSchedule}</Text>
                            </InfoRow>
                            <InfoRow><Users size={18} /><Text>{booking.participants} Participant(s)</Text></InfoRow>
                        </InfoGrid>
                        <div style={{ textAlign: 'left', display: 'flex', gap: 8, marginBottom: 24 }}>
                            <Info size={14} style={{ flexShrink: 0, marginTop: 3, color: '#888' }} />
                            <Text style={{ fontSize: "12px", color: "#666" }}>{policyText}</Text>
                        </div>
                        <ButtonGroup>
                            <Button size="middle" block onClick={onClose} disabled={isCancelling}>Keep My Booking</Button>
                            <Button size="middle" block type="primary" danger onClick={handleConfirmCancel} loading={isCancelling} key={`btn-${isCancelling}`}>Yes, Cancel</Button>
                        </ButtonGroup>
                    </motion.div>
                )}

                {status === "success" && (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", damping: 18, stiffness: 150 }}
                        style={{ padding: "24px 0" }}
                    >
                        <SuccessBloom
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <ConfettiBurst />
                            <motion.div
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.2 }}
                            >
                                <Check size={36} strokeWidth={3} />
                            </motion.div>
                        </SuccessBloom>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <Title level={3} style={{ marginBottom: 8 }}>Booking Cancelled</Title>
                            <Paragraph type="secondary">
                                Your spot has been released. <br />
                                Refunds process in 3-5 business days.
                            </Paragraph>
                            <Button type="primary" size="middle" onClick={onClose} style={{ marginTop: 16 }}>
                                Done
                            </Button>
                        </motion.div>
                    </motion.div>
                )}

                {status === "error" && (
                    <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Result
                            status="error"
                            title="Failed to Cancel"
                            subTitle={errorMessage}
                            extra={<Button type="primary" size="middle" onClick={onClose}>Close</Button>}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </ContentWrapper>
    );
}

function CancellationOverlayInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("cancel_token");
    const [isMobile, setIsMobile] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const checkMobile = () => setIsMobile(window.innerWidth <= 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("cancel_token");
        router.replace(`/?${params.toString()}`, { scroll: false });
    };

    if (!mounted || !token) return null;

    return (
        <ConfigProvider theme={theme}>
            <ModalGlobalStyle />
            {isMobile ? (
                <Drawer.Root open={!!token} onOpenChange={(open) => !open && handleClose()}>
                    <Drawer.Portal>
                        <Drawer.Overlay style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }} />
                        <Drawer.Content style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTopLeftRadius: 16, borderTopRightRadius: 16, zIndex: 1001, outline: 'none' }}>
                            <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '12px auto' }} />
                            <AnimatedModalContent>
                                <CancellationContent token={token} onClose={handleClose} />
                            </AnimatedModalContent>
                        </Drawer.Content>
                    </Drawer.Portal>
                </Drawer.Root>
            ) : (
                <StyledModal
                    open={!!token}
                    onCancel={handleClose}
                    width={480}
                    footer={null}
                    centered
                    closable={false}
                    className="no-padding-modal"
                >
                    <AnimatedModalContent>
                        <CancellationContent token={token} onClose={handleClose} />
                    </AnimatedModalContent>
                </StyledModal>
            )}
        </ConfigProvider>
    );
}

export default function CancellationOverlay() {
    return (
        <Suspense fallback={null}>
            <CancellationOverlayInner />
        </Suspense>
    );
}