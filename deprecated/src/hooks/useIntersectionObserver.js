'use client';

import { useState, useEffect, useRef } from 'react';

const useIntersectionObserver = (elementRef, { threshold = 0, root = null, rootMargin = '0%' }, triggerOnce = false) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    const node = elementRef?.current; 

    const handleIntersect = (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        if (triggerOnce && observerRef.current && node) {
          observerRef.current.unobserve(node);
        }
      } else {
        if (!triggerOnce) {
          setIsIntersecting(false);
        }
      }
    };

    if (node) {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      observerRef.current = new IntersectionObserver(handleIntersect, {
        threshold,
        root,
        rootMargin,
      });

      observerRef.current.observe(node);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [elementRef, threshold, root, rootMargin, triggerOnce]);

  return isIntersecting;
};

export default useIntersectionObserver;