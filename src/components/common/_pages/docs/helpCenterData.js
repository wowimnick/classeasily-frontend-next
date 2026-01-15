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
        slug: "setup-guide",
        title: "Your Host Setup Checklist",
        content: [
          {
            type: "p",
            text: "Welcome to ClassEasily! Getting your business up and running as a Host is simple. Follow this checklist to ensure you are ready to accept bookings and payments.",
          },
          { type: "h3", text: "1. Connect Stripe for Payouts" },
          {
            type: "p",
            text: "This is the most critical step. You cannot receive money until you connect a Stripe account. Navigate to <strong>Settings</strong> &rarr; <strong>Payouts</strong> to link your bank account securely. This automatically enables credit card, <strong>Apple Pay</strong>, and <strong>Google Pay</strong> processing for your Guests.",
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
          {
            type: "p",
            text: "When you click 'Connect Payouts', you will be redirected to a secure Stripe Express page to verify your identity and link your payout method.",
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
    ],
  },
  {
    slug: "experiences-and-scheduling",
    title: "Experiences & Scheduling",
    icon: CalendarDays,
    description:
      "Learn how to set up single sessions, multi-day adventures, and manage your calendar.",
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
        slug: "booking-types",
        title: "Single Sessions vs. Multi-Day Adventures",
        content: [
          {
            type: "p",
            text: "When creating a Schedule, you can choose between two booking types. This setting changes how Guests book and how you get paid.",
          },
          { type: "h3", text: "Single Session" },
          {
            type: "p",
            text: "Guests reserve one specific date. This is perfect for drop-in experiences like city tours, cooking classes, or equipment rentals.",
          },
          { type: "h3", text: "Multi-Day Adventure (Full Course)" },
          {
            type: "p",
            text: "A Multi-Day Adventure is a bundle of sessions that must be booked together. Guests pay one price for the entire series. This is ideal for:",
          },
          {
            type: "ul",
            items: [
              "3-day retreats",
              "6-week bootcamps",
              "Progressive workshops (Level 1, 2, 3)",
            ],
          },
          {
            type: "p",
            text: "When setting up an adventure, you define the start date, end date, and days of the week (e.g., 'Every Mon/Wed for 4 weeks'). The system automatically generates all the individual session instances for you.",
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
              "Go to <strong>Experience Management</strong> and click 'Manage Schedules' on an experience.",
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
            text: "The <strong>Bookings</strong> tab is your command center. Here you can see who is coming to your experience, check payment statuses, handle cancellations, and rescheduling.",
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
            text: "Moving from another system? You can bulk import your existing guest list into ClassEasily using a CSV or Excel file.",
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
              "<strong>Platform Fees:</strong> The service fee charged by ClassEasily (includes credit card processing costs).",
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
        slug: "payout-schedule",
        title: "Payout Schedules & Adventure Payouts",
        content: [
          {
            type: "p",
            text: "Payouts are automated. You do not need to manually request withdrawals.",
          },
          { type: "h3", text: "When do I get paid?" },
          {
            type: "p",
            text: "Funds for a session are released to your payout balance approximately 24-48 hours after the experience is <strong>completed</strong>.",
          },
          { type: "h3", text: "Payouts for Multi-Day Adventures (Important)" },
          {
            type: "p",
            text: "If you are running a multi-session <strong>Adventure/Course</strong> (e.g., a 10-week bootcamp where guests pay upfront), you do not receive the entire lump sum immediately.",
          },
          {
            type: "p",
            text: "Instead, the system takes the total amount paid by the Guest and divides it by the number of sessions in the adventure. The funds for each specific session are released <strong>after that specific session takes place</strong>.",
          },
          {
            type: "blockquote",
            text: "<strong>Example:</strong> A Guest pays $100 for a 4-week adventure. You will receive $25 after Week 1 is completed, $25 after Week 2, and so on. This ensures that if an adventure is cancelled mid-way, refunds are easier to manage and protects you from liability.",
          },
          { type: "h3", text: "Daily Bank Transfers" },
          {
            type: "p",
            text: "Once funds are released to your balance (post-completion), Stripe automatically transfers them to your bank account on a rolling daily basis. Depending on your bank, it may take 1-3 business days for the funds to appear in your statement.",
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
            text: "Once a role exists, go to the <strong>Team</strong> tab and invite a team member by email. They will receive a link to create their own login. They will strictly see only what their role allows.",
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
        slug: "website-widget",
        title: "Website Integration (Widget)",
        content: [
          {
            type: "p",
            text: "Turn your own website into a booking engine. Our widget (beta) allows Guests to reserve experiences without leaving your site.",
          },
          { type: "h3", text: "Setup" },
          {
            type: "ol",
            items: [
              "Go to <strong>Widget Settings</strong> in your dashboard.",
              "Customize the colors and fonts to match your brand.",
              "Copy the generated HTML code.",
              "Paste it into your website builder (Wix, Squarespace, WordPress, etc.) inside a 'Custom HTML' block.",
            ],
          },
          { type: "h3", text: "Security" },
          {
            type: "p",
            text: "To prevent others from using your widget, you must whitelist your website domain in the widget settings (e.g., <code>www.myadventures.com</code>).",
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
              "<strong>Automatic Discounts:</strong> (Coming Soon) Automatically applied at checkout.",
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
];
