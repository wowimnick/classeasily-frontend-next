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

  @media (max-width: 768px) {
    height: 180px;
  }
`;

const TopPattern = styled(Pattern)`
  top: -20px;

  @media (max-width: 768px) {
    top: -10px;
  }
`;

const BottomPattern = styled(Pattern)`
  bottom: -20px;
  transform: rotate(180deg);

  @media (max-width: 768px) {
    bottom: -10px;
  }
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
    padding: 8rem 0;
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
    gap: 0.75rem;
  }
  @media (max-width: 768px) {
    width: 100%;
    gap: 1rem;
  }
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    width: 100%;
    max-width: 400px;
    gap: 0.625rem;
  }
`;

const RoundedButton = styled(motion.button)`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.2rem;
  border-radius: 35px;
  background-color: ${(props) =>
    props.$isSelected ? "#fff" : "rgba(0, 0, 0, 0.1)"};
  color: ${(props) => (props.$isSelected ? "#3636ad" : "#fff")};
  cursor: pointer;
  border: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  flex: 1;
  white-space: nowrap;
  min-width: max-content;

  &:hover {
    box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 12px;
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 0.75rem 1.25rem;
    font-size: 0.9rem;
  }

  @media (max-width: 480px) {
    padding: 0.7rem 1rem;
    font-size: 0.875rem;
  }
`;

const SecondElement = styled.div`
  flex: 0.65;
  width: 100%;

  @media (max-width: 1024px) {
    flex: initial;
    max-width: 800px;
  }
`;

const StepsWrapper = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
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
    gap: 1rem;
    align-items: flex-start;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 16px;
    backdrop-filter: blur(10px);
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
  margin: 0 0 0.5rem 0;
  font-weight: 700;
  line-height: 1.2;

  @media (max-width: 1024px) {
    font-size: 2.25rem;
  }

  @media (max-width: 768px) {
    font-size: 1.875rem;
  }

  @media (max-width: 480px) {
    font-size: 1.625rem;
  }
`;

const StyledH2 = styled.h2`
  font-weight: 600;
  font-size: 1.25rem;
  margin: 0 0 0.375rem 0;
  color: #fff;

  @media (max-width: 768px) {
    font-size: 1.125rem;
    margin-bottom: 0.25rem;
  }

  @media (max-width: 480px) {
    font-size: 1.05rem;
  }
`;

const StyledP = styled.p`
  font-weight: 400;
  margin: 0;
  line-height: 1.5;
  color: inherit;
  font-size: 0.95rem;

  @media (max-width: 768px) {
    font-size: 0.875rem;
    line-height: 1.45;
  }

  @media (max-width: 480px) {
    font-size: 0.8125rem;
  }
`;

const StepNumber = styled.div`
  display: none;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    min-width: 28px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.25);
    font-size: 1rem;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
  }
`;

const StyledIcon = styled.div`
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1.5rem;
  margin-bottom: 1rem;
  display: inline-flex;

  svg {
    width: 40px;
    height: 40px;
    color: #fff;
    stroke-width: 2;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    margin-bottom: 0;
    background-color: rgba(0, 0, 0, 0.15);

    svg {
      width: 28px;
      height: 28px;
      stroke-width: 2.25;
    }
  }
`;

// --- HowItWorks Component ---
const HowItWorks = () => {
  const [selectedButton, setSelectedButton] = useState("forExplorers");

  const handleButtonClick = (button) => {
    setSelectedButton(button);
  };

  const getStepTitle = (stepNumber) => {
    if (selectedButton === "forHosts") {
      switch (stepNumber) {
        case 1:
          return "Share your passion";
        case 2:
          return "Fill your spots";
        case 3:
          return "Get paid to host";
        default:
          return "";
      }
    } else {
      switch (stepNumber) {
        case 1:
          return "Find your thing";
        case 2:
          return "Grab a spot";
        case 3:
          return "Have a blast";
        default:
          return "";
      }
    }
  };

  const getStepDescription = (stepNumber) => {
    if (selectedButton === "forHosts") {
      switch (stepNumber) {
        case 1:
          return "Create a listing for your class or experience with detailed information about what you're offering.";
        case 2:
          return "You will recieve a notification instantly when a student books your class. You can also communicate with them directly for any clarifications.";
        case 3:
          return "Conduct your session as scheduled. Once completed, receive payment directly to your bank account.";
        default:
          return "";
      }
    } else {
      switch (stepNumber) {
        case 1:
          return "Search for fun nearby experiences and classes, read reviews, and find the best match for you.";
        case 2:
          return "Once you've found what you like, book your spot by selecting a date and time that works for you, and you're good to go.";
        case 3:
          return "You will receive the precise address, entry instructions, and everything you need for your booking.";
        default:
          return "";
      }
    }
  };

  const getStepIcon = (step) => {
    if (selectedButton === "forHosts") {
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
              onClick={() => handleButtonClick("forExplorers")}
              $isSelected={selectedButton === "forExplorers"}
              whileTap={{ scale: 0.97 }}
              aria-pressed={selectedButton === "forExplorers"}
            >
              for Explorers
            </RoundedButton>
            <RoundedButton
              onClick={() => handleButtonClick("forHosts")}
              $isSelected={selectedButton === "forHosts"}
              whileTap={{ scale: 0.97 }}
              aria-pressed={selectedButton === "forHosts"}
            >
              for Hosts
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
