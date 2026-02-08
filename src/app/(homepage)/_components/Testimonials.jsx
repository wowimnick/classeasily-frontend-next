import React from "react";
import { Star } from "lucide-react";
import styles from "./Testimonials.module.css"; // CSS Modules
import TestimonialsClient from "./TestimonialsClient";

// --- Static Assets ---
const TrustpilotLogo = () => (
  <svg
    width="100"
    height="24"
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

const Testimonials = () => {
  return (
    <section className={styles.section} aria-labelledby="testimonials-title">
      <TestimonialsClient>
        {/* 
           These children are rendered on the SERVER.
           They are passed into the Client Component as pure HTML.
           This keeps the bundle size tiny.
        */}
        {testimonialData.map((testimonial) => (
          <article key={testimonial.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.stars}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} size={20} fill="#00b67a" />
                ))}
              </div>
              <span className={styles.date}>{testimonial.date}</span>
            </div>

            <p className={styles.quote}>{testimonial.quote}</p>

            <div className={styles.cardFooter}>
              <div className={styles.userInfo}>
                <img
                  src={testimonial.avatarUrl}
                  alt={testimonial.userName}
                  className={styles.avatar}
                  loading="lazy"
                  width="40"
                  height="40"
                />
                <div className={styles.userDetails}>
                  <span className={styles.userName}>
                    {testimonial.userName}
                  </span>
                  <span className={styles.userTitle}>
                    {testimonial.userTitle}
                  </span>
                </div>
              </div>
              <div className={styles.trustpilot}>
                <TrustpilotLogo />
              </div>
            </div>
          </article>
        ))}
      </TestimonialsClient>
    </section>
  );
};

export default Testimonials;
