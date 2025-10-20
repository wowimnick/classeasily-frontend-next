// app/business/accept-invite/page.jsx
"use client";

import { useEffect, useRef, Suspense } from "react";
import { useAuthUser } from "@/hooks/useAuthUser";
import axiosInstance from "@/lib/axiosInstance";
import { useSearchParams, useRouter } from "next/navigation";
import message from '@/lib/message';
import { GlobalLoaderWithInlineStyles } from "@/components/common/GlobalLoader";

const log = (message, data = "") => {
  console.log(
    `%c[AcceptInvitePage] %c${new Date().toLocaleTimeString()}: %c${message}`,
    "color: #7c3aed; font-weight: bold;",
    "color: #4b5563;",
    "color: #1d4ed8;",
    data
  );
};

function AcceptInvitePageContent() {
  const { user: currentUser, isLoading: isUserLoading } = useAuthUser();
  const isAuthenticated = !!currentUser;
  const searchParams = useSearchParams();
  const router = useRouter();

  const [invitationSuccess, setInvitationSuccess] = useState(false);
  const [userError, setUserError] = useState(null);

  const token = searchParams.get("token");
  const acceptanceDispatched = useRef(false);

  useEffect(() => {
    log("Dispatch useEffect triggered.", {
      isUserLoading,
      isAuthenticated,
      hasToken: !!token,
    });

    if (isUserLoading || acceptanceDispatched.current) {
      log(
        "GUARD: isUserLoading is TRUE or acceptance already dispatched. Bailing out."
      );
      return;
    }

    if (!token) {
      log("ERROR: No token found. Redirecting.");
      message.error("Invalid invitation link. No token provided.");
      router.push("/");
      return;
    }

    if (isAuthenticated) {
      log("DECISION: User is authenticated. Accepting invitation.");
      acceptanceDispatched.current = true;

      // Accept invitation via API
      axiosInstance
        .post("/business/invitations/accept/", { token })
        .then((response) => {
          if (response.data) {
            setInvitationSuccess(true);
            message.success("Invitation accepted! Welcome to the team.");
            router.push("/business/dashboard/overview");
          }
        })
        .catch((error) => {
          setUserError(
            error.response?.data?.detail || "Failed to accept invitation"
          );
          message.error(
            error.response?.data?.detail || "Failed to accept invitation"
          );
          router.push("/");
        });
    } else {
      log("DECISION: User is a guest. Redirecting to join page.");
      localStorage.setItem("pendingInvitationToken", token);
      router.push(`/business/join?token=${token}`);
    }
  }, [token, isAuthenticated, isUserLoading, router]);

  useEffect(() => {
    if (invitationSuccess) {
      log("Navigation useEffect triggered: SUCCESS. Navigating to dashboard.");
      message.success({
        content: "Invitation accepted! Welcome to the team.",
        key: "accept",
      });
      router.push("/business/dashboard/overview");

      return () => {
        dispatch(resetInvitationStatus());
      };
    }

    if (userError && acceptanceDispatched.current) {
      log("Navigation useEffect triggered: FAILED.", { userError });
      message.error({
        content: userError,
        key: "accept",
      });
      router.push("/");

      return () => {
        dispatch(resetInvitationStatus());
      };
    }
  }, [invitationSuccess, userError, router, dispatch]);

  log("Render phase complete. Displaying spinner.");
  return <GlobalLoaderWithInlineStyles />;
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<GlobalLoaderWithInlineStyles />}>
      <AcceptInvitePageContent />
    </Suspense>
  );
}
