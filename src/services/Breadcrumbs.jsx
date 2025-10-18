// src/services/Breadcrumbs.jsx
"use client";

import React, { Suspense } from "react";
import { Breadcrumb } from "antd";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styled from "styled-components";

const BreadcrumbWrapper = styled.div`
  padding: 12px 0;
  font-size: 13px;

  .ant-breadcrumb-link a {
    color: ${(props) => props.theme.token.colorTextSecondary};
    transition: color 0.2s ease;
    &:hover {
      color: ${(props) => props.theme.token.colorPrimary};
    }
  }

  .ant-breadcrumb-separator {
    color: ${(props) => props.theme.token.colorTextQuaternary};
  }

  .ant-breadcrumb li:last-child .ant-breadcrumb-link {
    color: ${(props) => props.theme.token.colorTextTertiary};
    font-weight: 500;
  }
`;

const formatCrumbText = (slug) => {
  if (!slug) return "";
  return slug.replace(/-/g, " ").replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
};

// Separate component that uses useSearchParams
function BreadcrumbsContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (pathname === "/") {
    return null;
  }

  const pathSnippets = pathname.split("/").filter((i) => i);

  const items = [];
  items.push({ key: "home", title: <Link href="/">Home</Link> });

  if (pathSnippets[0] === "explore") {
    const locationQuery = searchParams.get("location");
    const categoryQuery = searchParams.get("category");
    const subcategoryQuery = searchParams.get("subcategory");
    const tagQuery = searchParams.get("tag");

    // Base explore link
    items.push({
      key: "explore",
      title: <Link href="/explore">Explore</Link>,
    });

    // FIXED: Better location display from query param
    if (locationQuery) {
      const locationParams = new URLSearchParams();
      locationParams.set("location", locationQuery);

      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      if (lat) locationParams.set("lat", lat);
      if (lng) locationParams.set("lng", lng);

      // FIXED: Parse location better for display
      // "Toronto, ON" -> show as is
      // "Canada" -> show as is but it's too broad
      const displayLocation = locationQuery.includes(",")
        ? locationQuery
        : formatCrumbText(locationQuery);

      items.push({
        key: "location",
        title: (
          <Link href={`/explore?${locationParams.toString()}`}>
            {displayLocation}
          </Link>
        ),
      });
    }

    if (categoryQuery && categoryQuery !== "all") {
      const categoryParams = new URLSearchParams(searchParams.toString());
      categoryParams.delete("subcategory");

      items.push({
        key: "category",
        title: (
          <Link href={`/explore?${categoryParams.toString()}`}>
            {formatCrumbText(categoryQuery)}
          </Link>
        ),
      });

      if (subcategoryQuery) {
        items.push({
          key: "subcategory",
          title: (
            <Link href={`/explore?${searchParams.toString()}`}>
              {formatCrumbText(subcategoryQuery)}
            </Link>
          ),
        });
      }
    }

    if (tagQuery && !categoryQuery) {
      items.push({
        key: "tag",
        title: formatCrumbText(tagQuery),
      });
    }
  } else {
    let builtPath = "";
    pathSnippets.forEach((snippet) => {
      builtPath += `/${snippet}`;
      items.push({
        key: builtPath,
        title: <Link href={builtPath}>{formatCrumbText(snippet)}</Link>,
      });
    });
  }

  return (
    <BreadcrumbWrapper>
      <Breadcrumb items={items} />
    </BreadcrumbWrapper>
  );
}

const Breadcrumbs = () => {
  return (
    <Suspense fallback={<div style={{ height: "37px" }} />}>
      <BreadcrumbsContent />
    </Suspense>
  );
};

export default Breadcrumbs;
