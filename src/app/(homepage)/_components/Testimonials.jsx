"use client";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { Star, ArrowLeft, ArrowRight, Play, Pause } from "lucide-react";
import { motion, useMotionValue } from "framer-motion";

// --- Testimonial Data ---
const testimonialData = [
  {
    id: 1,
    rating: 5,
    date: "20 April 2023",
    quote:
      "My friend and I attended their cocktail making class and it was out of this world fantastic! The mixologist Scott is amazing—fun, funny and knowledgeable! We made three cocktails, and I was very happy with my experience. I will definitely be back in a few months.",
    userName: "Leia Tomson",
    avatarUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face",
    userTitle: "Cocktail Class Attendee",
  },
  {
    id: 2,
    rating: 5,
    date: "2 July 2024",
    quote:
      "If you're looking to book a private event for a hands-on experience in pottery, this studio is the place to go! The instructors were so helpful, patient, kind and professional. My friends and I now have our own creations we can call ours.",
    userName: "Kat",
    avatarUrl:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&crop=face",
    userTitle: "Birthday Event Host",
  },
  {
    id: 3,
    rating: 5,
    date: "17 March 2021",
    quote:
      "I just took a sushi making class with my colleagues and it definitely exceeded my expectations! Our sushi kits were delivered right to our homes with fresh ingredients. It was a perfect way to stay connected. I got major credits from my team for organizing this!",
    userName: "Adrianna Ho",
    avatarUrl:
      "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=80&h=80&fit=crop&crop=face",
    userTitle: "Corporate Team Event",
  },
  {
    id: 4,
    rating: 5,
    date: "15 August 2023",
    quote:
      "I have been a fan of this bar for years. Not only is their menu artful, the drinks are creative and tasteful without seeming gimmicky. The staff were so patient and helpful. It was like I was visiting an old friend's bar. This place is something special.",
    userName: "Vee",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=80&h=80&fit=crop&crop=face",
    userTitle: "Cocktail Enthusiast",
  },
  {
    id: 5,
    rating: 5,
    date: "19 February 2024",
    quote:
      "What a fantastic day! Kingi is a great teacher, an artist, and a beautiful human. You dive right into hands-on actions while learning step by step. The space is inspiring and oozes creativity. I am very pleased with the workshop.",
    userName: "Crypto Biker",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    userTitle: "Silkscreen Workshop Student",
  },
  {
    id: 6,
    rating: 5,
    date: "14 April 2024",
    quote:
      "I recently attended a glass bowl workshop and it was an absolutely fantastic experience. The workshop provided the perfect balance of structure and creativity. I left the workshop feeling not only accomplished but also deeply inspired.",
    userName: "Giuliana Mariani",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&crop=face",
    userTitle: "Glass Art Student",
  },
  {
    id: 7,
    rating: 5,
    date: "28 October 2023",
    quote:
      "My colleagues and I worked together to make a delicious taco feast. We learned new recipes and skills, and there were very clear instructions that allowed us to work independently. It was a perfect activity for our group and suited all skill levels.",
    userName: "Michelle",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=80&h=80&fit=crop&crop=face",
    userTitle: "Cooking Class Participant",
  },
  {
    id: 8,
    rating: 5,
    date: "3 September 2024",
    quote:
      "The studio itself is a vibrant, welcoming space. The teachers are not only exceptionally skilled but also incredibly patient and supportive. They took the time to understand each student’s individual goals. Highly recommend!",
    userName: "Christopher Kwan",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face",
    userTitle: "Art Student",
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
