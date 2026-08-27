import MarketingChrome from "@/components/marketing/MarketingChrome";

export const metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
};

export default function NotFound() {
  return (
    <MarketingChrome>
      <main
        style={{
          flex: 1,
          padding: "6rem 1.5rem",
          backgroundColor: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.8,
              filter: "brightness(0.98)",
            }}
            aria-hidden
          >
            <img
              src="/404.svg"
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              paddingTop: "220px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2rem, 5vw, 3rem)",
                fontWeight: 800,
                margin: 0,
                color: "#000",
              }}
            >
              Nothing to see here
            </h1>

            <p
              style={{
                maxWidth: "540px",
                margin: 0,
                color: "#717171",
                fontSize: "1rem",
                lineHeight: 1.6,
              }}
            >
              The page you are trying to open does not exist. You may have
              mistyped the address, or the page has been moved to another URL.
              If you think this is an error, contact support.
            </p>
          </div>
        </div>
      </main>
    </MarketingChrome>
  );
}
