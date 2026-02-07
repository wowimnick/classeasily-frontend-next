# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into your Classeasily Next.js project. The integration includes client-side event tracking via `instrumentation-client.js` (the recommended approach for Next.js 16+), server-side utilities for backend analytics, and a reverse proxy setup to avoid ad blockers. Key user journeys are now fully instrumented including user authentication, class booking funnels, business registration, gift card purchases, and search functionality.

## Events Implemented

| Event Name | Description | File Path |
|------------|-------------|-----------|
| `user_signed_up` | User completed registration flow and created a new account | `src/components/auth/AuthModal.jsx` |
| `user_logged_in` | User successfully logged in via email/password or Google OAuth | `src/components/auth/AuthModal.jsx` |
| `user_logged_out` | User logged out of their account | `src/components/header/CustomUserMenu.jsx` |
| `booking_started` | User opened the booking modal for a class (top of conversion funnel) | `src/app/classes/_components/BookingModal.jsx` |
| `booking_date_selected` | User selected a date/time slot for their class booking | `src/app/classes/_components/steps/CalendarStep.jsx` |
| `booking_payment_initiated` | User reached the payment step in the booking flow | `src/app/classes/_components/steps/ReviewAndPaymentStep.jsx` |
| `booking_completed` | User successfully completed a class booking with payment | `src/app/classes/_components/BookingModal.jsx` |
| `business_registration_started` | User clicked to begin business registration (conversion funnel entry) | `src/app/business/register/_components/RegisterPageContent.jsx` |
| `business_registration_step_completed` | User completed a step in the business registration process | `src/app/business/register/_components/RegisterPageContent.jsx` |
| `business_registration_submitted` | User submitted their business registration successfully | `src/app/business/register/_components/RegisterPageContent.jsx` |
| `giftcard_checkout_started` | User proceeded to gift card checkout with configuration | `src/app/giftcards/checkout/_components/GiftcardCheckoutPage.jsx` |
| `giftcard_purchase_completed` | User successfully completed gift card purchase | `src/app/giftcards/checkout/_components/GiftcardPaymentStep.jsx` |
| `class_viewed` | User viewed a class detail page (funnel entry for bookings) | `src/app/classes/_components/ClassPageClient.jsx` |
| `search_performed` | User performed a search for classes or experiences | `src/components/common/SearchDrawer.jsx` |

## Files Created/Modified

### New Files
- `instrumentation-client.js` - PostHog client-side initialization (Next.js 16+ approach)
- `src/lib/posthog-server.js` - Server-side PostHog client helper

### Modified Files
- `next.config.mjs` - Added PostHog reverse proxy rewrites and `skipTrailingSlashRedirect`
- `.env.local` - Added `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

### Dashboard
- **Analytics basics**: [https://us.posthog.com/project/307634/dashboard/1255486](https://us.posthog.com/project/307634/dashboard/1255486)

### Insights
- **Booking Conversion Funnel**: [https://us.posthog.com/project/307634/insights/QtUQHfn7](https://us.posthog.com/project/307634/insights/QtUQHfn7)
- **User Signups Trend**: [https://us.posthog.com/project/307634/insights/W5QHwm6T](https://us.posthog.com/project/307634/insights/W5QHwm6T)
- **Business Registration Funnel**: [https://us.posthog.com/project/307634/insights/GzY2WOqp](https://us.posthog.com/project/307634/insights/GzY2WOqp)
- **Daily Bookings Completed**: [https://us.posthog.com/project/307634/insights/rscUz4H9](https://us.posthog.com/project/307634/insights/rscUz4H9)
- **Gift Card Purchases**: [https://us.posthog.com/project/307634/insights/StIgKMre](https://us.posthog.com/project/307634/insights/StIgKMre)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/posthog-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

## Environment Variables

Make sure to set these environment variables in your production environment:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_fSReufDvkty5uhfdW4CbjKHBzhD4x1Wbea5GWrkBVid
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```
