"use client";

import message from "@/lib/message";

/**
 * Copies window.location.href (include query params for deep links).
 */
export default function CopyPageLinkButton({
  label = "Copy link",
  className,
  style,
  icon: Icon,
  size = 16,
}) {
  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof window !== "undefined" ? window.location.href : ""
      );
      message.success("Link copied to clipboard");
    } catch {
      message.error("Could not copy link");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={label}
      aria-label={label}
      className={className}
      style={{
        background: "none",
        border: "none",
        padding: 4,
        cursor: "pointer",
        borderRadius: 6,
        display: "flex",
        alignItems: "center",
        color: "#6b7280",
        ...style,
      }}
    >
      {Icon ? <Icon size={size} /> : null}
    </button>
  );
}
