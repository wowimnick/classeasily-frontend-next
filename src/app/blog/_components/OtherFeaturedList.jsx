"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";
import styled from "styled-components";

const ListHeader = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 24px;
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  padding-bottom: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
`;

const ThumbLink = styled(Link)`
  flex-shrink: 0;
  width: 72px;
  height: 72px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  background: #e5e7eb;

  img {
    transition: transform 0.3s ease;
  }
  &:hover img {
    transform: scale(1.05);
  }
`;

const TitleLink = styled(Link)`
  margin-left: 16px;
  flex: 1;
  min-width: 0;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  &:hover {
    color: #4b5563;
  }
`;

const OtherFeaturedList = ({ posts }) => {
  if (!posts?.length) return null;
  return (
    <>
      <ListHeader>Other featured posts</ListHeader>
      <List>
        {posts.map((post) => (
          <Row key={post.slug}>
            <ThumbLink href={`/blog/${post.slug}`}>
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                sizes="72px"
                style={{ objectFit: "cover" }}
              />
            </ThumbLink>
            <TitleLink href={`/blog/${post.slug}`}>{post.title}</TitleLink>
          </Row>
        ))}
      </List>
    </>
  );
};

export default OtherFeaturedList;
