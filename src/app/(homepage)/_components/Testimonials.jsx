"use client";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Star, ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import { motion, useMotionValue } from "framer-motion";

// --- Testimonial Data (can be moved to a separate file for SSG) ---
const testimonialData = [
  {
    id: 1,
    rating: 5,
    date: "15 May 2024",
    quote:
      "This platform has completely transformed how I manage my yoga studio. The scheduling system is intuitive and my students love the mobile app. Revenue increased by 40% in just 3 months!",
    userName: "Sarah Johnson",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
    userTitle: "Yoga Studio Owner",
  },
  {
    id: 2,
    rating: 5,
    date: "8 May 2024",
    quote:
      "As a dance instructor, I needed something that could handle complex scheduling and payments. This solution exceeded my expectations. The automated reminders alone have saved me hours each week.",
    userName: "Marcus Rodriguez",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    userTitle: "Dance Academy Director",
  },
  {
    id: 3,
    rating: 5,
    date: "2 May 2024",
    quote:
      "The analytics dashboard gives me insights I never had before. I can see which classes are most popular, track student progress, and optimize my pricing. It's like having a business consultant built-in.",
    userName: "Emily Chen",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    userTitle: "Music School Principal",
  },
  {
    id: 4,
    rating: 5,
    date: "28 April 2024",
    quote:
      "Managing my martial arts dojo became so much easier. The student management system helps me track belt progressions, and the payment processing is seamless. My students appreciate the convenience.",
    userName: "David Kim",
    avatarUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face",
    userTitle: "Martial Arts Instructor",
  },
  {
    id: 5,
    rating: 5,
    date: "22 April 2024",
    quote:
      "The mobile app feature is a game-changer. My art students can book classes, make payments, and even submit their work portfolios all in one place. Professional and user-friendly.",
    userName: "Isabella Martinez",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    userTitle: "Art Studio Owner",
  },
  {
    id: 6,
    rating: 5,
    date: "18 April 2024",
    quote:
      "The customer support is outstanding, and the platform grows with your business. Started with basic features and now use advanced analytics. It's been instrumental in scaling my cooking school.",
    userName: "James Thompson",
    avatarUrl:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&crop=face",
    userTitle: "Culinary School Chef",
  },
  {
    id: 7,
    rating: 5,
    date: "12 April 2024",
    quote:
      "Integration with social media and marketing tools helped me reach new students effortlessly. The SEO optimization features brought organic traffic I didn't expect. Highly recommended!",
    userName: "Sophia Williams",
    avatarUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
    userTitle: "Language School Director",
  },
  {
    id: 8,
    rating: 5,
    date: "5 April 2024",
    quote:
      "The reporting features help me understand my business better than ever. I can track everything from attendance patterns to revenue trends. It's like having a crystal ball for my fitness studio.",
    userName: "Alex Parker",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    userTitle: "Fitness Studio Manager",
  },
];

const TrustpilotLogoPlaceholder = () => (
  <svg
    width="100"
    height="24"
    viewBox="0 0 100 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Trustpilot Logo"
  >
    <path
      d="M14.006 18.1411L10.88 19.9991L11.77 16.2461L8.887 13.7001L12.689 13.3751L14.006 9.85812L15.322 13.3751L19.124 13.7001L16.241 16.2461L17.131 19.9991L14.006 18.1411Z"
      fill="#00B67A"
    />
    <text
      x="24"
      y="18"
      fontFamily="Arial, sans-serif"
      fontSize="14"
      fontWeight="bold"
      fill="#333"
    >
      Trustpilot
    </text>
  </svg>
);

// --- Styled Components ---
const TestimonialSection = styled.section`
  background: linear-gradient(to bottom, #ffffff 50%, #fff6f6 100%);
  padding: 5rem 0;
  overflow: hidden;
`;

const Container = styled.div`
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
  @media (max-width: 600px) {
    padding: 0 1rem;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }
`;

const Title = styled.h2`
  font-size: clamp(1.8rem, 4vw, 2.2rem);
  font-weight: 700;
  color: #1e1e1e;
  margin: 0;
`;

const ControlsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayPauseButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid #e92e31;
  background-color: ${(props) =>
    props.$isPlaying ? "#E92E31" : "transparent"};
  cursor: pointer;
  transition: all 0.3s ease;

  svg {
    color: ${(props) => (props.$isPlaying ? "#ffffff" : "#E92E31")};
    width: 18px;
    height: 18px;
  }

  &:hover {
    background-color: ${(props) => (props.$isPlaying ? "#D0282B" : "#FFF0F0")};
  }
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const NavButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid transparent;
  background-color: transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &.prev {
    border-color: #e92e31;
    svg {
      color: #e92e31;
    }
    &:hover {
      background-color: #fff0f0;
    }
  }
  &.next {
    background-color: #e92e31;
    svg {
      color: #ffffff;
    }
    &:hover {
      background-color: #d0282b;
    }
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const TestimonialContainer = styled.div`
  position: relative;
  overflow: hidden;
  mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to right,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
  @media (max-width: 600px) {
    mask-image: none;
    -webkit-mask-image: none;
  }
`;

const TestimonialTrack = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  will-change: transform;
`;

const TestimonialCard = styled(motion.div)`
  background-color: #ffffff;
  border-radius: 1rem;
  padding: 1.8rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;
  flex-shrink: 0;
  width: 400px;

  @media (max-width: 900px) {
    width: 350px;
  }

  @media (max-width: 480px) {
    width: calc(100vw - 4rem);
    max-width: 320px;
    padding: 1.4rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.07);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const StarRating = styled.div`
  display: flex;
  gap: 0.2rem;
`;

const StyledStar = styled(Star)`
  width: 20px;
  height: 20px;
  color: #00b67a;
  fill: #00b67a;
`;

const DateStamp = styled.span`
  font-size: 0.85rem;
  color: #666666;
`;

const Quote = styled.p`
  font-size: 0.95rem;
  color: #555555;
  line-height: 1.6;
  margin: 0;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;

const UserName = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #1e1e1e;
`;

const UserTitle = styled.span`
  font-size: 0.85rem;
  color: #666666;
`;

const TrustpilotLogo = styled.div`
  svg {
    display: block;
    height: 24px;
    width: auto;
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 2rem;
`;

const ProgressDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${(props) => (props.$active ? "#E92E31" : "#e0e0e0")};
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background-color: ${(props) => (props.$active ? "#D0282B" : "#c0c0c0")};
  }
`;

// --- Main Component ---
const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [visibleCount, setVisibleCount] = useState(2);
  const [cardStep, setCardStep] = useState(0);
  const trackRef = useRef(null);
  const x = useMotionValue(0);

  useEffect(() => {
    const updateLayout = () => {
      const newVisibleCount = window.innerWidth < 800 ? 1 : 2;
      setVisibleCount(newVisibleCount);

      if (trackRef.current && trackRef.current.children.length > 0) {
        const cardElement = trackRef.current.children[0];
        const trackStyle = window.getComputedStyle(trackRef.current);
        const gap = parseFloat(trackStyle.gap) || 24;
        setCardStep(cardElement.offsetWidth + gap);
      }

      const newMaxIndex = testimonialData.length - newVisibleCount;
      setCurrentIndex((prev) => Math.min(prev, newMaxIndex));
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = testimonialData.length - visibleCount;
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, visibleCount]);

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const maxIndex = testimonialData.length - visibleCount;
      return prev <= 0 ? maxIndex : prev - 1;
    });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const maxIndex = testimonialData.length - visibleCount;
      return prev >= maxIndex ? 0 : prev + 1;
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const onDragEnd = (event, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset < -50 || velocity < -500) {
      handleNext();
    } else if (offset > 50 || velocity > 500) {
      handlePrev();
    }
  };

  const maxIndex = testimonialData.length - visibleCount;

  let translateX = 0;
  if (cardStep > 0) {
    if (visibleCount === 1 && trackRef.current) {
      const containerWidth = trackRef.current.parentElement.offsetWidth;
      const cardWidthOnly =
        cardStep -
        (parseFloat(window.getComputedStyle(trackRef.current).gap) || 24);
      const centeringOffset = (containerWidth - cardWidthOnly) / 2;
      translateX = centeringOffset - currentIndex * cardStep;
    } else {
      translateX = -(currentIndex * cardStep);
    }
  }

  return (
    <TestimonialSection aria-labelledby="testimonials-title">
      <Container>
        <HeaderRow>
          <Title id="testimonials-title">Thoughts from our learners</Title>
          <ControlsContainer>
            <PlayPauseButton
              $isPlaying={isPlaying}
              onClick={togglePlayPause}
              whileTap={{ scale: 0.9 }}
              aria-label={isPlaying ? "Pause auto-scroll" : "Play auto-scroll"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </PlayPauseButton>
            <NavigationButtons>
              <NavButton
                className="prev"
                onClick={handlePrev}
                whileTap={{ scale: 0.9 }}
                aria-label="Previous testimonial"
              >
                <ArrowLeft size={20} />
              </NavButton>
              <NavButton
                className="next"
                onClick={handleNext}
                whileTap={{ scale: 0.9 }}
                aria-label="Next testimonial"
              >
                <ArrowRight size={20} />
              </NavButton>
            </NavigationButtons>
          </ControlsContainer>
        </HeaderRow>

        <TestimonialContainer>
          <TestimonialTrack
            ref={trackRef}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={onDragEnd}
            animate={{ x: translateX }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 20,
              mass: 1,
            }}
          >
            {testimonialData.map((testimonial, index) => (
              <TestimonialCard
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardHeader>
                  <StarRating>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <StyledStar key={i} />
                    ))}
                  </StarRating>
                  <DateStamp>{testimonial.date}</DateStamp>
                </CardHeader>
                <Quote>{testimonial.quote}</Quote>
                <CardFooter>
                  <UserInfo>
                    <Avatar
                      src={testimonial.avatarUrl}
                      alt={`${testimonial.userName}`}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          testimonial.userName
                        )}&background=E92E31&color=fff&size=80`;
                      }}
                    />
                    <UserDetails>
                      <UserName>{testimonial.userName}</UserName>
                      <UserTitle>{testimonial.userTitle}</UserTitle>
                    </UserDetails>
                  </UserInfo>
                  <TrustpilotLogo>
                    <TrustpilotLogoPlaceholder />
                  </TrustpilotLogo>
                </CardFooter>
              </TestimonialCard>
            ))}
          </TestimonialTrack>
        </TestimonialContainer>

        <ProgressIndicator>
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <ProgressDot
              key={index}
              $active={index === currentIndex}
              onClick={() => goToSlide(index)}
            />
          ))}
        </ProgressIndicator>
      </Container>
    </TestimonialSection>
  );
};

export default Testimonials;
