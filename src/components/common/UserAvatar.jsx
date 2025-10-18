"use client";

import React, { useState, useEffect } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";

const UserAvatar = ({ avatarUrl }) => {
  const { user: currentUser } = useAuthUser();
  const [imageFailed, setImageFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setImageFailed(false);
  }, [avatarUrl]);

  const getUserInitials = (user) => {
    if (!user) return "";
    const f = user.first_name?.[0] || "";
    const l = user.last_name?.[0] || "";
    return `${f}${l}`.toUpperCase() || "U";
  };

  const handleError = () => {
    setImageFailed(true);
  };

  const showFallback = !avatarUrl || imageFailed;

  const wrapperStyle = {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #e0e0e0",
  };

  const imageStyle = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const fallbackStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: "600",
    color: "#ffffff",
    backgroundColor: "#ff385c",
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div style={wrapperStyle}>
        <div style={fallbackStyle}>U</div>
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      {showFallback ? (
        <div style={fallbackStyle}>{getUserInitials(currentUser)}</div>
      ) : (
        <img
          src={avatarUrl}
          alt="User Avatar"
          onError={handleError}
          style={imageStyle}
        />
      )}
    </div>
  );
};

export default UserAvatar;
