"use client";

import React, { useMemo } from "react";
import styled from "styled-components";
import { Building2 } from "lucide-react";
import { Skeleton } from "antd";
import { motion } from "framer-motion";
import Link from "next/link";

const BUSINESS_TYPE_LABELS = {
  individual: "Individual Host",
  "tour-operator": "Tour Operator",
  "experience-group": "Experience Group",
  venue: "Venue / Studio",
  "event-organizer": "Event Organizer",
  school: "School",
  studio: "Studio",
  academy: "Academy",
  center: "Learning Center",
};

function getFirstName(displayName) {
  if (!displayName || typeof displayName !== "string") return "your host";
  const parts = displayName.trim().split(/\s+/);
  return parts[0] || "your host";
}

const HostSectionWrapper = styled(motion.section)`
  background: #ffffff;
  padding: 0 0 2rem;
  width: 100%;

  @media (max-width: 768px) {
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
`;

const SectionHeading = styled.h2`
  font-size: clamp(20px, 0.95rem + 1.5vw, 23px);
  font-weight: 600;
  color: #111111;
  margin: 0 0 22px;
  line-height: 1.25;
  text-align: left;
`;

const AboutGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;

  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 38fr) minmax(0, 62fr);
    gap: 32px;
  }
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 100%;
`;

const ProfileCardShell = styled.div`
  background: #ffffff;
  border: 1px solid #dddddd;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  text-align: center;
`;

const ProfileCardLink = styled(Link)`
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 16px;
  transition: box-shadow 0.2s ease;
  &:hover {
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }
`;

const HostAvatar = styled.div`
  width: 104px;
  height: 104px;
  margin: 0 auto 12px;
  border-radius: 50%;
  overflow: hidden;
  background: #f3f4f6;
  box-shadow: 0 0 0 1px #dddddd;
  flex-shrink: 0;
`;

const HostImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const HostName = styled.div`
  font-size: clamp(20px, 2vw, 22px);
  font-weight: 700;
  color: #111111;
  margin-bottom: 6px;
  line-height: 1.25;
`;

const HostTagline = styled.p`
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #717171;
  line-height: 1.4;
`;

const MessageButton = styled.button`
  width: 100%;
  margin-top: 16px;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  background: #f0f0f0;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  color: #111111;
  cursor: pointer;
  transition: background 0.2s ease;
  &:hover {
    background: #e8e8e8;
  }
  &:focus-visible {
    outline: 2px solid #111111;
    outline-offset: 2px;
  }
`;

const SafetyNote = styled.p`
  margin: 12px 0 0;
  font-size: 12.5px;
  font-weight: 400;
  color: #717171;
  line-height: 1.45;
  text-align: center;
`;

const BioColumn = styled.div`
  padding-top: 0;
`;

const BioText = styled.div`
  font-size: 15px;
  font-weight: 400;
  color: #222222;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
`;

const BioPlaceholder = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  color: #717171;
  line-height: 1.6;
  font-style: italic;
`;

const LoadingContainer = styled.div`
  padding: 0 0 1rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  @media (min-width: 1024px) {
    grid-template-columns: minmax(0, 38fr) minmax(0, 62fr);
  }
`;

const HostInfo = React.memo(
  ({ businessData, onMessageHost }) => {
    const {
      hostDisplayName,
      businessImage,
      businessDescription,
      typeLabel,
      slug,
      isLoading,
    } = useMemo(() => {
      if (!businessData) return { isLoading: true };

      const { businessName, businessDescription: desc, businessType } =
        businessData;

      return {
        isLoading: false,
        hostDisplayName: businessName || "Host",
        businessImage: businessData.business_image_medium_url,
        businessDescription: (desc && String(desc).trim()) || "",
        typeLabel:
          businessType && BUSINESS_TYPE_LABELS[businessType]
            ? BUSINESS_TYPE_LABELS[businessType]
            : null,
        slug: businessData.slug || null,
      };
    }, [businessData]);

    if (isLoading) {
      return (
        <LoadingContainer aria-busy="true">
          <div>
            <Skeleton.Avatar
              active
              shape="circle"
              size={104}
              style={{ margin: "0 auto 16px", display: "flex" }}
            />
            <Skeleton active title={{ width: "60%" }} paragraph={{ rows: 2 }} />
          </div>
          <Skeleton active paragraph={{ rows: 6 }} />
        </LoadingContainer>
      );
    }

    const firstName = getFirstName(hostDisplayName);
    const profileBody = (
      <>
        <HostAvatar>
          {businessImage ? (
            <HostImg
              src={businessImage}
              alt={`${hostDisplayName}`}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
              }}
            >
              <Building2 size={40} aria-hidden />
            </div>
          )}
        </HostAvatar>
        <HostName>{hostDisplayName}</HostName>
        {typeLabel ? <HostTagline>{typeLabel}</HostTagline> : null}
      </>
    );

    return (
      <HostSectionWrapper
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        aria-labelledby="about-host-heading"
      >
        <SectionHeading id="about-host-heading">About the host</SectionHeading>

        <AboutGrid>
          <LeftColumn>
            {slug ? (
              <ProfileCardLink href={`/business/${slug}`}>
                <ProfileCardShell>{profileBody}</ProfileCardShell>
              </ProfileCardLink>
            ) : (
              <ProfileCardShell>{profileBody}</ProfileCardShell>
            )}

            {onMessageHost ? (
              <MessageButton
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onMessageHost();
                }}
              >
                Message {firstName}
              </MessageButton>
            ) : null}

            <SafetyNote>
              To help protect your payment, always use ClassEasily to send money
              and communicate with hosts.
            </SafetyNote>
          </LeftColumn>

          <BioColumn>
            {businessDescription ? (
              <BioText>{businessDescription}</BioText>
            ) : (
              <BioPlaceholder>This host hasn&apos;t added a bio yet.</BioPlaceholder>
            )}
          </BioColumn>
        </AboutGrid>
      </HostSectionWrapper>
    );
  },
);

HostInfo.displayName = "HostInfo";
export default HostInfo;
