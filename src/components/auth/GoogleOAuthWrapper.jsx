"use client";

import { useState, useEffect } from "react";
import { Chrome } from "lucide-react";
import styled from "styled-components";

const GOOGLE_CLIENT_ID =
  "1065252482453-6e8md9bvegiroas8p08vqpenf7fuc9vd.apps.googleusercontent.com";

const SocialButton = styled.button`
  width: 100%;
  height: 48px;
  margin-bottom: 0.5rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid #e8e8e8;
  color: #484848;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    color: #ff385c;
    border-color: #ff385c;
    background: #fff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    height: 44px;
    font-size: 13px;
  }
`;

export default function GoogleOAuthWrapper({ onSuccess, onError, disabled }) {
  const [isLoading, setIsLoading] = useState(true);
  const [GoogleOAuthProvider, setGoogleOAuthProvider] = useState(null);
  const [useGoogleLogin, setUseGoogleLogin] = useState(null);

  useEffect(() => {
    // Dynamically import Google OAuth library only when this component mounts
    const loadGoogleOAuth = async () => {
      try {
        const googleOAuthModule = await import("@react-oauth/google");
        setGoogleOAuthProvider(() => googleOAuthModule.GoogleOAuthProvider);
        setUseGoogleLogin(() => googleOAuthModule.useGoogleLogin);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to load Google OAuth:", error);
        setIsLoading(false);
      }
    };

    loadGoogleOAuth();
  }, []);

  if (isLoading || !GoogleOAuthProvider || !useGoogleLogin) {
    return (
      <SocialButton disabled>
        <Chrome size={18} />
        Loading Google...
      </SocialButton>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLoginButtonInner
        onSuccess={onSuccess}
        onError={onError}
        disabled={disabled}
        useGoogleLogin={useGoogleLogin}
      />
    </GoogleOAuthProvider>
  );
}

// Inner component that uses the Google hook
function GoogleLoginButtonInner({
  onSuccess,
  onError,
  disabled,
  useGoogleLogin,
}) {
  const googleLogin = useGoogleLogin({
    onSuccess,
    onError,
  });

  return (
    <SocialButton onClick={() => googleLogin()} disabled={disabled}>
      <Chrome size={18} />
      Continue with Google
    </SocialButton>
  );
}
