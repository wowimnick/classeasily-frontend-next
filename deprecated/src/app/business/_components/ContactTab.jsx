"use client";

import React from "react";
import styled from "styled-components";
import {
  Phone,
  Mail,
  Globe,
  Clock,
  AlertCircle,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
} from "lucide-react";

const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2.5rem;
  align-items: start;

  @media (max-width: 992px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const SectionBlock = styled.section`
  background: white;
  padding: 2rem;
  border: 1px solid #e8e8e8;
  border-radius: 16px;

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const SectionHeader = styled.div`
  margin-bottom: 1.75rem;

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin: 0 0 0.35rem 0;
    display: flex;
    align-items: center;
    gap: 0.65rem;
    color: #111;

    svg {
      color: #ff385c;
      width: 20px;
      height: 20px;
    }
  }

  .subtitle {
    color: #888;
    font-size: 0.9rem;
    font-weight: 500;
  }

  @media (max-width: 768px) {
    margin-bottom: 1.5rem;

    h2 {
      font-size: 1.25rem;
    }
  }
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ContactItem = styled.a`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;
  border-radius: 10px;

  &:hover {
    background: #fafafa;
  }
`;

const ContactIcon = styled.div`
  width: 40px;
  height: 40px;
  background: #f8f8f8;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 18px;
    height: 18px;
    color: #666;
  }
`;

const ContactText = styled.div`
  flex: 1;
  min-width: 0;

  .label {
    font-size: 0.75rem;
    color: #aaa;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
    margin-bottom: 0.25rem;
  }

  .value {
    font-size: 0.95rem;
    color: #111;
    font-weight: 500;
    word-break: break-all;
  }
`;

const SocialGrid = styled.div`
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const SocialButton = styled.a`
  width: 48px;
  height: 48px;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.2s ease;
  background: white;

  &:hover {
    border-color: #ff385c;
    color: #ff385c;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(255, 56, 92, 0.15);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const HoursItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 0;
  border-bottom: 1px solid #f5f5f5;
  font-size: 0.9rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  .day {
    font-weight: 600;
    color: #333;
  }

  .time {
    color: #666;
    font-weight: 500;
  }
`;

const PrivacyAlert = styled.div`
  padding: 1.75rem;
  background: #fff8f8;
  border: 1px solid #ffe8e8;
  border-radius: 12px;
  text-align: center;

  svg {
    color: #ff4d4f;
    margin-bottom: 0.75rem;
  }

  h3 {
    color: #ff4d4f;
    margin: 0 0 0.35rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  p {
    color: #ff6b6b;
    margin: 0;
    font-size: 0.9rem;
  }
`;

const socialIcons = {
  facebook: <Facebook />,
  twitter: <Twitter />,
  instagram: <Instagram />,
  linkedin: <Linkedin />,
  youtube: <Youtube />,
};

const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return { display: "N/A", link: null };
  const numericPhone = phoneNumber.replace(/\D/g, "");
  if (numericPhone.length < 10) return { display: phoneNumber, link: null };

  const display = `(${numericPhone.substring(0, 3)}) ${numericPhone.substring(
    3,
    6
  )}-${numericPhone.substring(6, 10)}`;
  const link = `tel:${numericPhone}`;
  return { display, link };
};

const formatTime = (timeString) => {
  if (!timeString) return "N/A";
  try {
    const [hours, minutes] = timeString.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return timeString;
  }
};

const formatBusinessHours = (hours) => {
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
    return [];
  }

  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const groupedByTime = hours.reduce((acc, day) => {
    const timeRange = day.isOpen
      ? `${formatTime(day.open)} - ${formatTime(day.close)}`
      : "Closed";
    if (!acc[timeRange]) {
      acc[timeRange] = [];
    }
    acc[timeRange].push(day.day);
    return acc;
  }, {});

  const formattedLines = [];

  for (const timeRange in groupedByTime) {
    const days = groupedByTime[timeRange].sort(
      (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b)
    );
    let currentGroup = [];
    const dayGroups = [];

    days.forEach((day, index) => {
      const dayIndex = dayOrder.indexOf(day);
      if (index > 0 && dayIndex === dayOrder.indexOf(days[index - 1]) + 1) {
        currentGroup.push(day);
      } else {
        if (currentGroup.length > 0) {
          dayGroups.push(currentGroup);
        }
        currentGroup = [day];
      }
    });
    dayGroups.push(currentGroup);

    const dayString = dayGroups
      .filter((group) => group.length > 0)
      .map((group) => {
        if (group.length > 2) {
          return `${group[0]} - ${group[group.length - 1]}`;
        }
        return group.join(", ");
      })
      .join(", ");

    if (dayString) {
      formattedLines.push({ days: dayString, times: timeRange });
    }
  }
  return formattedLines;
};

const BusinessHoursList = ({ formattedHours }) => {
  if (!formattedHours || formattedHours.length === 0) return null;

  return (
    <div>
      {formattedHours.map((line, index) => (
        <HoursItem key={index}>
          <span className="day">{line.days}</span>
          <span className="time">{line.times}</span>
        </HoursItem>
      ))}
    </div>
  );
};

const ContactTab = ({
  businessName,
  studentContactPhone,
  studentContactEmail,
  website,
  social_media_links,
  contact_privacy,
  businessHours,
}) => {
  const { display: phoneDisplay, link: phoneLink } =
    formatPhoneNumber(studentContactPhone);

  const isContactPublic =
    contact_privacy === "public" || contact_privacy === "public_with_chat";
  const hasPublicContact =
    isContactPublic && (studentContactPhone || studentContactEmail || website);

  const validSocialLinks = Object.entries(social_media_links || {}).filter(
    ([_, url]) => url
  );

  const formattedHours = formatBusinessHours(businessHours);

  return (
    <PageLayout>
      <div>
        <SectionBlock>
          <SectionHeader>
            <h2>
              <Phone />
              Get in Touch
            </h2>
            <div className="subtitle">
              Contact information for {businessName}
            </div>
          </SectionHeader>
          {hasPublicContact ? (
            <ContactList>
              {studentContactPhone && (
                <ContactItem
                  href={phoneLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Call ${businessName}`}
                >
                  <ContactIcon>
                    <Phone />
                  </ContactIcon>
                  <ContactText>
                    <div className="label">Phone</div>
                    <div className="value">{phoneDisplay}</div>
                  </ContactText>
                </ContactItem>
              )}
              {studentContactEmail && (
                <ContactItem
                  href={`mailto:${studentContactEmail}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Email ${businessName}`}
                >
                  <ContactIcon>
                    <Mail />
                  </ContactIcon>
                  <ContactText>
                    <div className="label">Email</div>
                    <div className="value">{studentContactEmail}</div>
                  </ContactText>
                </ContactItem>
              )}
              {website && (
                <ContactItem
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${businessName} website`}
                >
                  <ContactIcon>
                    <Globe />
                  </ContactIcon>
                  <ContactText>
                    <div className="label">Website</div>
                    <div className="value">{website}</div>
                  </ContactText>
                </ContactItem>
              )}
            </ContactList>
          ) : (
            <PrivacyAlert>
              <AlertCircle size={44} />
              <h3>Contact Details Private</h3>
              <p>Direct contact information is shared after booking.</p>
            </PrivacyAlert>
          )}
        </SectionBlock>
      </div>

      <div>
        {validSocialLinks.length > 0 && (
          <SectionBlock style={{ marginBottom: "1.5rem" }}>
            <SectionHeader>
              <h2>
                <Globe />
                Follow Us
              </h2>
            </SectionHeader>
            <SocialGrid>
              {validSocialLinks.map(([platform, url]) =>
                socialIcons[platform] ? (
                  <SocialButton
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow on ${platform}`}
                  >
                    {socialIcons[platform]}
                  </SocialButton>
                ) : null
              )}
            </SocialGrid>
          </SectionBlock>
        )}

        {formattedHours.length > 0 && (
          <SectionBlock>
            <SectionHeader>
              <h2>
                <Clock />
                Business Hours
              </h2>
            </SectionHeader>
            <BusinessHoursList formattedHours={formattedHours} />
          </SectionBlock>
        )}
      </div>
    </PageLayout>
  );
};

export default ContactTab;
