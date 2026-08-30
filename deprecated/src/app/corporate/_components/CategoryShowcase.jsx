"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { collectionService } from "@/services/apiService";
import { motion, useReducedMotion } from "framer-motion";

const Section = styled.section`
  padding: 88px 1.5rem 96px;
  background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
`;

const Inner = styled.div`
  max-width: 1120px;
  margin: 0 auto;
`;

const Title = styled.h2`
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.65rem;
  letter-spacing: -0.02em;
`;

const Sub = styled.p`
  margin: 0 0 2.5rem;
  color: #64748b;
  max-width: 42rem;
  line-height: 1.6;
  font-size: 1.05rem;
`;

const Grid = styled.div`
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
`;

const Tile = styled(motion.div)`
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 14px 40px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 22px 50px rgba(15, 23, 42, 0.1);
  }
`;

const TileLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const TileMedia = styled.div`
  position: relative;
  aspect-ratio: 16 / 10;
  background-size: cover;
  background-position: center;
`;

const TileMediaOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 50%, rgba(255, 255, 255, 0.5) 100%);
`;

const TileBody = styled.div`
  padding: 1.1rem 1.15rem 1.25rem;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const TileName = styled.h3`
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
`;

const TileDesc = styled.p`
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #64748b;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const shimmer = keyframes`
  0% { opacity: 0.5; }
  100% { opacity: 1; }
`;

const Skeleton = styled.div`
  border-radius: 18px;
  aspect-ratio: 16 / 11;
  background: linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%);
  background-size: 200% 100%;
  animation: ${shimmer} 1.2s ease-in-out infinite alternate;
`;

function fallbackGradient(i) {
  const stops = [
    "linear-gradient(135deg, #fce7f3, #e0e7ff)",
    "linear-gradient(135deg, #cffafe, #e0f2fe)",
    "linear-gradient(135deg, #fef3c7, #ffedd5)",
    "linear-gradient(135deg, #d1fae5, #ecfccb)",
  ];
  return stops[i % stops.length];
}

export default function CategoryShowcase() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await collectionService.listByPlacement("i_want");
        if (!cancelled) setCollections(rows || []);
      } catch {
        if (!cancelled) setCollections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Section id="categories">
      <Inner>
        <Title>Built for every team moment</Title>
        <Sub>
          Explore the same curated directions guests use on ClassEasily — then tell us
          which lanes fit your culture goals and we’ll narrow hosts in your city.
        </Sub>
        {loading ? (
          <Grid>
            {[1, 2, 3, 4].map((k) => (
              <Skeleton key={k} aria-hidden />
            ))}
          </Grid>
        ) : (
          <Grid>
            {collections.slice(0, 12).map((c, i) => (
              <Tile
                key={c.slug || c.id || i}
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                whileInView={reduceMotion ? false : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ delay: reduceMotion ? 0 : i * 0.04, duration: 0.45 }}
              >
                <TileLink
                  href={`/explore?collection=${encodeURIComponent(c.slug || "")}`}
                >
                  <TileMedia
                    style={{
                      backgroundImage: c.image_medium_url
                        ? `url(${c.image_medium_url})`
                        : "none",
                      background:
                        c.image_medium_url || c.color
                          ? c.image_medium_url
                            ? undefined
                            : c.color
                          : fallbackGradient(i),
                    }}
                  >
                    <TileMediaOverlay />
                  </TileMedia>
                  <TileBody>
                    <TileName>{c.name}</TileName>
                    {c.description ? (
                      <TileDesc>{c.description}</TileDesc>
                    ) : (
                      <TileDesc>Browse experiences in this collection.</TileDesc>
                    )}
                  </TileBody>
                </TileLink>
              </Tile>
            ))}
          </Grid>
        )}
      </Inner>
    </Section>
  );
}
