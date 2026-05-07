import React from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import styles from "./Testimonials.module.css";
import TestimonialsClient from "./TestimonialsClient";

// --- Static Assets ---
const TrustpilotLogo = () => (
  <svg
    width="88"
    height="22"
    viewBox="0 0 100 24"
    fill="none"
    aria-label="Trustpilot"
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

// --- Data ---
const testimonialData = [
  {
    id: 1,
    rating: 5,
    date: "20 April 2023",
    quote:
      "My friend and I attended their cocktail making class and it was out of this world fantastic! The mixologist Scott is amazing—fun, funny and knowledgeable!",
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
      "If you're looking to book a private event for a hands-on experience in pottery, this studio is the place to go! The instructors were so helpful, patient, kind and professional.",
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
      "I just took a sushi making class with my colleagues and it definitely exceeded my expectations! Our sushi kits were delivered right to our homes with fresh ingredients.",
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
      "Not only is their menu artful, the drinks are creative and tasteful without seeming gimmicky. The staff were so patient and helpful.",
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
      "Kingi is a great teacher, an artist, and a beautiful human. You dive right into hands-on actions while learning step by step.",
    userName: "Crypto Biker",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face",
    userTitle: "Silkscreen Workshop Student",
  },
];

// The featured review shown on the center image card
const featuredTestimonial = {
  quote: "ClassEasily completely transformed how I spend my weekends. I've tried pottery, sushi-making, and cocktail classes — all within a month!",
  name: "Sarah M.",
  title: "Experience Enthusiast",
  avatarUrl:
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&crop=face",
};

// Static cards for the right column (server-rendered, no JS)
const RightCards = () => (
  <>
    {testimonialData.map((t) => (
      <article key={t.id} className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.stars}>
            {Array.from({ length: t.rating }).map((_, i) => (
              <Star key={i} size={14} fill="#00b67a" stroke="none" />
            ))}
          </div>
          <span className={styles.date}>{t.date}</span>
        </div>
        <p className={styles.quote}>{t.quote}</p>
        <div className={styles.cardFooter}>
          <div className={styles.userInfo}>
            <Image
              src={t.avatarUrl}
              alt={t.userName}
              className={styles.avatar}
              width={36}
              height={36}
              sizes="36px"
            />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{t.userName}</span>
              <span className={styles.userTitle}>{t.userTitle}</span>
            </div>
          </div>
          <div className={styles.trustpilot}>
            <TrustpilotLogo />
          </div>
        </div>
      </article>
    ))}
  </>
);

const Testimonials = () => {
  return (
    <section className={styles.section} aria-labelledby="testimonials-title">
      <div className={styles.container}>
        {/* ─── THREE-COLUMN GRID ─── */}
        <div className={styles.grid}>

          {/* LEFT: Text + Stats */}
          <div className={styles.leftCol}>

            <h2 id="testimonials-title" className={styles.headline}>
              Trusted by over{" "}
              <span className={styles.headlineAccent}>15k+</span>
              <br />
              happy learners
            </h2>
            <p className={styles.subtext}>
              From pottery to cocktail-making, our learners come back again and again. Here's what they have to say.
            </p>
            <div className={styles.statRow}>
              <div className={styles.stat}>
                <span className={styles.statNum}>15k+</span>
                <span className={styles.statLabel}>Learners</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>4.9★</span>
                <span className={styles.statLabel}>Avg. Rating</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNum}>500+</span>
                <span className={styles.statLabel}>Classes</span>
              </div>
            </div>
          </div>

          {/* CENTER: Image card */}
          <div className={styles.centerCol} aria-hidden="true">
            <Image
              src="https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=600&h=800&fit=crop&crop=center"
              alt="Happy learner at a class"
              fill
              sizes="(max-width: 1023px) 60vw, 35vw"
              className={styles.centerImage}
              priority
            />
            <div className={styles.imageOverlay} />
            <div className={styles.imageContent}>
              <p className={styles.imageQuote}>"{featuredTestimonial.quote}"</p>
              <div className={styles.imageAuthor}>
                <Image
                  src={featuredTestimonial.avatarUrl}
                  alt={featuredTestimonial.name}
                  className={styles.imageAvatar}
                  width={38}
                  height={38}
                  sizes="38px"
                />
                <div className={styles.imageAuthorText}>
                  <span className={styles.imageAuthorName}>{featuredTestimonial.name}</span>
                  <span className={styles.imageAuthorTitle}>{featuredTestimonial.title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Stacked cards with fade mask */}
          <div className={styles.rightCol} aria-label="More testimonials">
            <RightCards />
          </div>
        </div>

        {/* MOBILE carousel (only visible on small screens) */}
        <div className={styles.carouselSection}>
          <TestimonialsClient>
            {testimonialData.map((testimonial) => (
              <article key={testimonial.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.stars}>
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} size={16} fill="#00b67a" stroke="none" />
                    ))}
                  </div>
                  <span className={styles.date}>{testimonial.date}</span>
                </div>
                <p className={styles.quote}>{testimonial.quote}</p>
                <div className={styles.cardFooter}>
                  <div className={styles.userInfo}>
                    <Image
                      src={testimonial.avatarUrl}
                      alt={testimonial.userName}
                      className={styles.avatar}
                      width={36}
                      height={36}
                      sizes="36px"
                    />
                    <div className={styles.userDetails}>
                      <span className={styles.userName}>{testimonial.userName}</span>
                      <span className={styles.userTitle}>{testimonial.userTitle}</span>
                    </div>
                  </div>
                  <div className={styles.trustpilot}>
                    <TrustpilotLogo />
                  </div>
                </div>
              </article>
            ))}
          </TestimonialsClient>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;