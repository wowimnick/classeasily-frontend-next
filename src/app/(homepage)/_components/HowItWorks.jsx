"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Calendar,
  Star,
  ImagePlus,
  Wrench,
  DollarSign,
} from "lucide-react";

// --- Styled Components ---
const HowItWorksWrapper = styled.section`
  background: linear-gradient(45deg, rgb(175, 16, 16), rgb(218, 84, 88));
  position: relative;
  overflow: hidden;
  font-family: "Proxima Soft", sans-serif;
  min-height: 800px;
  display: flex;
  flex-direction: column;
  padding: 6rem 2rem;

  @media (max-width: 1024px) {
    min-height: 900px;
    padding: 2rem;
    padding-top: 8rem;
  }
  @media (max-width: 768px) {
    padding: 6rem 2rem;
    min-height: 1000px;
  }
  @media (max-width: 480px) {
    min-height: 1200px;
    padding: 2rem 2rem;
    padding-top: 8rem;
  }
`;

const Pattern = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 270px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 100' fill='rgba(255,255,255,1)'%3E%3Cpath d='M0 0v99.7C62 69 122.4 48.7 205 66c83.8 17.6 160.5 20.4 240-12 54-22 110-26 173-10a392.2 392.2 0 0 0 222-5c55-17 110.3-36.9 160-27.2V0H0Z' opacity='.5'%3E%3C/path%3E%3Cpath d='M0 0v74.7C62 44 122.4 28.7 205 46c83.8 17.6 160.5 25.4 240-7 54-22 110-21 173-5 76.5 19.4 146.5 23.3 222 0 55-17 110.3-31.9 160-22.2V0H0Z'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: repeat-x;
  background-size: cover;
  opacity: 1;
  pointer-events: none;
`;

const TopPattern = styled(Pattern)`
  top: -20px;
`;

const BottomPattern = styled(Pattern)`
  bottom: -20px;
  transform: rotate(180deg);
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 4rem;
  flex: 1;

  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 15rem 0;
    gap: 3rem;
    text-align: center;
  }
`;

const FirstElement = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 1rem;
  flex: 0.35;

  @media (max-width: 1024px) {
    align-items: center;
    text-align: center;
    flex: initial;
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
  @media (max-width: 480px) {
    flex-direction: column;
    align-items: center;
  }
`;

const RoundedButton = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.5rem;
  border-radius: 35px;
  background-color: ${(props) =>
    props.$isSelected ? "#fff" : "rgba(0, 0, 0, 0.1)"};
  color: ${(props) => (props.$isSelected ? "#3636ad" : "#fff")};
  cursor: pointer;
  overflow: hidden;
  border: none;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.05) 0px 8px 10px;
  }

  @media (max-width: 768px) {
    width: 45%;
  }
  @media (max-width: 480px) {
    width: 100%;
  }

  p {
    margin: 0;
  }
`;

const SecondElement = styled.div`
  flex: 0.65;

  @media (max-width: 1024px) {
    flex: initial;
  }
  @media (max-width: 768px) {
    width: 100%;
  }
`;

const StepsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
`;

const Step = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  color: #fff;

  @media (max-width: 768px) {
    flex-direction: row;
    text-align: left;
    gap: 1.5rem;
    align-items: flex-start;
  }
`;

const StepContent = styled.div`
  @media (max-width: 768px) {
    flex: 1;
  }
`;

const StyledH1 = styled.h1`
  font-size: 2.5rem;
  color: #fff;
  margin-bottom: 1rem;
  margin-top: 0;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StyledH2 = styled.h2`
  font-weight: 600;
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: #fff;

  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin-bottom: 0.3rem;
  }
`;

const StyledP = styled.p`
  font-weight: 400;
  margin: 0;
  font-family: "Proxima Soft", sans-serif;
  line-height: 1.5;
  color: inherit;

  @media (max-width: 768px) {
    font-size: 0.9rem;
  }
`;

const StepNumber = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.2);
    font-size: 1.2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #fff;
    flex-shrink: 0;
  }
`;

const StyledIcon = styled.div`
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2rem;
  margin-bottom: 1rem;
  display: inline-flex;

  svg {
    width: 48px;
    height: 48px;
    color: #fff;
    stroke-width: 2;
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
    margin-bottom: 0;
    svg {
      width: 40px;
      height: 40px;
    }
  }
`;

// --- HowItWorks Component ---
const HowItWorks = () => {
  const [selectedButton, setSelectedButton] = useState("forStudents");

  const handleButtonClick = (button) => {
    setSelectedButton(button);
  };

  const getStepTitle = (stepNumber) => {
    if (selectedButton === "forTutors") {
      switch (stepNumber) {
        case 1:
          return "List your classes";
        case 2:
          return "Accept bookings";
        case 3:
          return "Receive payment";
        default:
          return "";
      }
    } else {
      switch (stepNumber) {
        case 1:
          return "Discover";
        case 2:
          return "Book";
        case 3:
          return "Enjoy";
        default:
          return "";
      }
    }
  };

  const getStepDescription = (stepNumber) => {
    if (selectedButton === "forTutors") {
      switch (stepNumber) {
        case 1:
          return "Create a listing for your class with detailed information about the subject, schedule, pricing, and subclasses.";
        case 2:
          return "Review and approve student bookings. You can also communicate with them directly for any clarifications.";
        case 3:
          return "Conduct your class as scheduled. Once completed, receive payment directly to your bank account.";
        default:
          return "";
      }
    } else {
      switch (stepNumber) {
        case 1:
          return "Search for nearby classes, explore their features, read reviews, and find the best match for you.";
        case 2:
          return "Once your booking is approved by the class provider, you're good to go. Some classes may even offer instant booking.";
        case 3:
          return "You will receive the precise address, entry instructions, and everything you need for your class.";
        default:
          return "";
      }
    }
  };

  const getStepIcon = (step) => {
    if (selectedButton === "forTutors") {
      switch (step) {
        case 1:
          return <ImagePlus />;
        case 2:
          return <Wrench />;
        case 3:
          return <DollarSign />;
        default:
          return <Search />;
      }
    } else {
      switch (step) {
        case 1:
          return <Search />;
        case 2:
          return <Calendar />;
        case 3:
          return <Star />;
        default:
          return <Search />;
      }
    }
  };

  return (
    <HowItWorksWrapper aria-labelledby="how-it-works-title">
      <TopPattern />
      <BottomPattern />
      <ContentContainer>
        <FirstElement>
          <StyledH1 id="how-it-works-title">
            How does ClassEasily work?
          </StyledH1>
          <ButtonWrapper>
            <RoundedButton
              onClick={() => handleButtonClick("forStudents")}
              $isSelected={selectedButton === "forStudents"}
              whileTap={{ scale: 0.95 }}
              aria-pressed={selectedButton === "forStudents"}
            >
              <StyledP>for Students</StyledP>
            </RoundedButton>
            <RoundedButton
              onClick={() => handleButtonClick("forTutors")}
              $isSelected={selectedButton === "forTutors"}
              whileTap={{ scale: 0.95 }}
              aria-pressed={selectedButton === "forTutors"}
            >
              <StyledP>for Businesses</StyledP>
            </RoundedButton>
          </ButtonWrapper>
        </FirstElement>
        <SecondElement>
          <StepsWrapper role="list">
            <AnimatePresence mode="wait">
              {[1, 2, 3].map((step, index) => (
                <Step
                  key={`${selectedButton}-${step}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  role="listitem"
                >
                  <StepNumber>{step}</StepNumber>
                  <StyledIcon>{getStepIcon(step)}</StyledIcon>
                  <StepContent>
                    <StyledH2>{getStepTitle(step)}</StyledH2>
                    <StyledP>{getStepDescription(step)}</StyledP>
                  </StepContent>
                </Step>
              ))}
            </AnimatePresence>
          </StepsWrapper>
        </SecondElement>
      </ContentContainer>
    </HowItWorksWrapper>
  );
};

export default HowItWorks;
