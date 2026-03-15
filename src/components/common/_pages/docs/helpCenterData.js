// --- START OF FILE helpCenterData.js ---

import {
  Rocket,
  CalendarDays,
  Banknote,
  Users,
  MessageSquareQuote,
  Ticket,
  ShieldCheck,
  BellRing,
} from "lucide-react";

export const helpCenterData = [
  {
    slug: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    description:
      "Everything you need to know to launch your business, set up payments, and complete your Host profile.",
    articles: [
      {
        slug: "dashboard-overview",
        title: "Your Dashboard at a Glance",
        content: [
          {
            type: "p",
            text: "When you log in, the <strong>Dashboard</strong> (or <strong>Overview</strong>) tab gives you a snapshot of your business: key metrics, upcoming activity, and quick links to list your experiences, manage bookings, and view revenue.",
          },
          {
            type: "p",
            text: "Use the sidebar to move between: <strong>My Listings</strong> (create and manage experiences and schedules), <strong>Bookings</strong> (Active and History), <strong>People & Community</strong> (Guests, Reviews, Staff, Messages), <strong>Financials</strong> (Revenue, Payouts), <strong>Marketing & Analytics</strong> (Booking Trends, Promotions), and <strong>Settings</strong> (Business Settings and Payout Setup).",
          },
        ],
      },
      {
        slug: "setup-guide",
        title: "Your Host Setup Checklist",
        content: [
          {
            type: "p",
            text: "Welcome to Classeasily! Getting your business up and running as a Host is simple. Follow this checklist to ensure you are ready to accept bookings and payments.",
          },
          { type: "h3", text: "1. Connect Stripe for Payouts" },
          {
            type: "p",
            text: "This is the most critical step. You cannot receive money until you connect a Stripe account. Navigate to <strong>Settings</strong> → <strong>Business Settings</strong> → <strong>Preferences</strong> tab, then scroll to <strong>Payout Setup</strong> to link your bank account securely. This automatically enables credit card, <strong>Apple Pay</strong>, and <strong>Google Pay</strong> processing for your Guests.",
          },
          { type: "h3", text: "2. Complete Your Business Profile" },
          {
            type: "p",
            text: "Your profile is your storefront. A complete profile builds trust with potential Guests.",
          },
          {
            type: "ul",
            items: [
              "<strong>Basic Info:</strong> Add your business name, description, and logo.",
              "<strong>Location:</strong> Set your address. You can choose to show the exact location map or just a general area for privacy.",
              "<strong>Contact Info:</strong> Add a phone number and email for Guests to reach you.",
              "<strong>Social Links:</strong> Connect your Instagram or Facebook to cross-promote.",
            ],
          },
          { type: "h3", text: "3. Create Your First Experience" },
          {
            type: "p",
            text: "An 'Experience' is the template for what you host (e.g., 'Beginner Pottery Workshop' or 'Guided City Tour'). It holds descriptions and photos but <strong>not dates</strong>. You only need to create this once.",
          },
          { type: "h3", text: "4. Schedule Sessions" },
          {
            type: "p",
            text: "Once you have an Experience, you add 'Schedules' to it. These are the actual dates and times that appear on the calendar for Guests to reserve.",
          },
          {
            type: "blockquote",
            text: "<strong>Pro Tip:</strong> You can set up 'Team Roles' later if you have additional hosts or admins, but completing the steps above is all you need to start selling.",
          },
        ],
      },
      {
        slug: "connecting-to-stripe",
        title: "Getting Paid: Stripe, Apple Pay & Google Pay",
        content: [
          {
            type: "p",
            text: "We partner with Stripe to handle all payments securely. We support major credit cards as well as seamless one-tap checkout via Apple Pay and Google Pay.",
          },
          { type: "h3", text: "Where to Connect Your Payout Account" },
          {
            type: "p",
            text: "Go to <strong>Settings</strong> → <strong>Business Settings</strong> → <strong>Preferences</strong> tab. Scroll to the <strong>Payout Setup</strong> section. If your account is not yet connected, you will see a <strong>Setup Payouts</strong> button. You can also reach this section from the <strong>Payouts</strong> tab (under Financials): when payouts are not enabled, a button there will take you directly to Payout Setup.",
          },
          {
            type: "p",
            text: "Click <strong>Setup Payouts</strong>. You will be redirected to Stripe's secure site. Classeasily does not store your bank or card details—Stripe handles everything. Complete the steps on Stripe, then return to your dashboard. Your status will sync automatically (you may see a short 'Synchronizing account status' message).",
          },
          { type: "h3", text: "Payout Account Statuses" },
          {
            type: "ul",
            items: [
              "<strong>Active:</strong> Your account is connected and you can receive payouts. No further action needed.",
              "<strong>Pending:</strong> Stripe is reviewing your information. This can take a few business days.",
              "<strong>Incomplete:</strong> You did not finish the Stripe onboarding. Click <strong>Continue Onboarding</strong> or <strong>Update Account Details</strong> to complete it.",
              "<strong>Restricted:</strong> Stripe requires additional verification or information. Use <strong>Manage Payouts</strong> to open Stripe and resolve the issue.",
            ],
          },
          { type: "h3", text: "The Stripe Setup Walkthrough (Canada)" },
          {
            type: "p",
            text: "The verification process is a legal requirement (KYC/FINTRAC) to prevent fraud. Here is exactly what you need to do when the page opens:",
          },
          { type: "h4", text: "Step 1: Contact Information" },
          {
            type: "p",
            text: "Enter your email and mobile number. Stripe will text you a 6-digit verification code to log in.",
          },
          { type: "h4", text: "Step 2: Select Business Type (Critical)" },
          {
            type: "p",
            text: "You will be asked: <em>'Type of business'</em>. Choosing the correct one is vital for verification in Canada:",
          },
          {
            type: "ul",
            items: [
              "<strong>Individual / Sole Proprietorship:</strong> Choose this if you are a freelancer, independent host, or running the business yourself without official incorporation. You will verify using your personal <strong>SIN</strong> (Social Insurance Number) or just your personal identity details.",
              "<strong>Company / Corporation:</strong> Choose this <strong>only</strong> if you have official incorporation documents. You will need your <strong>Business Number (BN)</strong> or Provincial Corporation Number.",
              "<strong>Non-profit / Charity:</strong> Choose this if you are a registered charity (requires your CRA Registration Number ending in RR0001).",
            ],
          },
          { type: "h4", text: "Step 3: Personal Details" },
          {
            type: "p",
            text: "Even if you are a Corporation, Canadian law requires Stripe to verify the <strong>identity of the business representative</strong> (you). You must provide your:",
          },
          {
            type: "ul",
            items: [
              "Legal First and Last Name (Must match your ID exactly)",
              "Home Address (Cannot be a PO Box)",
              "Date of Birth",
              "<strong>SIN (Social Insurance Number):</strong> Used for tax reporting and identity verification.",
            ],
          },
          { type: "h4", text: "Step 4: Payout Details (Bank Account or Card)" },
          {
            type: "p",
            text: "You can choose how you want to receive your money:",
          },
          {
            type: "ul",
            items: [
              "<strong>Bank Account:</strong> You will need your Transit Number (5 digits), Institution Number (3 digits), and Account Number.",
              "<strong>Debit Card:</strong> You can enter the details of a valid Visa or Mastercard debit card to receive payouts directly to the associated account.",
            ],
          },
          { type: "h3", text: "Troubleshooting Verification" },
          {
            type: "p",
            text: "If your payouts are paused, check your Payouts tab. Common Canadian verification issues include:",
          },
          {
            type: "ul",
            items: [
              "<strong>Name Mismatch (Sole Prop):</strong> If you selected 'Individual', the 'Business Name' is legally <strong>your own name</strong>. Do not enter a trade name (e.g., 'Pottery by Sarah') unless you have legally registered it as a 'Doing Business As' name.",
              "<strong>Corporation Mismatch:</strong> Ensure your legal business name matches your Articles of Incorporation exactly (including 'Inc.', 'Ltd.', etc.).",
              "<strong>Address Verification:</strong> Stripe may ask for a photo of your driver's license or passport if they cannot verify you automatically via credit bureaus.",
            ],
          },
        ],
      },
      {
        slug: "business-settings",
        title: "Business Settings",
        content: [
          {
            type: "p",
            text: "Go to <strong>Settings</strong> → <strong>Business Settings</strong> to manage your profile, location, and preferences. The page has three tabs:",
          },
          {
            type: "ul",
            items: [
              "<strong>General:</strong> Business name, description, logo, and other basic info that appears on your public profile.",
              "<strong>Location:</strong> Your address and whether to show an exact map or a general area to Guests.",
              "<strong>Preferences:</strong> Business hours, timezone, notification settings (e.g. new booking alerts, cancellation and reminder emails), and the <strong>Payout Setup</strong> section where you connect Stripe to receive payments.",
            ],
          },
          {
            type: "p",
            text: "After you save changes, your public listing and dashboard behavior will update accordingly. Payout Setup is the same section described in <strong>Getting Paid: Stripe, Apple Pay & Google Pay</strong>—use it to connect or update your payout account.",
          },
        ],
      },
      {
        slug: "email-branding",
        title: "Email branding",
        content: [
          {
            type: "p",
            text: "Email branding lets you customize how confirmation, reminder, and update emails look when they are sent to your Guests. It is available as an <strong>add-on</strong> that you subscribe to from <strong>Settings</strong> → <strong>Business Settings</strong> → <strong>Plan & Billing</strong> (under Add-ons: Marketplace email branding). Once the add-on is active, the <strong>Email Branding</strong> tab appears in Business Settings.",
          },
          { type: "h3", text: "What you can customize" },
          {
            type: "ul",
            items: [
              "<strong>Logo:</strong> Upload your business logo so it appears at the top of the email.",
              "<strong>Primary color:</strong> Used for headings and accents so the email matches your brand.",
              "<strong>Footer text:</strong> Optional line of text above the copyright (e.g. contact info or a short message).",
              "<strong>Confirmation message:</strong> Optional extra sentence shown in booking confirmation emails.",
              "<strong>Card style:</strong> Border and corner roundness of the booking details card in the email.",
              "<strong>Logo size:</strong> Small, medium, or large so the logo fits your layout.",
            ],
          },
          { type: "h3", text: "Marketplace vs. widget email branding" },
          {
            type: "p",
            text: "Classeasily sends emails for two types of bookings: those from the <strong>marketplace</strong> (Guests who found you on Classeasily) and those from your <strong>widget</strong> (Guests who booked on your own website). You can set different branding for each.",
          },
          {
            type: "p",
            text: "<strong>Marketplace email branding</strong> applies to all emails for bookings made through the Classeasily discovery site. You can customize it when you have the Marketplace email branding add-on (subscribed from Plan & Billing).",
          },
          {
            type: "p",
            text: "<strong>Widget email branding</strong> applies only to emails for bookings made through your embedded booking widget. This option is available only on a <strong>Growth</strong> or <strong>Advanced</strong> widget plan. On the Basic widget plan, widget booking emails use your marketplace email branding (if you have the add-on); otherwise they use default Classeasily styling.",
          },
          {
            type: "blockquote",
            text: "On the Email branding page, use the <strong>Email type</strong> toggle to switch between <strong>Marketplace bookings</strong> and <strong>Widget booking</strong>. Change the settings, then click <strong>Save branding</strong>. The Widget booking option is only available and editable when you are on a Growth or Advanced widget plan.",
          },
        ],
      },
      {
        slug: "plans-and-billing",
        title: "Plans, upgrading and downgrading",
        content: [
          {
            type: "p",
            text: "From <strong>Settings</strong> → <strong>Business Settings</strong> → <strong>Plan & Billing</strong> you manage your <strong>widget subscription</strong> (Basic, Growth, or Advanced) and <strong>add-ons</strong> (e.g. Marketplace email branding). Your widget plan and add-ons determine which features you have access to.",
          },
          { type: "h3", text: "Widget plan & billing" },
          {
            type: "p",
            text: "The main section shows your current widget plan (Basic, Growth, or Advanced), price, and next renewal date. You can view and download past invoices. The page states that changes take effect at the end of the billing period where applicable.",
          },
          { type: "h3", text: "Add-ons" },
          {
            type: "p",
            text: "Add-ons such as <strong>Marketplace email branding</strong> are billed separately. Subscribe from the Add-ons section on the same page. When the Marketplace email branding add-on is active, the <strong>Email Branding</strong> tab appears in Business Settings.",
          },
          { type: "h3", text: "Upgrading your widget plan" },
          {
            type: "p",
            text: "Click <strong>Upgrade to [plan name]</strong> and complete the payment steps. Your new plan usually takes effect right away. You may see a prorated charge for the remainder of the current billing period; the exact behavior is shown when you switch plans.",
          },
          { type: "h3", text: "Downgrading or cancelling" },
          {
            type: "p",
            text: "If you switch to a lower-tier plan or click <strong>Cancel subscription</strong>, the change takes effect at the end of your current billing period. Until then, you keep access to your current plan. After the change, features that are only on higher plans (e.g. widget email branding on Growth/Advanced) will no longer be available. Your data is not deleted.",
          },
          {
            type: "p",
            text: "For proration, refunds, or exact timing of a downgrade or add-on cancellation, check the text on the Plan & Billing page or contact support.",
          },
        ],
      },
    ],
  },
  {
    slug: "experiences-and-scheduling",
    title: "Experiences & Scheduling",
    icon: CalendarDays,
    description:
      "Learn how to set up sessions and manage your calendar.",
    articles: [
      {
        slug: "experience-vs-schedule",
        title: "Concept: Experience vs. Schedule",
        content: [
          {
            type: "p",
            text: "Understanding the difference between an Experience and a Schedule is the key to managing your hosting duties effectively.",
          },
          { type: "h3", text: "The Experience (The 'What')" },
          {
            type: "p",
            text: "Think of an <strong>Experience</strong> as your catalog entry. It contains the static details that don't change often:",
          },
          {
            type: "ul",
            items: [
              "Title & Description",
              "Photos & Cover Image",
              "Category (e.g., Tours, Workshops, Food)",
              "Location & Equipment Needed",
            ],
          },
          { type: "h3", text: "The Schedule (The 'When')" },
          {
            type: "p",
            text: "A <strong>Schedule</strong> is the actual event on the calendar. You attach schedules to an Experience to make it bookable. A schedule includes:",
          },
          {
            type: "ul",
            items: ["Date & Time", "Price", "Capacity (Max Guests)"],
          },
          {
            type: "blockquote",
            text: "<strong>Example:</strong> You create one Experience called 'Sunset Kayaking'. You then add two Schedules to it: one on Tuesday evenings for $50, and one on Saturday mornings for $60. Both share the same description and photos.",
          },
        ],
      },
      {
        slug: "bulk-scheduling",
        title: "Bulk Scheduling Tool",
        content: [
          {
            type: "p",
            text: "Don't want to create sessions one by one? Use the Bulk Create tool to fill your calendar in seconds.",
          },
          {
            type: "ol",
            items: [
              "Go to <strong>My Listings</strong>, open the relevant experience, and click <strong>Manage Schedules</strong>.",
              "Select the <strong>Bulk Create</strong> tab.",
              "Choose a date range (e.g., Sept 1 to Dec 31).",
              "Select repeating days (e.g., every Monday and Friday).",
              "Set the time, price, and capacity.",
            ],
          },
          {
            type: "p",
            text: "The system will generate a unique schedule for every matching day in that range. If you need to cancel just one day (like a holiday), you can delete that specific instance later without affecting the others.",
          },
        ],
      },
    ],
  },
  {
    slug: "guests-and-bookings",
    title: "Guests & Bookings",
    icon: Users,
    description:
      "Manage your guest list, handle cancellations, and import contacts.",
    articles: [
      {
        slug: "managing-bookings",
        title: "Managing Active Bookings",
        content: [
          {
            type: "p",
            text: "The <strong>Bookings</strong> area is your command center. Under <strong>Bookings</strong> you have <strong>Active Bookings</strong> (upcoming reservations) and <strong>Booking History</strong> (past and cancelled). Here you can see who is coming to your experience, check payment statuses, handle cancellations, and rescheduling.",
          },
          { type: "h3", text: "Booking Statuses" },
          {
            type: "ul",
            items: [
              "<strong>Confirmed:</strong> The Guest has reserved and paid. They are on the roster.",
              "<strong>Pending:</strong> The booking is reserved but payment is processing (rare).",
              "<strong>Cancelled:</strong> The booking was cancelled by you or the Guest.",
              "<strong>Completed:</strong> The experience date has passed.",
            ],
          },
          { type: "h3", text: "Cancelling a Booking" },
          {
            type: "p",
            text: "If you need to cancel a booking for a Guest, simply find the booking and click 'Cancel'. You will be asked for a reason, which is sent to the Guest via email.",
          },
          {
            type: "blockquote",
            text: "<strong>Refunds:</strong> If a booking is paid, cancelling it will usually trigger an automatic refund via Stripe, depending on the payment status.",
          },
        ],
      },
      {
        slug: "importing-guests",
        title: "Importing Guests (CRM)",
        content: [
          {
            type: "p",
            text: "Moving from another system? You can bulk import your existing guest list into Classeasily using a CSV or Excel file.",
          },
          { type: "h3", text: "How to Import" },
          {
            type: "ol",
            items: [
              "Navigate to the <strong>Guests</strong> tab.",
              "Click the <strong>Import</strong> button.",
              "Upload your file (.csv or .xlsx).",
              "Map the columns (tell us which column is 'First Name', 'Email', etc.).",
            ],
          },
          {
            type: "p",
            text: "The system will create profile records for these Guests. If they sign up for the platform later with the same email address, their account will automatically link to the history you imported.",
          },
        ],
      },
      {
        slug: "guest-checkout",
        title: "Guest Checkout",
        content: [
          {
            type: "p",
            text: "Not every Guest needs to create an account to book with you. We support <strong>Guest Checkout</strong>.",
          },
          {
            type: "p",
            text: "When a guest books, we create a 'Contact' record for them in your dashboard using their name and email. They receive a secure link in their confirmation email that allows them to manage or cancel their booking without ever needing a password.",
          },
        ],
      },
      {
        slug: "messages",
        title: "Messages",
        content: [
          {
            type: "p",
            text: "The <strong>Messages</strong> tab (under People & Community) is where you can view and reply to conversations with Guests. Use it to answer questions about your experiences, send updates, or coordinate details before or after a booking.",
          },
          {
            type: "p",
            text: "Messages are stored on the Platform and may be used for safety, support, and policy enforcement as described in our <a href='/privacy-policy'>Privacy Policy</a>. Keep communication professional and on-platform when possible.",
          },
        ],
      },
      {
        slug: "reviews-and-feedback",
        title: "Reviews & Feedback",
        content: [
          {
            type: "p",
            text: "The <strong>Reviews & Feedback</strong> tab (under People & Community) shows reviews and ratings that Guests have left after attending your experiences. You can see average ratings, recent reviews, and trends over time.",
          },
          {
            type: "p",
            text: "Reviews help build trust with future Guests. We encourage you to respond to reviews where appropriate. Reviews must follow our <a href='/content-policy'>Content Policy</a>. If you believe a review violates our policies, you can report it through the Platform or contact support.",
          },
        ],
      },
    ],
  },
  {
    slug: "finances",
    title: "Finances & Payouts",
    icon: Banknote,
    description:
      "Understand fees, track revenue trends, and manage your bank transfers.",
    articles: [
      {
        slug: "revenue-dashboard",
        title: "Revenue & Analytics",
        content: [
          {
            type: "p",
            text: "Your <strong>Revenue Dashboard</strong> gives you a real-time look at your business health.",
          },
          { type: "h3", text: "Key Metrics" },
          {
            type: "ul",
            items: [
              "<strong>Gross Revenue:</strong> Total money paid by Guests (before fees/taxes).",
              "<strong>Net Revenue:</strong> The actual amount you take home.",
              "<strong>Platform Fees:</strong> The service fee charged by Classeasily (includes credit card processing costs).",
            ],
          },
          { type: "h3", text: "Exporting Data" },
          {
            type: "p",
            text: "Need data for your accountant? You can export a detailed CSV report of all transactions, including taxes collected and fees paid, directly from the Revenue page.",
          },
        ],
      },
      {
        slug: "payouts-tab",
        title: "Understanding the Payouts Tab",
        content: [
          {
            type: "p",
            text: "The <strong>Payouts</strong> tab (under <strong>Financials</strong>) is where you see your payout status, pending balance, and full payout history.",
          },
          { type: "h3", text: "What You'll See" },
          {
            type: "ul",
            items: [
              "<strong>Payouts Status:</strong> Whether your account is connected and eligible to receive payouts (e.g. Active, Pending, Incomplete). If not connected, a button will take you to Settings → Preferences → Payout Setup.",
              "<strong>Pending Balance:</strong> Money from completed sessions that has been released to your balance but not yet sent to your bank.",
              "<strong>Payout Schedule:</strong> When the next transfer to your bank is expected.",
              "<strong>Last Payout:</strong> Your most recent successful payout amount.",
            ],
          },
          { type: "h3", text: "Payout History" },
          {
            type: "p",
            text: "The table lists each payout: amount, estimated arrival date, status, and number of bookings included. Expand a row to see the individual bookings that make up that payout. You can <strong>export</strong> payout details (e.g. for accounting) from the expanded view.",
          },
          {
            type: "p",
            text: "Each payout may have a Stripe transfer ID for reference. If you have not received any payouts yet, the table will be empty—payouts are created approximately 24–48 hours after each experience or session is completed.",
          },
        ],
      },
      {
        slug: "payout-schedule",
        title: "Payout Schedules",
        content: [
          {
            type: "p",
            text: "Payouts are fully automated. You do not need to manually request withdrawals. Once your Stripe account is connected and active, funds flow as described below.",
          },
          { type: "h3", text: "When do I get paid?" },
          {
            type: "p",
            text: "Funds for a session are released to your payout balance <strong>approximately 24–48 hours</strong> after the experience or session is <strong>completed</strong>. After that, Stripe sends the money to your connected bank account on a rolling daily schedule. Depending on your bank, it may take an additional 1–3 business days for the funds to appear in your account.",
          },
          { type: "h3", text: "Daily Bank Transfers" },
          {
            type: "p",
            text: "Once funds are released to your balance (post-completion), Stripe automatically transfers them to your bank account on a rolling daily basis. You can see the <strong>Est. Arrival</strong> date for each payout in the Payouts tab. If a payout is delayed, check your <strong>Payouts Status</strong> in Settings → Preferences → Payout Setup and resolve any Stripe requirements.",
          },
        ],
      },
    ],
  },
  {
    slug: "team-and-hosts",
    title: "Team & Hosts",
    icon: MessageSquareQuote,
    description:
      "Invite additional hosts or admins and manage their permissions.",
    articles: [
      {
        slug: "staff-roles",
        title: "Managing Team Roles",
        content: [
          {
            type: "p",
            text: "You can invite other Hosts or Admins to help manage your business. We use a role-based permission system to keep your data safe.",
          },
          { type: "h3", text: "Creating Roles" },
          {
            type: "p",
            text: "Before inviting someone, create a <strong>Role</strong> (e.g., 'Lead Host', 'Admin', 'Front Desk'). You can toggle specific permissions for each role, such as:",
          },
          {
            type: "ul",
            items: [
              "Can manage experiences",
              "Can view revenue (sensitive)",
              "Can view Guest contact info",
              "Can refund bookings",
            ],
          },
          { type: "h3", text: "Inviting Team Members" },
          {
            type: "p",
            text: "Once a role exists, go to <strong>Staff Management</strong> (under People & Community) and invite a team member by email. They will receive a link to create their own login. They will strictly see only what their role allows.",
          },
        ],
      },
    ],
  },
  {
    slug: "marketing-and-promotions",
    title: "Marketing & Widgets",
    icon: Ticket,
    description: "Embed bookings on your website and create discount codes.",
    articles: [
      {
        slug: "booking-trends",
        title: "Booking Trends",
        content: [
          {
            type: "p",
            text: "The <strong>Booking Trends</strong> tab (under Marketing & Analytics) shows how your bookings and revenue change over time. Use it to see which experiences or time periods perform best and to plan promotions or schedule more sessions when demand is high.",
          },
        ],
      },
      {
        slug: "website-widget",
        title: "Website Integration (Widget)",
        content: [
          {
            type: "p",
            text: "Turn your own website into a booking engine. Our widget lets Guests reserve experiences without leaving your site. You can access widget settings from your dashboard setup guide or the Widget section of your dashboard.",
          },
          {
            type: "p",
            text: "For step-by-step installation guides for your website host (WordPress, Wix, Squarespace, and more), see <a href=\"/business/help?category=widget-installation\">Widget installation</a>.",
          },
          { type: "h3", text: "Two display modes" },
          {
            type: "ul",
            items: [
              "<strong>Inline:</strong> The booking widget is embedded directly on the page — no button needed. Great for a dedicated booking page.",
              "<strong>Popup:</strong> The widget stays hidden. When a visitor clicks your button, the booking flow opens as a full-screen modal. Works on any website builder (Wix, Squarespace, WordPress, and more).",
            ],
          },
          { type: "h3", text: "Setup" },
          {
            type: "ol",
            items: [
              "Go to <strong>Widget Settings</strong> in your dashboard.",
              "Choose <strong>Inline</strong> or <strong>Popup</strong> display mode.",
              "Customize the colors and fonts to match your brand.",
              "Copy the generated embed code.",
              "Paste it into your website builder inside a 'Custom HTML' block.",
            ],
          },
          {
            type: "p",
            text: "For popup mode, the embed code is the hidden widget only (no button). You add your own button anywhere and wire it to open the modal. See <a href=\"/business/help?category=widget-installation&article=widget-using-custom-button\">Using a custom button</a> for details.",
          },
          { type: "h3", text: "Security" },
          {
            type: "p",
            text: "To prevent others from using your widget, you must add your website domain to the Allowed Domains list in widget settings (e.g., <code>www.myadventures.com</code>).",
          },
          { type: "h3", text: "Pricing" },
          {
            type: "p",
            text: "Widget access is 4% per booking (added to the class price—customers pay class price + 4%) plus a $50/month subscription. Stripe processing fees are deducted from your payout. Example: for a $100 class, the customer pays $104; you receive $100 minus 4% minus Stripe's fee.",
          },
        ],
      },
      {
        slug: "widget-functions-and-options",
        title: "Booking Widget: Functions and Options",
        content: [
          {
            type: "p",
            text: "The Classeasily booking widget lets you embed a full booking flow on your own website. Guests can browse classes, choose dates, add options, and pay without leaving your site. This article explains all widget functions and customization options.",
          },
          { type: "h3", text: "Display modes" },
          {
            type: "ul",
            items: [
              "<strong>Inline:</strong> The widget renders directly on the page inside whatever container you choose. No button needed. Best for a dedicated booking page or a sidebar section.",
              "<strong>Popup:</strong> The widget is hidden on load. When a visitor clicks your button, a full-screen booking modal opens over the page. Best for any website where you want a clean layout until the visitor is ready to book.",
            ],
          },
          {
            type: "p",
            text: "There is no built-in floating button. You control the trigger — place any button anywhere on your page and call <code>ClasseasilyWidget.open()</code> when it is clicked. See <a href=\"/business/help?category=widget-installation&article=widget-using-custom-button\">Using a custom button</a> for details.",
          },
          { type: "h3", text: "Theming and branding" },
          {
            type: "p",
            text: "In <strong>Widget Settings</strong> you can customize:",
          },
          {
            type: "ul",
            items: [
              "<strong>Primary color:</strong> Used for buttons, links, and accents so the widget matches your brand.",
              "<strong>Font family:</strong> Choose a font that matches your site (or use the default).",
              "<strong>Border radius:</strong> Control how rounded buttons and cards appear.",
              "<strong>Color presets:</strong> One-click color themes to get started quickly.",
            ],
          },
          {
            type: "p",
            text: "Changes in the customizer are reflected in the live preview and in the embed snippet you copy. After saving, your live widget will use the updated theme.",
          },
          { type: "h3", text: "Security: Allowed origins (whitelist)" },
          {
            type: "p",
            text: "To prevent other sites from using your widget and API key, you must whitelist the domains where the widget is allowed to run. In widget settings, add each domain (e.g. <code>www.myadventures.com</code> or <code>myadventures.com</code>). Only requests from those origins will load classes and accept bookings. Do not add untrusted or third-party domains.",
          },
          {
            type: "p",
            text: "For local development, <code>http://localhost</code> and <code>http://127.0.0.1</code> (any port) are automatically allowed so you can test before going live.",
          },
          { type: "h3", text: "Embedding the widget" },
          {
            type: "p",
            text: "Copy the generated code from the dashboard and paste it into your website builder (Wix, Squarespace, WordPress, etc.) inside a Custom HTML block. The code includes the widget CSS, a container div, and the widget script. For step-by-step platform guides see <a href=\"/business/help?category=widget-installation\">Widget installation</a>.",
          },
          { type: "h3", text: "Subscription and pricing" },
          {
            type: "p",
            text: "Widget access is subject to a per-booking fee (4% added to the class price) and a monthly subscription ($50/month). Stripe processing fees are deducted from your payout. See <strong>Website Integration (Widget)</strong> for current pricing details.",
          },
        ],
      },
      {
        slug: "discounts",
        title: "Creating Discounts & Coupons",
        content: [
          {
            type: "p",
            text: "You can create flexible discount codes to attract Guests.",
          },
          {
            type: "ul",
            items: [
              "<strong>Coupon Codes:</strong> Requires the Guest to type a code (e.g., 'SUMMER20') at checkout.",
              "<strong>Automatic Discounts:</strong> Leave the coupon code blank when creating a discount to make it automatic—it will be applied to eligible purchases at checkout. If you provide a code, Guests must enter it to get the discount.",
            ],
          },
          { type: "h3", text: "Discount Scopes" },
          {
            type: "p",
            text: "You can limit a discount to apply to:",
          },
          {
            type: "ul",
            items: [
              "<strong>Entire Business:</strong> Works on any experience you offer.",
              "<strong>Specific Experience:</strong> Works only for a specific type of experience.",
              "<strong>Specific Session:</strong> Works only for a specific schedule (e.g., fill up a Tuesday morning slot).",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "widget-installation",
    title: "Widget installation",
    icon: Ticket,
    description:
      "Step-by-step guides to add the booking widget to your website. No coding required.",
    articles: [
      {
        slug: "widget-installation-overview",
        title: "Before you start",
        content: [
          {
            type: "p",
            text: "Adding the Classeasily booking widget to your website takes a few minutes. You will copy a small piece of code from your dashboard and paste it into your site. This guide tells you what to do first so everything works the first time.",
          },
          { type: "h3", text: "Step 1: Choose your display mode" },
          {
            type: "ul",
            items: [
              "<strong>Inline:</strong> The booking form lives directly on the page inside your content. Paste the embed code wherever you want the widget to appear.",
              "<strong>Popup:</strong> The widget is hidden until a visitor clicks a button. The booking form then opens as a full-screen overlay. You place any button you want on your page and connect it to the widget with one line of code.",
            ],
          },
          {
            type: "p",
            text: "Select your display mode in <strong>Widget Settings</strong> → <strong>Display Type</strong>. The embed code shown in the dashboard updates automatically based on your choice.",
          },
          { type: "h3", text: "Step 2: Add your website to the allowed list" },
          {
            type: "p",
            text: "Before you paste the code on your site, you must tell Classeasily which website is allowed to show your widget. This keeps your widget secure.",
          },
          {
            type: "ol",
            items: [
              "Go to your dashboard and open <strong>Widget</strong> (in the sidebar).",
              "Find the <strong>Allowed Domains</strong> section.",
              "Add your website address exactly as visitors see it (e.g. <code>www.yoursite.com</code> or <code>yoursite.com</code>).",
              "Click save.",
            ],
          },
          {
            type: "blockquote",
            text: "If you use both <code>www.yoursite.com</code> and <code>yoursite.com</code>, add both addresses to the list.",
          },
          { type: "h3", text: "Step 3: Copy your embed code" },
          {
            type: "p",
            text: "In the same Widget page, find the <strong>Embed code</strong> box. Click to copy the full code. Do not change or remove any part of it. You will paste this entire block into your website builder in the next step.",
          },
          {
            type: "p",
            text: "For step-by-step instructions for your specific website host (WordPress, Wix, Squarespace, and more), choose your platform from the articles in this section.",
          },
        ],
      },
      {
        slug: "widget-using-custom-button",
        title: "Using a custom button (Popup mode)",
        content: [
          {
            type: "p",
            text: "The widget never renders an \"open\" button. In Popup mode you add the hidden widget once, then <strong>you add your own button</strong> (or link, or image) wherever you want and wire it to open the booking modal. You control the look and position completely.",
          },
          { type: "h3", text: "How it works" },
          {
            type: "ol",
            items: [
              "Paste the <strong>widget-only</strong> embed code once on the page (hidden div + script). The widget loads silently.",
              "Add your own button, link, or clickable element anywhere on the page and call <code>ClasseasilyWidget.open()</code> when it is clicked (same page) or <code>openClasseasilyBooking()</code> (Wix — see below).",
              "The booking flow opens as a full-screen overlay. No widget-owned button is ever shown.",
            ],
          },
          { type: "h3", text: "The embed code" },
          {
            type: "p",
            text: "In <strong>Widget Settings</strong>, select <strong>Popup</strong> and copy the embed code. It contains only the hidden widget (CSS link, div, script). There is no button in the snippet. Add your own trigger separately.",
          },
          {
            type: "ul",
            items: [
              "<strong>Widget block:</strong> Paste this once per page (or in header/footer so it loads on every page).",
              "<strong>Your button:</strong> Add any button/link/element and call <code>onclick=\"ClasseasilyWidget.open()\"</code> (plain HTML, WordPress, Squarespace, etc.) or use the connector script on Wix (see <a href=\"/business/help?category=widget-installation&article=widget-installation-wix\">Installing on Wix</a>).",
            ],
          },
          { type: "h3", text: "Same-page button (HTML, WordPress, Squarespace, Webflow)" },
          {
            type: "p",
            text: "If the widget and your button are on the same page (same HTML or same builder block), add <code>onclick=\"ClasseasilyWidget.open()\"</code> to the element that should open the modal. Example: <code>&lt;button onclick=\"ClasseasilyWidget.open()\"&gt;Book now&lt;/button&gt;</code>. Style and place it however you like.",
          },
          { type: "h3", text: "Wix: button anywhere on the page" },
          {
            type: "p",
            text: "On Wix the widget runs inside an iframe. To put your button in a different place (e.g. header or hero) and still get a full-screen modal with a clickable page when closed, use the <strong>two-embed + connector</strong> flow: one embed for the widget (pinned full viewport), one for the connector script, and any Wix element as your button that runs <code>openClasseasilyBooking()</code>. Full steps: <a href=\"/business/help?category=widget-installation&article=widget-installation-wix\">Installing on Wix</a>.",
          },
          { type: "h3", text: "Floating button (fixed position)" },
          {
            type: "p",
            text: "For a fixed corner button (e.g. bottom-right), style your own button with CSS and keep the same open call:",
          },
          {
            type: "ul",
            items: [
              "<code>position: fixed; bottom: 24px; right: 24px; z-index: 9999;</code>",
              "Use <code>onclick=\"ClasseasilyWidget.open()\"</code> (or <code>openClasseasilyBooking()</code> on Wix).",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>Tip:</strong> Paste the widget block in your site's global header or footer so it loads on every page; then place your button on any page. The modal will work wherever your button is.",
          },
          { type: "h3", text: "Inline mode (no button)" },
          {
            type: "p",
            text: "If you want the booking form to sit directly on the page with no popup and no trigger button, use <strong>Inline</strong> mode. Paste the widget embed where you want the form to appear. Layout is fully controlled by where you paste the block.",
          },
        ],
      },
      {
        slug: "widget-installation-wordpress",
        title: "Installing on WordPress",
        content: [
          {
            type: "p",
            text: "You can add the Classeasily widget to any WordPress page or post using a block that allows custom HTML. You will need the embed code from your Classeasily dashboard (Widget section).",
          },
          { type: "h3", text: "Block editor (Gutenberg)" },
          {
            type: "ol",
            items: [
              "Edit the page or post where you want the widget to appear.",
              "Click the <strong>+</strong> button to add a block.",
              "Search for <strong>Custom HTML</strong> and add it.",
              "Paste your full embed code into the Custom HTML block.",
              "Publish or update the page.",
            ],
          },
          { type: "h3", text: "Classic editor" },
          {
            type: "p",
            text: "Add a <strong>Custom HTML</strong> widget in the widget area, or use a plugin that lets you insert HTML into a page. Paste the full embed code there.",
          },
          {
            type: "p",
            text: "If you use a page builder (e.g. Elementor, Beaver Builder), look for an <strong>HTML</strong> or <strong>Code</strong> block or widget, then paste the same embed code.",
          },
          {
            type: "blockquote",
            text: "Don't forget to add your website domain in <strong>Widget</strong> → <strong>Allowed Domains</strong> before testing. If the widget doesn't appear, clear your site cache and try again.",
          },
        ],
      },
      {
        slug: "widget-installation-wix",
        title: "Installing on Wix",
        content: [
          {
            type: "p",
            text: "You can show the booking form in two ways: <strong>Popup</strong> (visitors click a button and a full-screen form appears) or <strong>Inline</strong> (the form sits directly on the page).",
          },
          {
            type: "blockquote",
            text: "<strong>Wix Free vs paid:</strong> Popup (button + modal) requires adding site-wide code, which is only available on a <strong>paid Wix plan</strong> (Custom Code). On the <strong>free plan</strong> you can only use <strong>Inline</strong> — the booking form embedded in the page. Both work; choose the option that fits your plan.",
          },
          { type: "h3", text: "Option 1: Inline (form on the page) — works on Free and paid" },
          {
            type: "p",
            text: "The booking form appears right where you place it. No button: visitors see and use the form in place.",
          },
          { type: "h4", text: "Steps" },
          {
            type: "ol",
            items: [
              "In your Classeasily dashboard, go to <strong>Widget</strong>, choose <strong>Inline</strong>, and copy the embed code.",
              "In Wix: <strong>Add</strong> (+) → <strong>Embed</strong> → <strong>HTML iframe</strong>. Paste the code into the embed.",
              "Place the embed where you want the form (e.g. in a section or sidebar). Don’t hide it — leave it visible so the form shows.",
              "Click <strong>Publish</strong>.",
            ],
          },
          {
            type: "blockquote",
            text: "Add your Wix site address (e.g. <code>https://yoursite.wixsite.com/yoursite</code>) under <strong>Widget → Allowed Domains</strong> in Classeasily. If the form doesn’t show, try clearing your browser cache or a private window.",
          },
          { type: "h3", text: "Option 2: Popup (button opens full-screen form) — paid Wix plan only" },
          {
            type: "p",
            text: "A “Book now” (or similar) button sits on your page. When visitors click it, a full-screen booking form opens. This needs <strong>Custom Code</strong>, which is only on paid Wix plans.",
          },
          { type: "h4", text: "Steps" },
          {
            type: "ol",
            items: [
              "In your Classeasily dashboard, go to <strong>Widget</strong>, choose <strong>Popup</strong>, and copy the code snippet (one script line with your key).",
              "In Wix: <strong>Settings</strong> → <strong>Custom Code</strong> → <strong>+ Add Code</strong>. Paste that snippet. Set <strong>Placement</strong> to <strong>Body - end</strong> and where to load it (e.g. All pages). Save.",
              "Add your button. If you use an <strong>HTML embed</strong> for the button: paste the button code from the dashboard (or use the example below). If you use a <strong>Wix button</strong> with Dev Mode (Velo), you can connect the click to open the form — see the dashboard for the exact line to run.",
              "Click <strong>Publish</strong>.",
            ],
          },
          {
            type: "p",
            text: "Example button you can paste inside an HTML embed (change the text if you like):",
          },
          {
            type: "code",
            text: `<button type="button" onclick="window.parent.openClasseasilyBooking()" style="padding:14px 28px;background:#2563eb;color:#fff;border:none;border-radius:10px;cursor:pointer;font-size:16px;font-weight:600;">Book now</button>`,
          },
          {
            type: "p",
            text: "Add your Wix site URL to <strong>Allowed Domains</strong> in Classeasily (Widget settings). If the popup doesn’t open, clear cache or try a private window.",
          },
        ],
      },
      {
        slug: "widget-installation-squarespace",
        title: "Installing on Squarespace",
        content: [
          {
            type: "p",
            text: "You can add the Classeasily widget to a Squarespace page using a Code block or Embed block. You will need the embed code from your Classeasily dashboard (Widget section).",
          },
          { type: "h3", text: "Steps" },
          {
            type: "ol",
            items: [
              "Edit the page where you want the widget.",
              "Add a block: choose <strong>Code</strong> or <strong>Embed</strong> (depending on your Squarespace version).",
              "Paste your full embed code into the block.",
              "Save the block and the page.",
              "Publish your site.",
            ],
          },
          {
            type: "p",
            text: "Some Squarespace themes also offer a <strong>Code Injection</strong> area in settings. For most users, the Code or Embed block on the page is the simplest option.",
          },
          {
            type: "blockquote",
            text: "Add your Squarespace domain (e.g. <code>https://yoursite.squarespace.com</code> or your custom domain) to <strong>Allowed Domains</strong> in Widget settings. Clear cache if the widget doesn't appear.",
          },
        ],
      },
      {
        slug: "widget-installation-webflow",
        title: "Installing on Webflow",
        content: [
          {
            type: "p",
            text: "You can add the Classeasily widget to any Webflow page using the Embed component. You will need the embed code from your Classeasily dashboard (Widget section).",
          },
          { type: "h3", text: "Steps" },
          {
            type: "ol",
            items: [
              "Open your Webflow project and the page where you want the widget.",
              "Drag an <strong>Embed</strong> component onto the page where the widget should appear.",
              "Double-click the Embed and paste your full embed code into the code box.",
              "Save and then <strong>Publish</strong> your site so the changes go live.",
            ],
          },
          {
            type: "blockquote",
            text: "Add your Webflow site URL (e.g. <code>https://yoursite.webflow.io</code> or your custom domain) to <strong>Allowed Domains</strong> in Widget settings. Clear cache if needed.",
          },
        ],
      },
      {
        slug: "widget-installation-shopify",
        title: "Installing on Shopify",
        content: [
          {
            type: "p",
            text: "You can show the Classeasily widget on your Shopify store by adding the embed code to a page or a section that allows custom HTML. You will need the embed code from your Classeasily dashboard (Widget section).",
          },
          { type: "h3", text: "Option 1: A page with custom HTML" },
          {
            type: "p",
            text: "If your theme or an app lets you add custom HTML to a page (e.g. a \"Show HTML\" option or a custom liquid section), create or edit a page (e.g. \"Book a class\"), paste your full embed code there, and save. This is the simplest approach for most store owners.",
          },
          { type: "h3", text: "Option 2: Theme code" },
          {
            type: "p",
            text: "Advanced users can add the embed code to a theme template or a custom liquid section. If you are not comfortable editing theme code, use Option 1 or contact a developer.",
          },
          {
            type: "blockquote",
            text: "Add your Shopify store URL (e.g. <code>https://yourstore.myshopify.com</code> or your custom domain) to <strong>Allowed Domains</strong> in Widget settings. Clear cache after adding the code.",
          },
        ],
      },
      {
        slug: "widget-installation-godaddy",
        title: "Installing on GoDaddy Website Builder",
        content: [
          {
            type: "p",
            text: "If your GoDaddy website builder has an option to add custom code or an embed, you can use it to add the Classeasily widget. You will need the embed code from your Classeasily dashboard (Widget section).",
          },
          { type: "h3", text: "Steps" },
          {
            type: "ol",
            items: [
              "Edit your site in GoDaddy Website Builder.",
              "Look for <strong>Embed</strong>, <strong>Custom Code</strong>, or <strong>HTML</strong> in the add element or block menu.",
              "Add that element to the page where you want the widget.",
              "Paste your full embed code and save.",
              "Publish your site.",
            ],
          },
          {
            type: "p",
            text: "If your plan does not allow custom code or embed, you may need to upgrade or use a different builder that supports it. You can also contact GoDaddy support to confirm how to add third-party embed code.",
          },
          {
            type: "blockquote",
            text: "Add your GoDaddy site address to <strong>Allowed Domains</strong> in Widget settings before testing.",
          },
        ],
      },
      {
        slug: "widget-installation-other",
        title: "Installing on any other website",
        content: [
          {
            type: "p",
            text: "Most website builders and custom sites let you add a block or section for custom HTML, embed code, or code. You can use that to add the Classeasily widget.",
          },
          { type: "h3", text: "What you need" },
          {
            type: "ul",
            items: [
              "The full embed code from your Classeasily dashboard (go to <strong>Widget</strong> and copy the code from the Embed code box).",
              "A place on your site that accepts \"Custom HTML\", \"Embed\", or \"Code\" (often in the page or section editor).",
            ],
          },
          { type: "h3", text: "What to do" },
          {
            type: "ol",
            items: [
              "Add your website address to <strong>Allowed Domains</strong> in Widget settings and save.",
              "Copy the full embed code from the dashboard (do not change it).",
              "Paste the entire code into the custom HTML / embed / code area where you want the widget to appear.",
              "Save and publish your page or site.",
            ],
          },
          {
            type: "p",
            text: "The code includes a link, a div, and a script. Paste all of it together. The widget will show up where you placed the div. If your builder has separate \"header\" and \"body\" code areas, you can paste the full block in the body (or where content is allowed).",
          },
          {
            type: "blockquote",
            text: "If the widget does not appear, see <strong>Troubleshooting and tips</strong> in this section. Make sure your domain is in Allowed Domains and try clearing your site and browser cache.",
          },
        ],
      },
      {
        slug: "widget-installation-troubleshooting",
        title: "Troubleshooting and tips",
        content: [
          {
            type: "p",
            text: "Use this page when the widget does not show, shows an error, or behaves oddly. Most issues are fixed by checking the allowed domains list and clearing cache.",
          },
          { type: "h3", text: "Allowed Domains (the allowed list)" },
          {
            type: "p",
            text: "Your widget only works on websites you have added to the <strong>Allowed Domains</strong> list in Widget settings. This is the list of websites that are allowed to show your widget.",
          },
          {
            type: "ul",
            items: [
              "Add the exact address visitors use: with or without <code>www</code> (e.g. <code>https://www.mysite.com</code> and <code>https://mysite.com</code> if you use both).",
              "Use <code>https://</code> if your site is HTTPS.",
              "Do not add a path or trailing slash: use <code>https://mysite.com</code> not <code>https://mysite.com/page</code>.",
            ],
          },
          { type: "h3", text: "Widget does not appear" },
          {
            type: "ul",
            items: [
              "<strong>Domain not allowed:</strong> Add your site to Allowed Domains in Widget settings and save, then reload your page.",
              "<strong>Browser extensions:</strong> Ad blockers or other extensions can block the script. Try opening your site in a private or incognito window, or another browser.",
              "<strong>Cache:</strong> After adding or changing the code, clear your website's cache (and your browser cache if needed). Many hosts have a \"Clear cache\" option in the dashboard.",
              "<strong>Code order:</strong> Paste the full snippet as given. Do not split it or change the order of the link, div, and script.",
            ],
          },
          { type: "h3", text: "Access denied or blank widget" },
          {
            type: "p",
            text: "This usually means the site's address is not in the Allowed Domains list. Check that the URL in your browser's address bar (when viewing your site) matches exactly what you added in Widget settings.",
          },
          { type: "h3", text: "Multiple pages" },
          {
            type: "p",
            text: "To show the widget on more than one page, paste the same embed code on each page where you want it. Some builders let you add code to a global header or footer so it appears on every page.",
          },
          { type: "h3", text: "Mobile" },
          {
            type: "p",
            text: "The widget is responsive and works on phones and tablets. If it looks wrong on mobile, check that the embed container on your site is not hidden or too narrow on small screens.",
          },
          { type: "h3", text: "Where to get the code" },
          {
            type: "p",
            text: "Always get the embed code from your dashboard: <strong>Widget</strong> (in the sidebar). Copy the full code and do not change the API key or script URL.",
          },
        ],
      },
    ],
  },
];
