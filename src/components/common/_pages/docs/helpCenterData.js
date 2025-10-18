// src/data/helpCenterData.js

import {
  Rocket,
  ShieldCheck,
  ClipboardList,
  CalendarDays,
  Banknote,
  Sparkles,
  Users,
  MessageSquareQuote,
  TrendingUp,
  Ticket,
  AppWindow,
} from "lucide-react";

export default function HelpCenterData() {
  return null; // or redirect
}

export const helpCenterData = [
  {
    slug: "getting-started",
    title: "Getting Started",
    icon: Rocket,
    description:
      "Essential first steps to get your business live on ClassEasily.",
    articles: [
      {
        slug: "setup-guide",
        title: "Your Business Setup Guide",
        content: [
          {
            type: "p",
            text: "Welcome to ClassEasily! Your dashboard includes a 'Setup Guide' widget that tracks your progress on the essential steps to go live. Completing these steps ensures students can find, book, and pay for your classes, and that you get paid correctly. Here's a breakdown of what they are and why they're important.",
          },
          { type: "h3", text: "1. Connect to Stripe" },
          {
            type: "p",
            text: "This is the most crucial step. Stripe is our secure payment partner, and connecting your account is <strong>how you get paid</strong> for your bookings. Without an active Stripe connection, you cannot receive any funds. We have a detailed guide on this specific step in the 'Connecting to Stripe' article.",
          },
          { type: "h3", text: "2. Complete Your Business Profile" },
          {
            type: "p",
            text: "Your profile is your virtual storefront and a key factor in building trust with potential students. A complete profile ranks higher in our search results. This involves:",
          },
          {
            type: "ul",
            items: [
              "<strong>Business Name & Description:</strong> Tell your story. What makes your classes unique?",
              "<strong>Business Image/Logo:</strong> A professional logo or a high-quality photo of your space builds credibility.",
              "<strong>Contact Information:</strong> How students can reach you for inquiries.",
              "<strong>Location Settings:</strong> Your physical address. You can choose to show the exact location or an approximate area for privacy.",
              "<strong>Operating Hours:</strong> Your general business hours, which help manage expectations.",
            ],
          },
          { type: "h3", text: "3. Create Your First Class" },
          {
            type: "p",
            text: 'A "Class" is the template for your offering (e.g., "Introduction to Pottery"). It holds the core details like the title, description, photos, and category. Think of it as your main service catalog. You will configure the specific options for this class in this step as well.',
          },
          { type: "h3", text: "4. Add Schedules" },
          {
            type: "p",
            text: 'A "Schedule" makes a Class bookable. It is the specific date, time, price, and capacity for a class that students see on your calendar. You can add a single one-off schedule or use the Bulk Create feature to quickly generate many schedules at once (e.g., every Monday and Wednesday for a month).',
          },
          {
            type: "blockquote",
            text: "<strong>Tip:</strong> Complete all setup steps to remove the guide from your dashboard and maximize your visibility in our search results. A complete profile builds student confidence and leads to more bookings.",
          },
        ],
      },
      {
        slug: "connecting-to-stripe",
        title: "Connecting to Stripe: Your Guide to Getting Paid",
        content: [
          {
            type: "p",
            text: "Connecting to Stripe is <strong>mandatory</strong> for all businesses to process payments securely and receive payouts. ClassEasily uses Stripe Connect to manage payments, ensuring the highest level of security and compliance.",
          },
          { type: "h3", text: "What is Stripe?" },
          {
            type: "p",
            text: "Stripe is a global, industry-leading payment processor known for its security and reliability. We partner with them so you can be confident that your payment and banking information is handled safely. <strong>ClassEasily never sees or stores your sensitive banking details.</strong> All information is sent directly to Stripe's secure servers.",
          },
          { type: "h3", text: "How to Connect" },
          {
            type: "ol",
            items: [
              "Navigate to your <strong>Dashboard</strong> → <strong>Settings</strong> → <strong>Preferences</strong>.",
              "Scroll down to the 'Payout Setup' section.",
              "Click the 'Setup Payouts' button. You will be redirected to Stripe's secure onboarding portal.",
              "You will be asked to either connect an existing Stripe account or create a new one. Follow the on-screen instructions carefully.",
            ],
          },
          { type: "h3", text: "Information Stripe Will Ask For" },
          {
            type: "p",
            text: "Stripe is a regulated financial service, so they are required by law ('Know Your Customer' obligations) to collect and verify your information to prevent fraud. Be prepared to provide:",
          },
          {
            type: "ul",
            items: [
              "<strong>Business Details:</strong> Your business type (Individual, Company), legal business name, address, and phone number.",
              "<strong>Personal Details:</strong> Your legal name, date of birth, and home address. This is required for identity verification of the business owner or representative, even if you are registering as a company.",
              "<strong>Banking Information:</strong> The bank account number and transit number where you want to receive your payouts.",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>Important:</strong> The information you provide must be accurate and match your legal documents. Inaccuracies can lead to significant delays in verification and payouts.",
          },
          { type: "h3", text: "Understanding Stripe Account Statuses" },
          {
            type: "p",
            text: "You can see your Stripe status in your ClassEasily Payouts settings. Here's what they mean:",
          },
          {
            type: "ul",
            items: [
              "<strong>Unlinked:</strong> You have not yet started the Stripe connection process.",
              "<strong>Incomplete:</strong> You started the process but have not submitted all the required information to Stripe. Click 'Update Account Details' to be redirected to Stripe and complete the required steps.",
              "<strong>Pending:</strong> You have submitted all your information, and it is currently being reviewed and verified by Stripe. This can take anywhere from a few minutes to several business days.",
              "<strong>Active:</strong> Congratulations! Your account is fully verified, and you can receive payouts.",
              "<strong>Restricted:</strong> Stripe needs more information from you or has identified an issue with your account. This can happen if information doesn't match or if periodic verification is required. Click 'Manage Payouts' to go to Stripe and see what is required. If the issue isn't clear, please contact our support, and we will help investigate.",
            ],
          },
        ],
      },
      {
        slug: "understanding-your-dashboard",
        title: "Understanding Your Dashboard Overview",
        content: [
          {
            type: "p",
            text: "The Dashboard Overview is your command center, providing a quick snapshot of your business's health and recent activity. Here's a breakdown of the key sections:",
          },
          { type: "h3", text: "Monthly Overview Metrics" },
          {
            type: "p",
            text: "These cards give you a high-level view of your performance in the current month compared to the previous month.",
          },
          {
            type: "ul",
            items: [
              "<strong>Students This Month:</strong> The total number of unique students who have booked a class this month.",
              "<strong>Active Classes:</strong> The number of classes that are currently visible to students and bookable.",
              "<strong>Gross Revenue (Month):</strong> Your total earnings for the month before any fees are deducted.",
              "<strong>Average Rating:</strong> The average star rating from all reviews received.",
            ],
          },
          { type: "h3", text: "Today's Snapshot" },
          {
            type: "p",
            text: "This section gives you a real-time look at what's happening today.",
          },
          {
            type: "ul",
            items: [
              "<strong>Classes Today:</strong> The number of class sessions scheduled for today.",
              "<strong>Bookings Today:</strong> The number of new booking transactions made today.",
              "<strong>Participants Today:</strong> The total number of participant spots booked in today's new bookings.",
            ],
          },
          { type: "h3", text: "Revenue Trend Chart" },
          {
            type: "p",
            text: "This chart visualizes your gross revenue over the last 30 days, helping you spot trends, busy periods, and the impact of promotions.",
          },
          { type: "h3", text: "Upcoming Classes" },
          {
            type: "p",
            text: "A quick-glance list of your scheduled classes for the next 7 days. It shows the class name, time, and current occupancy, allowing you to see which classes are filling up.",
          },
          { type: "h3", text: "Most Popular Classes & Recent Activity" },
          {
            type: "ul",
            items: [
              "<strong>Most Popular Classes:</strong> Ranks your classes by the total number of students enrolled, helping you understand what your audience loves.",
              "<strong>Recent Activity:</strong> A live feed of important events, such as new bookings, cancellations, and new reviews.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "website-integration",
    title: "Website Integration",
    icon: AppWindow,
    description: "Embed your booking calendar on your own website.",
    articles: [
      {
        slug: "embedding-the-booking-widget",
        title: "Embedding the Booking Widget on Your Website",
        content: [
          {
            type: "p",
            text: "Our booking widget allows you to take bookings and payments directly from your own website. It's designed to be easy to install and fully customizable to match your brand, turning your website visitors into paying customers without any complex development work.",
          },
          { type: "h3", text: "Step 1: Customize Your Widget" },
          {
            type: "p",
            text: "Before installing, you need to design your widget. Navigate to your <strong>Dashboard</strong> and find the <strong>Widget Settings</strong> page. Here, you'll find a live preview and several customization options:",
          },
          {
            type: "ul",
            items: [
              "<strong>Theme Presets & Colors:</strong> Quickly select a pre-made theme (like Default, Corporate, or Playful) or fine-tune every color to perfectly match your brand's palette.",
              "<strong>Typography & Styling:</strong> Choose a font family and decide on the roundness of corners (border-radius) for elements like buttons and cards.",
              "<strong>Layout & Behavior:</strong> Select a 'Comfortable' layout with more spacing or a 'Compact' one for tighter spaces. You can also choose how the widget displays:",
              "  - <strong>Inline:</strong> The full booking calendar is embedded directly on your page.",
              "  - <strong>Modal Button:</strong> A simple 'Book Now' button is shown on your page, which opens the widget in a pop-up (modal) when clicked.",
              "<strong>Feature a Specific Class:</strong> You can choose to have the widget open directly to a specific class's calendar, bypassing the initial class selection screen. Leave it empty to show all classes.",
            ],
          },
          {
            type: "blockquote",
            text: "As you make changes, the Live Preview on the right side of the screen updates instantly, so you know exactly how it will look.",
          },
          { type: "h3", text: "Step 2: Get Your Embed Code" },
          {
            type: "p",
            text: "Once you are happy with your widget's design, click on the <strong>Installation</strong> tab. You will see a small block of HTML code. This snippet contains everything needed for the widget to work. Click the 'Copy' button to copy the entire code to your clipboard.",
          },
          {
            type: "p",
            text: "The code will look something like this:",
          },
          {
            type: "p",
            text: `<pre style="background-color: #f6f9fc; padding: 16px; border-radius: 6px; border: 1px solid #e3e8ee; font-size: 14px; overflow-x: auto; white-space: pre-wrap; word-wrap: break-word;"><code>&lt;div class="classeasily-widget" data-widget-api-key="..." ...&gt;&lt;/div&gt;\n\n&lt;script src="https://staging.classeasily.com/widget/widget.js" async defer&gt;&lt;/script&gt;</code></pre>`,
          },
          { type: "h3", text: "Step 3: Install the Widget on Your Website" },
          {
            type: "p",
            text: "Paste the code snippet you copied into your website's HTML. The best place to put it is right before the closing <code>&lt;/body&gt;</code> tag. Below are instructions for popular platforms.",
          },
          { type: "h4", text: "For a standard HTML website:" },
          {
            type: "p",
            text: "Open the HTML file of the page where you want the widget to appear. Paste the code snippet anywhere in the <code>&lt;body&gt;</code> section.",
          },
          { type: "h4", text: "For WordPress:" },
          {
            type: "ol",
            items: [
              "Log in to your WordPress admin panel.",
              "Go to the Page or Post where you want to add the widget.",
              "Click the '+' icon to add a new block and search for 'Custom HTML'.",
              "Paste the widget's embed code into the Custom HTML block.",
              "Click 'Update' or 'Publish' to save your changes.",
            ],
          },
          { type: "h4", text: "For Squarespace, Wix, or other builders:" },
          {
            type: "p",
            text: "These platforms use blocks or elements for adding custom code.",
          },
          {
            type: "ul",
            items: [
              "Find the option to add an 'Embed', 'Code', or 'Custom HTML' block/element.",
              "Drag this block to the desired location on your page.",
              "Paste the widget's embed code into the block and save.",
            ],
          },
          { type: "h3", text: "Important: Security Setup" },
          {
            type: "p",
            text: "For your security, the widget will only work on domains you explicitly allow. In the Widget Customizer, go to the <strong>Security</strong> tab.",
          },
          {
            type: "ul",
            items: [
              "In the 'Allowed Domains' box, enter the domain of your website (e.g., <code>my-business.com</code>).",
              "If you use different versions, add each one on a new line (e.g., <code>www.my-business.com</code>).",
              "This is a critical step to prevent others from using your widget on their websites.",
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "classes-and-scheduling",
    title: "Classes & Scheduling",
    icon: CalendarDays,
    description:
      "Creating classes, understanding schedules, and managing your calendar.",
    articles: [
      {
        slug: "class-vs-schedule",
        title: "Understanding: Class vs. Schedule",
        content: [
          {
            type: "p",
            text: "It's important to understand the distinction between a <strong>Class</strong> and a <strong>Schedule</strong> in ClassEasily. This concept gives you powerful flexibility in managing your offerings.",
          },
          { type: "h3", text: "The Class: Your Template" },
          {
            type: "p",
            text: 'Think of the <strong>Class</strong> as your master template or your course catalog entry. It holds all the core, unchanging information about an offering. This includes:',
          },
          {
            type: "ul",
            items: [
              "<strong>Title and Description:</strong> What is the class about?",
              "<strong>Photos:</strong> Visuals that represent the experience.",
              "<strong>Category:</strong> How the class is categorized (e.g., Art, Music).",
              "<strong>Location & Contact Info:</strong> Where it happens and how to ask questions.",
              "<strong>Class Options:</strong> The general rules for the offering, such as the required skill level (e.g., Beginner), cancellation policy, and equipment needs.",
            ],
          },
          {
            type: "p",
            text: "You create a Class once for each unique type of workshop you offer (e.g., 'Beginner Pottery', 'Advanced Watercolour').",
          },
          { type: "h3", text: "The Schedule: The Bookable Event" },
          {
            type: "p",
            text: "A <strong>Schedule</strong> is a specific, bookable instance of a Class. It's what students actually see on your calendar and book. Each schedule has details that can change for each event:",
          },
          {
            type: "ul",
            items: [
              "<strong>Date:</strong> The specific day the class takes place.",
              "<strong>Time:</strong> The start time of the class.",
              "<strong>Price:</strong> The cost for that specific session.",
              "<strong>Duration:</strong> How long the session is (in minutes).",
              "<strong>Capacity:</strong> The number of available spots.",
            ],
          },
          { type: "h3", text: "Example Scenario" },
          {
            type: "p",
            text: "Imagine you teach a pottery class.",
          },
          {
            type: "ul",
            items: [
              'You create one <strong>Class</strong> named "Introduction to Pottery Wheel". You add a great description, beautiful photos of student creations, set the skill level to "Beginner", and a "24-hour" cancellation policy.',
              "Then, you add multiple <strong>Schedules</strong> for this class:",
              " - A session on <strong>October 5th at 6:00 PM</strong> for <strong>$80</strong> with <strong>8 spots</strong>.",
              " - A session on <strong>October 12th at 6:00 PM</strong> for <strong>$80</strong> with <strong>8 spots</strong>.",
              " - A special weekend session on <strong>October 15th at 10:00 AM</strong> for a different price of <strong>$95</strong> with only <strong>6 spots</strong>.",
            ],
          },
          {
            type: "blockquote",
            text: "This structure means you don't have to re-enter the description, photos, and policies every time you want to schedule a new date for your pottery class. You just add a new schedule!",
          },
        ],
      },
      {
        slug: "creating-a-class",
        title: "Creating and Editing Your Classes",
        content: [
          {
            type: "p",
            text: 'A "Class" represents your core offering (e.g., "Introduction to Pottery," "Advanced Watercolour Painting"). It acts as the main template containing all the descriptive information and settings.',
          },
          { type: "h3", text: "Creating Your First Class" },
          {
            type: "ol",
            items: [
              "Navigate to <strong>Dashboard</strong> → <strong>Class Management</strong>.",
              "Click the 'Create New Class' button to open the class creation form.",
              "The form is divided into steps. Complete the information in each step as described below.",
            ],
          },
          { type: "h3", text: "Step 1: Basic Info" },
          {
            type: "ul",
            items: [
              "<strong>Class Title:</strong> Create a clear, engaging, and descriptive name. This is the first thing students see.",
              "<strong>Class Description:</strong> This is your sales pitch! Explain what students will learn, the class format, your teaching style, and what makes your approach unique. Include any prerequisites. A detailed description (100+ characters) is crucial for attracting students.",
              "<strong>Class Images:</strong> Upload 5-10 high-quality images. Show your workspace, materials, instructors in action, and examples of student work. The first image is automatically set as the cover photo, but you can change this.",
              "<strong>Category & Subcategory:</strong> Choose the most relevant options (e.g., Art → Painting) to ensure your class appears in the right searches.",
              "<strong>Class Features:</strong> Select from the list of predefined tags (e.g., 'All Materials Provided', 'Beginner Friendly') or add your own custom tags to highlight key benefits.",
            ],
          },
          { type: "h3", text: "Step 2: Location & Contact" },
          {
            type: "ul",
            items: [
              "<strong>Location Search:</strong> Type your address and select the correct one from the dropdown. This places your class on the map.",
              "<strong>Location Privacy:</strong> Choose to show the exact pin or a general area circle on the map. The exact address is always shown to students after they book.",
              "<strong>Contact Info:</strong> Provide the email and phone number that students should use if they have questions about this specific class.",
            ],
          },
          { type: "h3", text: "Step 3: Class Options" },
          {
            type: "p",
            text: "This step defines the rules and parameters for this class offering.",
          },
          {
            type: "ul",
            items: [
              "<strong>Experience Level:</strong> Specify if the class is for beginners, intermediate, advanced, or all levels.",
              "<strong>Cancellation Policy:</strong> Set the required notice period for a student to cancel and be eligible for a refund (e.g., 24 hours, 48 hours, Strict).",
              "<strong>Refund Percentage:</strong> The percentage of the class price that is refunded if a student cancels within the allowed notice period. This is automatically set to 0% for the 'Strict' policy.",
              "<strong>Equipment & Tags:</strong> List any items students need to bring, and add any other relevant keywords or tags.",
            ],
          },
          { type: "h3", text: "Editing a Class" },
          {
            type: "p",
            text: "To edit an existing class, navigate to <strong>Class Management</strong>, find the class card, and click the 'Edit' (pencil) icon. This will open a drawer where you can modify all the same details you entered during creation.",
          },
          {
            type: "blockquote",
            text: "<strong>Best practice:</strong> Classes with detailed descriptions and multiple high-quality images get up to 5 times more clicks than those with minimal information. This also helps with SEO, making your class more visible on search engines like Google.",
          },
        ],
      },
      {
        slug: "building-your-schedule",
        title: "Building Your Schedule (Making Classes Bookable)",
        content: [
          {
            type: "p",
            text: 'A "Schedule" brings your Class to life by setting specific dates, times, prices, and capacity. This is what students book from your public calendar.',
          },
          { type: "h3", text: "How to Add Schedules" },
          {
            type: "ol",
            items: [
              "Navigate to <strong>Dashboard</strong> → <strong>Class Management</strong>.",
              "Find the class you want to add a schedule to and click the <strong>'Manage Schedules'</strong> button.",
              "This will open the schedule management drawer for that class.",
              "Click the <strong>'Add New Schedule'</strong> button.",
            ],
          },
          { type: "h3", text: "Creating a Single Session" },
          {
            type: "p",
            text: "This is for creating one-off classes. In the 'Single Schedule' tab:",
          },
          {
            type: "ul",
            items: [
              "<strong>Session Date:</strong> The specific date of the class.",
              "<strong>Start Time & Duration:</strong> When the class begins and how long it lasts.",
              "<strong>Price & Capacity:</strong> The cost for the session and the number of available spots.",
              "<strong>Schedule Name (Optional):</strong> An internal name to help you group and manage schedules, e.g., 'Weekday Evenings'.",
            ],
          },
          { type: "h3", text: "Bulk Creating Sessions" },
          {
            type: "p",
            text: "This is a powerful time-saving feature for creating many schedules at once. Switch to the 'Bulk Create' tab:",
          },
          {
            type: "ul",
            items: [
              "<strong>Date Range:</strong> Select the start and end date for which you want to generate schedules.",
              "<strong>Days of the Week:</strong> Choose the specific days within that range (e.g., every Monday, Wednesday, and Friday).",
              "<strong>Times:</strong> Add one or more start times. A schedule will be created for each time on each selected day.",
              "<strong>Common Details:</strong> Set the duration, price, and capacity that will apply to ALL schedules created in this batch.",
            ],
          },
          { type: "h3", text: "Editing a Schedule" },
          {
            type: "p",
            text: "In the 'Manage Schedules' drawer, find the schedule you wish to edit and click the 'Edit' (pencil) icon.",
          },
          {
            type: "blockquote",
            text: "<strong>Important:</strong> Once a schedule has at least one confirmed booking, you can no longer change its date, time, or duration to protect the student's booking. However, you can still edit the <strong>price</strong> (for future bookings) and <strong>capacity</strong> at any time.",
          },
        ],
      },
    ],
  },
  {
    slug: "bookings-and-students",
    title: "Bookings & Students",
    icon: Users,
    description: "Manage your incoming bookings and view student information.",
    articles: [
      {
        slug: "managing-active-bookings",
        title: "Managing Active Bookings",
        content: [
          {
            type: "p",
            text: "The 'Active Bookings' page is where you manage all upcoming, confirmed bookings. It is crucial for keeping track of who is attending your classes.",
          },
          { type: "h3", text: "Finding Bookings" },
          {
            type: "p",
            text: "You can find bookings using the filters at the top of the page:",
          },
          {
            type: "ul",
            items: [
              "<strong>Search Bar:</strong> Quickly find a booking by the student's name, email, booking reference ID, or class title.",
              "<strong>Date Picker:</strong> By default, it shows bookings from today onwards. You can select a custom date range to find specific upcoming bookings.",
            ],
          },
          { type: "h3", text: "Viewing Booking Details" },
          {
            type: "p",
            text: "Click the 'View' button on any booking in the list to open the Booking Details Drawer. This drawer provides a comprehensive overview, including:",
          },
          {
            type: "ul",
            items: [
              "<strong>Student Information:</strong> Name, email, and phone number.",
              "<strong>Class & Schedule Details:</strong> The exact class, date, time, and duration.",
              "<strong>Attendee Information:</strong> A list of all participant names for that booking.",
              "<strong>Payment Information:</strong> The gross amount paid, payment status, and a link to the Stripe transaction.",
              "<strong>Notes from Booker:</strong> Any special requests or information the student provided during checkout.",
            ],
          },
          { type: "h3", text: "Cancelling a Booking" },
          {
            type: "p",
            text: "As a business, you may need to cancel a booking. You can do this from the Active Bookings list or within the Booking Details Drawer.",
          },
          {
            type: "ol",
            items: [
              "Find the booking you wish to cancel.",
              "Click the 'Cancel' button.",
              "A confirmation pop-up will appear. Confirming the cancellation is a <strong>permanent action</strong>.",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>What happens when you cancel?</strong> The student is automatically notified via email, and a full refund is initiated through Stripe. The funds will be returned to their original payment method.",
          },
        ],
      },
      {
        slug: "student-profiles",
        title: "Viewing Student Profiles & History",
        content: [
          {
            type: "p",
            text: "The 'Students' tab in your dashboard provides a directory of every student who has ever booked a class with you. Clicking on any student card opens their detailed Student Profile.",
          },
          { type: "h3", text: "The Student Card" },
          {
            type: "p",
            text: "The main student list gives you a quick overview:",
          },
          {
            type: "ul",
            items: [
              "<strong>Name and Status:</strong> The student's name and whether they are 'Active' (have upcoming bookings) or 'Inactive'.",
              "<strong>Classes Taken:</strong> Total number of classes they have completed with you.",
              "<strong>Total Spent:</strong> The lifetime gross revenue from this student.",
              "<strong>Last Booking:</strong> The date of their most recent class booking.",
            ],
          },
          { type: "h3", text: "The Student Profile" },
          {
            type: "p",
            text: "This detailed view provides a comprehensive history of the student's engagement with your business.",
          },
          {
            type: "ul",
            items: [
              "<strong>Header Stats:</strong> Key metrics like 'Member Since', total classes, attendance rate, and total spent.",
              "<strong>Notes & Activity:</strong> This is a crucial section for internal record-keeping. You can add private notes about a student (e.g., 'Allergic to peanuts', 'Interested in advanced workshops'). These notes are <strong>only visible to you and your staff</strong>, not the student.",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>Tip:</strong> Use the Notes section to build stronger relationships with your students by remembering key details about their progress and preferences.",
          },
        ],
      },
    ],
  },
  {
    slug: "finances",
    title: "Finances & Payouts",
    icon: Banknote,
    description: "Track your earnings, understand fees, and manage payouts.",
    articles: [
      {
        slug: "revenue-dashboard",
        title: "Understanding Your Revenue Dashboard",
        content: [
          {
            type: "p",
            text: "Your Revenue Dashboard provides a comprehensive, real-time overview of your business's financial performance. Navigate to <strong>Dashboard</strong> → <strong>Revenue</strong> to access it.",
          },
          { type: "h3", text: "Key Metrics Explained" },
          {
            type: "p",
            text: "The cards at the top show key calculations for the selected date range:",
          },
          {
            type: "ul",
            items: [
              "<strong>Total Gross Revenue:</strong> The total amount of money charged to students for bookings before any deductions. This is your top-line revenue.",
              "<strong>Est. Platform Fees (20%):</strong> ClassEasily's service fee. This covers all Stripe payment processing fees, platform development, maintenance, and customer support.",
              "<strong>Est. Net Revenue:</strong> Your estimated take-home earnings after the platform fee is deducted (Gross Revenue - Platform Fees). This is the amount that will be scheduled for payout.",
              "<strong>Average Order Value:</strong> The average gross revenue generated per booking transaction.",
              "<strong>Revenue Per User:</strong> The average gross revenue generated per unique student.",
            ],
          },
          { type: "h3", text: "Charts and Data Visualizations" },
          {
            type: "p",
            text: "The charts provide deeper insights into your revenue streams:",
          },
          {
            type: "ul",
            items: [
              "<strong>Revenue Trends:</strong> A line chart showing your Gross, Net, and Fee amounts over time. This helps you visualize your earnings day by day.",
              "<strong>Revenue by Class:</strong> A bar chart that ranks your classes by the gross revenue they have generated, helping you identify your most profitable offerings.",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>Note:</strong> All figures on the Revenue dashboard are based on the <strong>booking date</strong> and are presented in your local business timezone. This differs from the Payouts page, which is based on transfer dates.",
          },
        ],
      },
      {
        slug: "payouts-explained",
        title: "How Payouts Work",
        content: [
          {
            type: "p",
            text: "Understanding when and how you get paid is crucial for managing your business cash flow. Payouts are handled automatically by our payment partner, Stripe.",
          },
          { type: "h3", text: "Payout Timeline" },
          {
            type: "p",
            text: "Here is the step-by-step process from booking to bank deposit:",
          },
          {
            type: "ol",
            items: [
              "A student books and pays for a class. The funds are securely held by Stripe.",
              "The class session is completed.",
              "24 hours after the class ends, the Net Revenue (Class Price - 20% Platform Fee) becomes available for payout.",
              "Stripe automatically initiates a transfer (a 'payout') to your connected bank account.",
              "It typically takes an additional <strong>1-3 business days</strong> for the funds to appear in your bank account, depending on your bank's processing times.",
            ],
          },
          { type: "h3", text: "The Payouts Page" },
          {
            type: "p",
            text: "Navigate to <strong>Dashboard</strong> → <strong>Payouts</strong> to see your payout summary and history.",
          },
          {
            type: "ul",
            items: [
              "<strong>Pending Payout Amount:</strong> The total net revenue from completed classes that is not yet part of a payout transfer. This is your upcoming earnings.",
              "<strong>Next Payout Schedule:</strong> Payouts are processed daily.",
              "<strong>Last Payout Amount:</strong> The value of the most recent transfer sent to your bank.",
              "<strong>Payouts Status:</strong> Your Stripe account's current status (e.g., Active, Pending, Restricted).",
              "<strong>Payout History:</strong> A detailed log of every transfer made to your bank. You can expand each entry to see all the individual bookings included in that payout and link directly to the transaction on Stripe.",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>Important:</strong> To avoid payout delays, ensure your Stripe account remains in 'Active' status. If it becomes 'Restricted', navigate to your Stripe dashboard immediately to resolve any issues. Failed payout are re-attempted the next day.",
          },
        ],
      },
    ],
  },
  {
    slug: "team-and-community",
    title: "Team & Community",
    icon: MessageSquareQuote,
    description: "Manage your team members and engage with your students.",
    articles: [
      {
        slug: "managing-staff",
        title: "Managing Staff & Permissions (Roles)",
        content: [
          {
            type: "p",
            text: "The Staff Management section allows you to securely grant dashboard access to your team members with specific permissions, ensuring they can only see and do what you allow.",
          },
          { type: "h3", text: "Understanding Roles vs. Team Members" },
          {
            type: "ul",
            items: [
              "A <strong>Role</strong> is a template of permissions. You define a role once (e.g., 'Instructor', 'Admin Assistant') and specify what that role can do.",
              "A <strong>Team Member</strong> is a person you invite, to whom you assign one of your created roles.",
            ],
          },
          { type: "h3", text: "Creating a Custom Role" },
          {
            type: "ol",
            items: [
              "Navigate to <strong>Dashboard</strong> → <strong>Staff</strong> → <strong>Roles & Permissions</strong> tab.",
              "Click 'Create Role'.",
              "Give the role a descriptive name (e.g., 'Front Desk Staff') and a description.",
              "Go through the permission groups (e.g., 'Class Management', 'Financials') and check the specific permissions you want to grant to this role.",
              "Click 'Create Role' to save it.",
            ],
          },
          { type: "h3", text: "Inviting a Team Member" },
          {
            type: "ol",
            items: [
              "Go to the <strong>Team Members</strong> tab.",
              "Click 'Invite Staff'.",
              "Enter the email address of the person you want to invite.",
              "Select the Role you want to assign them from the dropdown.",
              "An email invitation will be sent. Their status will show as 'Pending' until they accept and create their login.",
            ],
          },
          {
            type: "blockquote",
            text: "<strong>Note:</strong> The 'Business Owner' role is a default system role and cannot be edited or deleted. It has all permissions.",
          },
        ],
      },
      {
        slug: "managing-reviews",
        title: "Managing Student Reviews",
        content: [
          {
            type: "p",
            text: "Student reviews are vital for building trust and attracting new bookings. The 'Reviews' page helps you monitor, manage, and respond to all feedback.",
          },
          { type: "h3", text: "The Review Lifecycle" },
          {
            type: "p",
            text: "When a student leaves a review, it goes through a process:",
          },
          {
            type: "ul",
            items: [
              "<strong>Under Review:</strong> The review is first checked by our system for compliance with our content policy. This status is temporary.",
              "<strong>Approved:</strong> The review is public and visible on your class page.",
              "<strong>Hidden:</strong> The review was found to violate our policy, or you have successfully reported it, and it has been removed from public view.",
            ],
          },
          { type: "h3", text: "Responding to Reviews" },
          {
            type: "p",
            text: "Engaging with feedback shows you care about the student experience. From the main table, click the action menu (...) on a review and select 'Respond'.",
          },
          {
            type: "ul",
            items: [
              "<strong>Be Professional:</strong> Always maintain a friendly and professional tone, even if the feedback is negative.",
              "<strong>Be Timely:</strong> Try to respond within 24-48 hours.",
              "<strong>Thank Them:</strong> Thank positive reviewers for their feedback.",
              "<strong>Address Concerns:</strong> For negative reviews, acknowledge their experience and briefly state what you'll do to improve. Avoid getting into a public argument.",
            ],
          },
          { type: "h3", text: "Handling Problematic Reviews" },
          {
            type: "p",
            text: "If you believe a review violates ClassEasily's Content Policy (e.g., contains hate speech, spam, or is not relevant to the class experience), you can report it. Click the action menu (...) and select 'Report'. Provide a clear reason for the report, and our moderation team will investigate.",
          },
          {
            type: "blockquote",
            text: "<strong>Review Tip:</strong> Businesses that thoughtfully respond to both positive and negative reviews receive up to 25% more bookings than those who don't engage with feedback.",
          },
        ],
      },
    ],
  },
  {
    slug: "marketing-and-promotions",
    title: "Marketing & Promotions",
    icon: Ticket,
    description: "Tools to help you grow your audience and boost sales.",
    articles: [
      {
        slug: "creating-discounts",
        title: "Creating and Managing Discounts",
        content: [
          {
            type: "p",
            text: "Discounts are a powerful tool to attract new students, reward loyal customers, and fill empty spots in your classes. You can create two types of discounts: automatic discounts or coupon codes.",
          },
          { type: "h3", text: "Creating a New Discount" },
          {
            type: "ol",
            items: [
              "Navigate to <strong>Dashboard</strong> → <strong>Discounts</strong>.",
              "Click 'Create Discount' to open the configuration form.",
            ],
          },
          { type: "h3", text: "Discount Configuration" },
          {
            type: "ul",
            items: [
              "<strong>Internal Name:</strong> A name for your reference (e.g., 'Fall 2024 Special'). This is not visible to students.",
              "<strong>Coupon Code:</strong> If you want students to enter a code at checkout (e.g., 'SAVE20'), enter it here. <strong>If you leave this blank, the discount will be applied automatically</strong> to all eligible bookings.",
              "<strong>Discount Type:</strong> Choose between a 'Percentage' (e.g., 20% off) or a 'Fixed Amount' (e.g., $10 off).",
              "<strong>Discount Scope:</strong> Choose what the discount applies to. This can be an 'Entire Class' (all schedules for that class) or a 'Specific Schedule Group' (only schedules with a specific name, like 'Weekday Mornings').",
              "<strong>Validity Period:</strong> Set a start and end date for your promotion. Leave it blank for an ongoing discount.",
              "<strong>Usage Limits:</strong> You can set a total usage limit (e.g., 'first 50 students') and/or a limit per user (e.g., 'one use per student').",
              "<strong>Minimum Purchase:</strong> Require a minimum booking total for the discount to apply.",
            ],
          },
          { type: "h3", text: "Managing Discounts" },
          {
            type: "p",
            text: "The main table shows all your created discounts. You can see the discount value, its scope, and track its total usage. You can also:",
          },
          {
            type: "ul",
            items: [
              "<strong>Toggle Status:</strong> Quickly activate or deactivate a discount using the switch.",
              "<strong>Edit:</strong> Click the 'Edit' icon to modify any of the discount's rules.",
              "<strong>Delete:</strong> Permanently remove a discount.",
            ],
          },
        ],
      },
    ],
  },
];