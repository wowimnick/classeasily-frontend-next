"use client";

import styled from "styled-components";

const ContentContainer = styled.main`
  flex-grow: 1;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  padding: 4rem 2rem 6rem 2rem;

  @media (max-width: 768px) {
    padding: 3rem 1rem 4rem 1rem;
  }
`;

const Title = styled.h1`
  font-size: clamp(2rem, 5vw, 2.8rem);
  font-weight: 800;
  color: #000;
  margin-bottom: 1rem;
  text-align: center;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorderSecondary};
  padding-bottom: 1.5rem;
`;

const LastUpdated = styled.p`
  font-size: 0.9rem;
  color: #000;
  text-align: center;
  margin-bottom: 3rem;
`;

const ContentBody = styled.div`
  color: #000;
`;

const Section = styled.section`
  margin-bottom: 3rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${(props) => props.theme.token.colorBorder};

  @media (max-width: 768px) {
    font-size: 1.3rem;
  }
`;

const SubHeading = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  color: #000;
  margin-top: 2rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const Paragraph = styled.p`
  font-size: 1rem;
  line-height: 1.7;
  color: #000;
  margin-bottom: 1.25rem;

  a {
    color: ${(props) => props.theme.token.colorPrimary};
    font-weight: 500;
    text-decoration: underline;
    text-decoration-color: ${(props) => props.theme.token.colorPrimary}50;
    transition: color 0.2s ease, text-decoration-color 0.2s ease;

    &:hover {
      color: ${(props) => props.theme.token.colorPrimaryHover};
      text-decoration-color: ${(props) => props.theme.token.colorPrimaryHover};
    }
  }
`;

const List = styled.ul`
  list-style: disc;
  padding-left: 2rem;
  margin-bottom: 1.25rem;
  color: #000;
`;

const ListItem = styled.li`
  font-size: 1rem;
  line-height: 1.7;
  margin-bottom: 0.75rem;

  strong {
    font-weight: 600;
    color: #000;
  }
`;

export default function LegalContent({ content }) {
  return (
    <ContentContainer>
      <Title>{content.title}</Title>
      <LastUpdated>Last Updated: {content.lastUpdated}</LastUpdated>
      <ContentBody>
        {content.sections.map((section, index) => (
          <Section key={index}>
            <SectionTitle>{section.title}</SectionTitle>
            {section.content.map((item, itemIndex) => {
              if (item.type === "p") {
                return (
                  <Paragraph
                    key={itemIndex}
                    dangerouslySetInnerHTML={{ __html: item.text }}
                  />
                );
              } else if (item.type === "h3") {
                return <SubHeading key={itemIndex}>{item.text}</SubHeading>;
              } else if (item.type === "ul" && Array.isArray(item.items)) {
                return (
                  <List key={itemIndex}>
                    {item.items.map((listItem, listItemIndex) => (
                      <ListItem
                        key={listItemIndex}
                        dangerouslySetInnerHTML={{ __html: listItem }}
                      />
                    ))}
                  </List>
                );
              }
              return null;
            })}
          </Section>
        ))}
      </ContentBody>
    </ContentContainer>
  );
}
