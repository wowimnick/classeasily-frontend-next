"use client";

import React, { useState } from "react";
import styled from "styled-components";
import {
  Search,
  MapPin,
  Briefcase,
  X,
  Upload,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/homepage/Footer";

const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #fafafa;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 5rem 24px 80px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const PageHeader = styled.div`
  margin-bottom: 40px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #222;
  margin: 0 0 8px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  color: #666;
  margin: 0;
`;

const FiltersSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 32px;
`;

const SearchBar = styled.div`
  display: flex;
  align-items: center;
  max-width: 400px;
  gap: 16px;
  padding: 12px 20px;
  border: 1px solid #eee;
  border-radius: 30px;
  margin-bottom: 20px;

  &:focus-within {
    border-color: #db0000;
    box-shadow: 0 0 0 2px rgba(125, 20, 20, 0.1);
  }
`;

const SearchInput = styled.input`
  border: none;
  flex: 1;
  font-size: 16px;
  outline: none;

  &::placeholder {
    color: #999;
  }
`;

const FilterTags = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const FilterTag = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid #eee;
  background: ${(props) => (props.$active ? "#db0000" : "white")};
  color: ${(props) => (props.$active ? "white" : "#666")};
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #db0000;
    color: ${(props) => (props.$active ? "white" : "#7d1414")};
  }
`;

const JobsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const JobCard = styled.a`
  display: flex;
  flex-direction: column;
  padding: 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  text-decoration: none;
  color: inherit;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const JobTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin: 0 0 16px;
`;

const JobMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 16px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
`;

const JobDescription = styled.p`
  color: #666;
  font-size: 15px;
  line-height: 1.5;
  margin: 0 0 20px;
`;

const JobTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
`;

const JobTag = styled.span`
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 13px;
  color: #666;
`;
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  background: white;
  border-radius: 16px 16px 0 0;
  z-index: 1;
`;

const ModalClose = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;

  &:hover {
    background: #f5f5f5;
  }
`;

const ModalBody = styled.div`
  padding: 24px;
`;

const JobSection = styled.div`
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin: 0 0 16px;
`;

const List = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: #666;
  line-height: 1.6;

  li {
    margin-bottom: 8px;
  }
`;

const ApplicationForm = styled.div`
  display: ${(props) => (props.$active ? "block" : "none")};
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 24px;
`;

const Step = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => (props.$active ? "#c10303" : "#eee")};
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #222;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;

  &:focus {
    outline: none;
    border-color: #7d1414;
    box-shadow: 0 0 0 2px rgba(125, 20, 20, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  box-sizing: border-box;
  border-radius: 8px;
  font-size: 16px;
  min-height: 120px;
  resize: vertical;

  &:focus {
    outline: none;
    border-color: #c10303;
    box-shadow: 0 0 0 2px rgba(125, 20, 20, 0.1);
  }
`;

const FileUpload = styled.div`
  border: 2px dashed #eee;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #c10303;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
`;

const Button = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) =>
    props.$primary
      ? `
    background: #c10303;
    color: white;
    border: none;

    &:hover {
      background: #db0000;
    }
  `
      : `
    background: white;
    color: #666;
    border: 1px solid #eee;

    &:hover {
      border-color: #7d1414;
      color: #7d1414;
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function JobsPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplication, setShowApplication] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
    coverLetter: "",
    portfolio: "",
    linkedIn: "",
  });

  const departments = [
    "All",
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Customer Success",
  ];

  const jobs = [
    {
      id: "fe-eng-sf", // Example unique ID
      title: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      type: "Full-time",
      department: "Engineering",
      description:
        "Join our engineering team to build the future of online education. You will work on challenging problems and create delightful user experiences.",
      salary: "$130,000 - $180,000",
      responsibilities: [
        "Build and maintain high-quality web applications using React and TypeScript",
        "Collaborate with designers to implement pixel-perfect, responsive interfaces",
        "Write clean, maintainable, and well-tested code",
        "Mentor junior developers and contribute to technical decisions",
      ],
      requirements: [
        "5+ years of experience in frontend development",
        "Strong proficiency in React, TypeScript, and modern JavaScript",
        "Experience with state management solutions (Redux, MobX, etc.)",
        "Understanding of web performance optimization techniques",
        "Excellent problem-solving and communication skills",
      ],
      benefits: [
        "Competitive salary and equity package",
        "Health, dental, and vision insurance",
        "Unlimited PTO",
        "Remote work flexibility",
        "401(k) matching",
        "Learning and development budget",
      ],
      tags: ["React", "TypeScript", "Remote-friendly"],
    },
    {
      id: "pm-ny", // Example unique ID
      title: "Product Manager",
      location: "New York, NY",
      type: "Full-time",
      department: "Product",
      description:
        "Lead product strategy and execution for our core educational platform. Work closely with engineering, design, and business teams.",
      salary: "$120,000 - $160,000",
      responsibilities: [
        "Define product vision and roadmap",
        "Conduct user research and analyze data to inform product decisions",
        "Work with engineering and design teams to deliver features",
        "Create and maintain product documentation",
      ],
      requirements: [
        "4+ years of product management experience",
        "Experience with educational technology products",
        "Strong analytical and problem-solving abilities",
        "Excellent communication and leadership skills",
      ],
      benefits: [
        "Competitive salary and equity",
        "Health insurance coverage",
        "Flexible work hours",
        "Professional development budget",
        "Company-sponsored events",
      ],
      tags: ["EdTech", "Product Strategy", "Leadership"],
    },
    {
      id: "uiux-remote", // Example unique ID
      title: "UI/UX Designer",
      location: "Remote",
      type: "Full-time",
      department: "Design",
      description:
        "Create beautiful, intuitive interfaces for our educational platform. Focus on user experience and accessibility.",
      salary: "$90,000 - $130,000",
      responsibilities: [
        "Design user interfaces for web and mobile applications",
        "Create wireframes, prototypes, and high-fidelity mockups",
        "Conduct user testing and iterate on designs",
        "Maintain design system documentation",
      ],
      requirements: [
        "3+ years of UI/UX design experience",
        "Proficiency in Figma and other design tools",
        "Understanding of accessibility standards",
        "Portfolio demonstrating strong visual design skills",
      ],
      benefits: [
        "Remote-first culture",
        "Health and wellness benefits",
        "Equipment allowance",
        "Flexible vacation policy",
      ],
      tags: ["UI/UX", "Figma", "Remote"],
    },
  ];

  const filteredJobs =
    activeFilter === "All"
      ? jobs
      : jobs.filter((job) => job.department === activeFilter);

  // --- Generate JobPosting Schema ---
  const generateJobPostingSchema = () => {
    if (!filteredJobs || filteredJobs.length === 0) {
      return null;
    }

    const jobSchemas = filteredJobs.map((job) => {
      // Helper to parse salary string (basic example, make robust)
      const parseSalary = (salaryString) => {
        const numbers = salaryString?.match(/\d+/g)?.map(Number);
        if (!numbers || numbers.length === 0)
          return { min: undefined, max: undefined };
        if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
        return { min: Math.min(...numbers), max: Math.max(...numbers) };
      };
      const parsedSalary = parseSalary(job.salary);

      // Helper to parse location
      const parseLocation = (locationString) => {
        if (!locationString)
          return { city: undefined, region: undefined, country: "US" }; // Default country
        const parts = locationString.split(",");
        const city = parts[0]?.trim();
        const region = parts[1]?.trim();
        // Basic country guess - improve if needed
        const country =
          region === "CA" ||
          region === "QC" ||
          region === "BC" ||
          region === "AB" ||
          region === "MB" ||
          region === "NS" ||
          region === "SK"
            ? "CA"
            : "US";
        return { city, region, country };
      };
      const parsedLocation = parseLocation(job.location);

      return {
        "@context": "https://schema.org/",
        "@type": "JobPosting",
        title: job.title,
        description: `${
          job.description
        }<br/><br/><strong>Responsibilities:</strong><ul>${job.responsibilities
          .map((r) => `<li>${r}</li>`)
          .join("")}</ul><strong>Requirements:</strong><ul>${job.requirements
          .map((r) => `<li>${r}</li>`)
          .join("")}</ul><strong>Benefits:</strong><ul>${job.benefits
          .map((b) => `<li>${b}</li>`)
          .join("")}</ul>`,
        hiringOrganization: {
          "@type": "Organization",
          name: "Classeasily",
          sameAs: "https://www.classeasily.com", // Replace with your domain
          logo: "https://www.classeasily.com/logo.png", // Replace with your logo URL
        },
        datePosted: new Date().toISOString().split("T")[0], // Replace with actual post date
        validThrough: new Date(new Date().setDate(new Date().getDate() + 60))
          .toISOString()
          .split("T")[0], // Example: 60 days validity
        employmentType:
          job.type?.toUpperCase().replace(" ", "_").replace("-", "_") ||
          "FULL_TIME", // Default to FULL_TIME
        jobLocation: {
          "@type": "Place",
          ...(job.location?.toLowerCase() === "remote"
            ? { remote: true }
            : {
                address: {
                  "@type": "PostalAddress",
                  addressLocality: parsedLocation.city,
                  addressRegion: parsedLocation.region,
                  addressCountry: parsedLocation.country,
                },
              }),
        },
        ...(parsedSalary.min && {
          baseSalary: {
            "@type": "MonetaryAmount",
            currency: "USD", // TODO: Make currency dynamic
            value: {
              "@type": "QuantitativeValue",
              minValue: parsedSalary.min,
              maxValue: parsedSalary.max || parsedSalary.min, // Use min if max not found
              unitText: "YEAR", // Assume YEAR, adjust if needed
            },
          },
        }),
        identifier: {
          "@type": "PropertyValue",
          name: "Classeasily Job ID",
          value:
            job.id || `JOB-${job.title.replace(/\s+/g, "-").toLowerCase()}`, // Use provided ID or generate one
        },
      };
    });

    return jobSchemas;
  };

  const jobPostingSchemas = generateJobPostingSchema();

  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowApplication(false);
    setCurrentStep(1);
  };

  const handleCloseModal = () => {
    setSelectedJob(null);
    setShowApplication(false);
    setCurrentStep(1);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFormData((prev) => ({ ...prev, resume: file }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    handleCloseModal();
  };

  return (
    <>
      <title>Open Positions | Careers at Classeasily</title>
      <meta
        name="description"
        content="Join our mission to transform education. Explore open roles in engineering, product, design, and more at Classeasily."
      />
      <link
        rel="canonical"
        href="https://www.classeasily.com/careers/positions"
      />{" "}
      {/* Replace domain */}
      {/* Add JobPosting schema for each job */}
      {jobPostingSchemas && jobPostingSchemas.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(jobPostingSchemas)}
        </script>
      )}
      <PageWrapper>
        <Header
          dropdownButtonOutlineColor="#000"
          dropdownSvgColor="#000"
          logoColor="#ab0606"
          logoTitleColor="#ab0606"
        />
        <MainContent>
          <PageHeader>
            <Title>Open Positions</Title>
            <Subtitle>
              Join our mission to transform education worldwide
            </Subtitle>
          </PageHeader>

          <FiltersSection>
            <SearchBar>
              <Search size={20} color="#999" />
              <SearchInput placeholder="Search positions..." />
            </SearchBar>

            <FilterTags>
              {departments.map((dept) => (
                <FilterTag
                  key={dept}
                  $active={activeFilter === dept}
                  onClick={() => setActiveFilter(dept)}
                >
                  {dept}
                </FilterTag>
              ))}
            </FilterTags>
          </FiltersSection>

          <JobsGrid>
            {filteredJobs.map((job, index) => (
              // Changed JobCard to div as 'a' tag isn't appropriate for onClick handler opening a modal
              <JobCard
                as="div"
                key={job.id || index}
                onClick={() => handleJobClick(job)}
              >
                <JobTitle>{job.title}</JobTitle>
                <JobMeta>
                  <MetaItem>
                    <MapPin size={16} />
                    {job.location}
                  </MetaItem>
                  <MetaItem>
                    <Briefcase size={16} />
                    {job.type}
                  </MetaItem>
                </JobMeta>
                <JobDescription>{job.description}</JobDescription>
                <JobTags>
                  {job.tags.map((tag, tagIndex) => (
                    <JobTag key={tagIndex}>{tag}</JobTag>
                  ))}
                </JobTags>
              </JobCard>
            ))}
          </JobsGrid>
        </MainContent>

        {selectedJob && (
          <Modal>
            <ModalContent>
              <ModalHeader>
                <JobTitle>{selectedJob.title}</JobTitle>
                <JobMeta>
                  <MetaItem>
                    <MapPin size={16} />
                    {selectedJob.location}
                  </MetaItem>
                  <MetaItem>
                    <Briefcase size={16} />
                    {selectedJob.type}
                  </MetaItem>
                </JobMeta>
                <ModalClose onClick={handleCloseModal}>
                  <X size={20} />
                </ModalClose>
              </ModalHeader>

              <ModalBody>
                {!showApplication ? (
                  <>
                    <JobSection>
                      <SectionTitle>Salary Range</SectionTitle>
                      <p>{selectedJob.salary}</p>
                    </JobSection>

                    <JobSection>
                      <SectionTitle>About the Role</SectionTitle>
                      <p>{selectedJob.description}</p>
                    </JobSection>

                    <JobSection>
                      <SectionTitle>Responsibilities</SectionTitle>
                      <List>
                        {selectedJob.responsibilities.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </List>
                    </JobSection>

                    <JobSection>
                      <SectionTitle>Requirements</SectionTitle>
                      <List>
                        {selectedJob.requirements.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </List>
                    </JobSection>

                    <JobSection>
                      <SectionTitle>Benefits</SectionTitle>
                      <List>
                        {selectedJob.benefits.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </List>
                    </JobSection>

                    <Button $primary onClick={() => setShowApplication(true)}>
                      Apply for this position
                    </Button>
                  </>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <StepIndicator>
                      <Step $active={currentStep === 1} />
                      <Step $active={currentStep === 2} />
                      <Step $active={currentStep === 3} />
                    </StepIndicator>

                    <ApplicationForm $active={currentStep === 1}>
                      <FormGroup>
                        <Label>Full Name *</Label>
                        <Input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                    </ApplicationForm>

                    <ApplicationForm $active={currentStep === 2}>
                      <FormGroup>
                        <Label>Resume/CV *</Label>
                        <FileUpload>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileUpload}
                            style={{ display: "none" }}
                            id="resume-upload"
                          />
                          <label htmlFor="resume-upload">
                            <Upload size={24} style={{ marginBottom: "8px" }} />
                            <p>Click to upload or drag and drop</p>
                            <p style={{ fontSize: "14px", color: "#666" }}>
                              PDF, DOC, DOCX (max 5MB)
                            </p>
                          </label>
                        </FileUpload>
                      </FormGroup>
                      <FormGroup>
                        <Label>Cover Letter</Label>
                        <TextArea
                          name="coverLetter"
                          placeholder="Why are you interested in this role?"
                          value={formData.coverLetter}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                    </ApplicationForm>

                    <ApplicationForm $active={currentStep === 3}>
                      <FormGroup>
                        <Label>Portfolio URL</Label>
                        <Input
                          type="url"
                          name="portfolio"
                          placeholder="https://"
                          value={formData.portfolio}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                      <FormGroup>
                        <Label>LinkedIn Profile</Label>
                        <Input
                          type="url"
                          name="linkedIn"
                          placeholder="https://linkedin.com/in/"
                          value={formData.linkedIn}
                          onChange={handleInputChange}
                        />
                      </FormGroup>
                    </ApplicationForm>

                    <ButtonGroup>
                      {currentStep > 1 && (
                        <Button type="button" onClick={handleBack}>
                          <ArrowLeft size={16} style={{ marginRight: "8px" }} />
                          Back
                        </Button>
                      )}
                      {currentStep < 3 ? (
                        <Button type="button" $primary onClick={handleNext}>
                          Next
                          <ArrowRight size={16} style={{ marginLeft: "8px" }} />
                        </Button>
                      ) : (
                        <Button type="submit" $primary>
                          Submit Application
                        </Button>
                      )}
                    </ButtonGroup>
                  </form>
                )}
              </ModalBody>
            </ModalContent>
          </Modal>
        )}

        <Footer />
      </PageWrapper>
    </>
  );
}
