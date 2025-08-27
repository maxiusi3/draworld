# **Product Requirements Document: Draworld - V1.0 (MVP)**

## **1. Revision History**
| Version | Date | Author | Revision Notes |
| :--- | :--- | :--- | :--- |
| V1.0 | 2023-10-27 | AIO-PM | Initial draft creation for MVP. |

## **2. Project Background & Goal**
### **2.1 Core Problem**
Parents of young children (ages 3-10) accumulate a large volume of physical artwork. These cherished creations are difficult to preserve, manage, and share effectively. They often end up stored in boxes, susceptible to damage and being forgotten. Furthermore, a static photograph fails to capture the imagination and story behind the child's art, missing an opportunity to further encourage their creativity.

### **2.2 Project Goals (MVP)**
1.  **Validate Core Value Proposition:** To verify that parents are willing to upload their children's drawings to an online service to transform them into animated videos. **Success Metric:** Achieve a 10% conversion rate from new visitor to first video generation.
2.  **Test Monetization Model:** To confirm user willingness to pay for premium features or additional usage through a credit-based system. **Success Metric:** Achieve a 1% paid conversion rate among active users.
3.  **Establish Initial Growth Loop:** To build and test a user referral system and a social sharing mechanism as primary drivers for early-stage user acquisition. **Success Metric:** Achieve a K-factor of > 0.1.

## **3. User Persona & Scenarios**
### **3.1 Target Persona**
*   **Name:** Sarah, the Millennial Mom
*   **Age:** 32
*   **Children:** A 6-year-old daughter (Lily) who loves drawing, and a 3-year-old son.
*   **Occupation:** Marketing Manager
*   **Behavior:** Tech-savvy, active on Instagram and Facebook, part of several parent groups online. Loves sharing her children's milestones.
*   **Frustrations:** Her refrigerator is covered in Lily's art. She takes photos of the best ones but they get lost in her phone's camera roll. She feels guilty when she has to throw some away to make space.

### **3.2 User Scenarios**
*   **Scenario 1: The Fresh Masterpiece:** Lily excitedly shows Sarah a new drawing of a "cat flying to the moon." Sarah immediately takes out her phone, goes to the Draworld website, snaps a photo of the drawing, types the prompt "A cat flying to the moon," and within a minute, shows Lily a short, magical animation of her cat astronaut soaring through space with a gentle background tune. Lily is ecstatic.
*   **Scenario 2: Rediscovering a Treasure:** While cleaning, Sarah finds a box of Lily's old drawings from when she was 4. She picks a favorite, a colorful zebra, and uses Draworld to create a video titled "Lily's First Zebra (Age 4)." She downloads the video and shares it to a private family group, adding a touching piece of digital memorabilia to their collection.

## **4. Feature Specifications**

### **4.1 Module 1: Core Creation Flow (Unregistered & Registered Users)**

#### **4.1.1 User Story 1.1: As a user, I want to upload a picture of an artwork so that I can use it as the base for my animation.**
*   **User Interface & Logic:**
    1.  On the creation page, a prominent upload area is displayed, accepting drag-and-drop on desktop.
    2.  Two buttons are present: `[ Select from device ]` and `[ Use Camera ]` (mobile only).
    3.  **Business Rules:**
        *   Accepted formats: JPEG, PNG.
        *   Max file size: 10MB.
        *   An error message will be shown for unsupported formats or sizes.
    4.  After selecting an image, it is displayed in an editing interface. A cropper tool is overlaid, allowing the user to drag and resize a box to select the main artwork area.
    5.  A `[ Confirm ]` button finalizes the crop and proceeds to the next step.

#### **4.1.2 User Story 1.2: As a user, I want to add a text prompt and select a mood so that I can guide the AI on how to animate my picture.**
*   **User Interface & Logic:**
    1.  A textarea is provided with placeholder text: "Describe the story in your art..."
    2.  Below the textarea, a section of "Prompt Ideas" displays clickable, pre-written templates (e.g., `A [character] is [action] in [place]`). Clicking a template populates the textarea, and the text remains fully editable.
    3.  A "Select Mood" section displays several iconic cards (e.g., `😊 Playful`, `💖 Heartwarming`, `웅 Epic`). The user must select one. This selection determines the background music.
    4.  **Business Rules:**
        *   Prompt has a character limit of 300.
        *   Mood selection is mandatory.

#### **4.1.3 User Story 1.3: As a user, I want to generate and view the final video, so I can see my creation come to life and decide what to do with it.**
*   **User Interface & Logic:**
    1.  A final `[ ✨ Create My Video ]` button is displayed.
    2.  Next to it, the cost is shown: `(Costs 60 Credits)`. The user's current balance is also visible if logged in.
    3.  **Pre-generation States:**
        *   **Logged-in User (Sufficient Credits):** Clicking the button starts the generation process.
        *   **Logged-in User (Insufficient Credits):** The button is disabled or clicking it shows a modal: "Not enough credits. Please recharge or complete tasks to earn more." with `[ Buy Credits ]` and `[ Earn Credits ]` buttons.
        *   **Unregistered User:** Clicking the button will first direct them to a quick Sign Up/Log In modal. The sign-up bonus of 150 credits should be highlighted.
    4.  **Generation State (Waiting Page):**
        *   The user is taken to a waiting page.
        *   A progress bar and dynamic text ("Summoning magic...", "Painting the pixels...") are shown.
        *   A carousel of curated public creations is displayed to keep the user engaged.
    5.  **Post-generation State (Result Page):**
        *   The generated video is displayed in a large player with autoplay.
        *   Standard video controls (play/pause, volume, fullscreen) are available.
        *   Three main action buttons are displayed below the video: `[ Download ]`, `[ Share ]`, `[ Create Again ]`.

### **4.2 Module 2: User Account & Economy**

#### **4.2.1 User Story 2.1: As a new user, I want to quickly sign up or log in so I can save my work and manage my credits.**
*   **User Interface & Logic:**
    1.  A `[ Login / Sign Up ]` button is in the global header.
    2.  The primary login methods will be social: `[ Continue with Google ]`, `[ Continue with Apple ]`.
    3.  Upon first-time successful authentication, a user record is created in the database.
    4.  **Business Rules:**
        *   New users automatically receive a sign-up bonus of 150 credits. A welcome notification should confirm this.

#### **4.2.2 User Story 2.2: As a user, I want to earn credits through activities so that I can create more videos.**
*   **User Interface & Logic:**
    1.  **Daily Check-in:** In the "Credits" or user profile section, a `[ Check-in for today ]` button is available.
        *   **Business Rules:** Awards 15 credits. Button is disabled after clicking, with a timer showing when it's available again.
    2.  **Referral System:** An "Invite Friends" page provides a unique referral link.
        *   **Business Rules (The Viral Loop):**
            *   When a new user (Friend) signs up using the link, the Friend gets 50 bonus credits (on top of the standard 150). The referrer (You) gets 30 credits.
            *   When the Friend successfully generates their first video, the referrer (You) gets an additional 70 credits.
            *   Notifications must be sent to the referrer upon successful referral and conversion.
    3.  **UGC Social Task:** The "Invite Friends" page will also feature a task section.
        *   **UI:** "Share your video on Instagram/TikTok with the hashtag **#draworldapp**. Our team will review it and award you 100 credits!"
        *   **Backend:** Requires a simple admin interface for the team to view posts with the hashtag and manually award credits to a specific user ID.

#### **4.2.3 User Story 2.3: As a user, I want to purchase credits when I run out so I can continue creating.**
*   **User Interface & Logic:**
    1.  A "Buy Credits" page displays available packages in card format.
    2.  Packages (USD):
        *   $1.99 for 100 Credits
        *   $9.99 for 550 Credits (50 bonus)
        *   $49.99 for 2900 Credits (400 bonus)
        *   $99.99 for 6000 Credits (1000 bonus)
    3.  Selecting a package proceeds to a payment modal.
    4.  **Business Rules:**
        *   Payment processing will be handled by Stripe API.
        *   Upon successful payment confirmation from the Stripe webhook, the user's credit balance is updated in the database.
        *   An email receipt should be sent to the user.

### **4.3 Module 3: Content Management**

#### **4.3.1 User Story 3.1: As a logged-in user, I want to have a personal gallery to view all my past creations.**
*   **User Interface & Logic:**
    1.  A "My Gallery" link is available in the user dropdown menu.
    2.  Creations are displayed in a responsive grid layout. Each item is a card showing the video thumbnail, the prompt used, and creation date.
    3.  Hovering over a card reveals a play icon. Clicking it opens the video in a modal player.
    4.  Each card also has a "..." menu with `Share` and `Delete` options.
    5.  **Empty State:** If the user has no creations, a friendly illustration and a message ("Your gallery is empty. Let's create some magic!") with a `[ Start Creating ]` button is displayed.

## **5. Boundary Conditions & Constraints**
1.  **Third-Party Dependencies:** The core functionality relies on the Runware AI API. API latency, cost, and terms of service are critical constraints.
2.  **Platform:** This PRD is for a responsive web application, designed to be functional on both desktop and mobile browsers (Chrome, Safari, Firefox latest versions).
3.  **Language:** All user-facing text must be in English.

## **6. Non-Functional Requirements**
*   **Performance:**
    *   Page load time should be under 3 seconds.
    *   Video generation time is dependent on the API, but the user must be kept informed on the waiting page. Target a maximum of 60 seconds for generation.
*   **Security:**
    *   Implement an automated pre-moderation check (e.g., using a content safety API) on all uploaded images to filter for inappropriate content.
    *   All user data must be handled securely and in compliance with GDPR/CCPA standards.
    *   Payment transactions must be securely processed via Stripe, with no sensitive card data stored on our servers.
*   **Usability:** The interface must be intuitive for non-technical parents. The core creation flow should require no more than 3-4 steps.

## **7. Data Metrics**
*   **Acquisition:** Track new user sign-ups by source (direct, referral, social media).
*   **Activation:** Funnel analysis for: `Visit -> Upload -> Set Prompt -> Click Generate`.
*   **Retention:** Daily Active Users (DAU), Next-day retention, Daily check-in rate.
*   **Revenue:** Total Revenue, Average Revenue Per User (ARPU), Purchase conversion rate.
*   **Referral:** K-factor, referral link clicks, successful referral sign-ups.

## **8. To Be Discussed / Future Considerations**
1.  **Copyright Policy:** The exact wording for the User Agreement regarding ownership of uploaded images vs. AI-generated videos needs legal review.
2.  **AI Model Specifics:** Which specific model version and parameters to use from the API for the best balance of quality and cost.
3.  **Watermarking:** Should MVP videos contain a subtle "Made with Draworld" watermark to aid branding and growth?
4.  **Child-Account Features:** The "Child Mode" (Direction B from our discussion) is a strong candidate for a future version to better protect creative freedom.

---

Appendix:

### **1. Lean Canvas - Draworld MVP**

```mermaid
graph TD
    subgraph A[" "]
        P[<b>Problem</b><br/>1. Children's physical drawings are hard to preserve & easily forgotten<br/>2. Static photos fail to capture the story and fun of the artwork<br/>3. Parents lack effective tools to inspire their children's creativity]
        S[<b>Solution</b><br/>A web application where users can upload children's art, and with AI image-to-video tech and smart music, generate lively, engaging short videos with one click.]
        M[<b>Key Metrics</b><br/>- Video Generation Success Rate<br/>- Day 1 User Retention<br/>- K-factor (Virality Coefficient)<br/>- Paid Conversion Rate]
        UVP[<b>Unique Value Proposition</b><br/><b>"Bring Every Child's Drawing to Life"</b><br/>Transform static children's art into lively, permanently archivable AI animated stories that spark infinite creativity.]
        U[<b>Unfair Advantage</b><br/>(Early Stage)<br/>- Rapid entry into a niche market, accumulating early user creations and word-of-mouth<br/>- Deep optimization and stylization capabilities based on a specific AI model]
        C[<b>Customer Segments</b><br/><b>Core Users:</b> Parents of 3-10 year-olds, especially mothers<br/><b>Early Adopters:</b> Young parents active on social media who enjoy sharing their children's moments]
        CH[<b>Channels</b><br/>- Social Media (Instagram, TikTok)<br/>- Parenting communities / KOLs<br/>- User word-of-mouth]
    end

    subgraph B[" "]
        CS[<b>Cost Structure</b><br/>- Third-party AI service API call fees (core cost)<br/>- Web server and bandwidth costs<br/>- Development and operational personnel costs]
        RS[<b>Revenue Streams</b><br/>- Credit package purchases (core)<br/>- (Future) Subscriptions, custom services, etc.]
    end

    P --> S
    S --> M
    UVP -- Defines --> S
    UVP -- Targets --> C
    C -- Reached via --> CH
    U -- Protects --> UVP
    CH -- Generates --> RS
    S -- Incurs --> CS
```
*   **Interpretation:** This canvas encapsulates our project's entire business landscape. It clearly outlines the problems we're solving, the customers we're serving, the value we're providing, and our cost and revenue structures, ensuring our business viability.

---
### **2. Core User Flowchart (Mermaid Code)**

```mermaid
graph TD
    A[User lands on Homepage] --> B{Is user logged in?};
    B -- No --> C[Prompt to Log In / Sign Up];
    B -- Yes --> D[Clicks "Start Creating"];
    C --> D;
    D --> E[Uploads drawing (Photo/Album)];
    E --> F[Simple crop of the artwork];
    F --> G[Fills in prompt & selects music mood];
    G --> H{Are credits sufficient?};
    H -- Yes --> I[Confirms & consumes credits];
    H -- No --> J[Prompt to top-up / earn credits];
    J --> G;
    I --> K[Enters generation waiting screen<br/>(Shows progress & other creations)];
    K --> L[Generation successful, enters result page];
    L --> M{Selects an action};
    M -- Save Video --> N[Downloads video file];
    M -- Share --> O[Generates share link/poster];
    M -- Regenerate --> G;
    N --> P[Flow ends];
    O --> P;
```
*   **Interpretation:** This flowchart depicts the core user journey from initial visit to value realization. It clearly illustrates key nodes like the credit check and top-up prompts, which form the commercialization loop. Developers can use this to understand the complete business logic.

---

### **3.The Complete Draworld Site Architecture & Element Checklist**

### **Revised Sitemap & Route Definitions**

| Category              | Route                                | Page Name                  | Purpose                                                                |
| --------------------- | ------------------------------------ | -------------------------- | ---------------------------------------------------------------------- |
| **Public & Marketing**  | `/`                                  | Homepage                   | Explain value proposition, build trust, and drive signups.             |
|                       | `/gallery`                           | Gallery                    | Showcase community creations, inspire new users.                       |
|                       | `/pricing`                           | Pricing                    | Display credit packages for purchase.                                  |
| **Authentication**      | `/signup`                            | Sign Up                    | New user account creation.                                             |
|                       | `/login`                             | Log In                     | Existing user authentication.                                          |
|                       | `/forgot-password`                   | Forgot Password            | Initiate the password reset process.                                   |
|                       | `/reset-password`                    | Reset Password             | Complete the password reset with a new password.                       |
| **Core Application**    | `/create`                            | Creation Hub               | The main multi-step flow for creating a video.                         |
|                       | `/creation/{id}/result`              | Creation Result            | The dedicated page to view a finished video.                           |
| **Account Management**  | `/account/creations`                 | My Creations               | View and manage all of the user's past creations.                      |
|                       | `/account/billing`                   | Billing & History          | **(NEW)** View order history and detailed credit transaction history.    |
|                       | `/account/referrals`                 | Referrals                  | Manage and track friend invitations.                                   |
|                       | `/account/profile`                   | Profile & Settings         | Manage personal information and password.                              |
| **System & Legal**      | `/terms-of-service`                  | Terms of Service           | Legal terms of using the service.                                      |
|                       | `/privacy-policy`                    | Privacy Policy             | Data privacy and usage policies.                                       |
|                       | `/404`                               | Page Not Found             | A user-friendly page for broken or incorrect links.                    |

---

### **Global Elements (Revised)**

*   **`Header (Logged-out State)`**
*   `Logo`: "Draworld" logo, clickable, links to `/`.
    *   `Navigation Links`:
        *   `Create`: Links to `/create`.
        *   `Gallery`: Links to `/gallery`.
        *   `Pricing`: Links to `/pricing`.
    *   `Action Buttons`:
        *   `Log In`: Secondary button style, links to `/login`.
        *   `Sign Up for Free`: Primary button style, links to `/signup`.
*   **`Header (Logged-in State)`**
    *   `Logo`: "Draworld".
    *   `Navigation Links`: `Create`, `Gallery`, `Pricing`.
    *   `User Menu`:
        *   `Credit Balance Display`: "Credits: 150 ✨", **clickable, links to `/account/billing`**. (This is the primary new entry point).
        *   `User Avatar / Initials`: Dropdown menu trigger.
        *   `Dropdown Menu`:
            *   `My Creations` (links to `/account/creations`)
            *   `Billing & History` **(NEW ENTRY POINT)** (links to `/account/billing`)
            *   `Invite Friends` (links to `/account/referrals`)
            *   `Profile Settings` (links to `/account/profile`)
            *   `Log Out`
*   **`Footer (Global)`**
    *   `Logo & Tagline`: "Draworld - Where imagination comes to life."
    *   `Column 1: Product`: `Create`, `Gallery`, `Pricing`, `Refer a Friend`.
    *   `Column 2: Company`: `About Us`, `Careers`, `Press`.
    *   `Column 3: Support`: `FAQ`, `Contact Us`, `Community Guidelines`.
    *   `Column 4: Legal`: `Terms of Service`, `Privacy Policy`.
    *   `Social Media Icons`: Links to Instagram, Pinterest, Facebook, TikTok.
    *   `Copyright Notice`: "© 2023 Draworld, Inc. All rights reserved."

---

### **Detailed Page Routes & Element Checklists**

#### **1. Route: `/` (Homepage)**
*   **Purpose:** Explain value proposition, build trust, and drive signups.
*   **Checklist:
    *   `Header`: Global Header (Logged-out).
    *   `Hero Section`:
        *   `Headline (H1)`: "Bring Your Child's Art to Life with AI."
        *   `Sub-headline`: "Turn any drawing into a magical animated video in seconds. Preserve their masterpieces forever."
        *   `Primary CTA Button`: "Create Your Masterpiece for Free". Links to `/create`.
        *   `Visual Element`: An auto-playing, muted video showcasing several before-and-after examples of drawings turning into vibrant animations.
    *   `Social Proof Bar`:
        *   `Text`: "Trusted by over 50,000 parents and creators".
        *   `Logos (optional)`: Fictional logos of parenting blogs or awards like "Parent's Choice Award".
    *   `How It Works Section`:
        *   `Section Title (H2)`: "Three Easy Steps to Magic".
        *   `Step 1`: Icon + `Upload a Drawing` + "Snap a photo or upload from your device."
        *   `Step 2`: Icon + `Add a Prompt` + "Describe the action, like 'A lion roaring on a mountain'."
        *   `Step 3`: Icon + `Generate & Share` + "Watch the magic unfold and share your animated story."
    *   `Featured Creations Section (Gallery Teaser)`:
        *   `Section Title (H2)`: "See What Young Artists Are Creating".
        *   `Video Carousel`: A horizontally scrolling carousel of 5-6 curated, high-quality user-generated videos. Each card is clickable and links to the `/gallery`.
        *   `Secondary CTA Button`: "Explore the Gallery".
    *   `Parent Testimonials Section`:
        *   `Section Title (H2)`: "Why Parents and Kids Love Draworld".
        *   `Testimonial Cards (3x)`: Each card contains a quote, a parent's name ("Sarah M., Mom of Two"), and a 5-star rating graphic.
    *   `Final CTA Section`:
        *   `Headline (H2)`: "Ready to Animate Their Imagination?"
        *   `Primary CTA Button`: "Sign Up and Start Creating".
    *   `Footer`: Global Footer.

#### **2. Routes: `/signup`, `/login`**
*   **Purpose:** User authentication.
*   **Checklist:
    *   `Form Container`: Centered on a clean page with the Draworld logo above.
    *   `Title (H1)`: "Create Your Account" or "Welcome Back".
    *   `Social Auth Buttons`: `Continue with Google`, `Continue with Apple`. (Primary method).
    *   `Divider`: "OR".
    *   `Email Input Field`: Placeholder "Enter your email".
    *   `Password Input Field`: Placeholder "Create a password". With show/hide toggle.
    *   `Primary Button`: "Sign Up with Email" or "Log In".
    *   `Helper Text`:
        *   On Signup: "By signing up, you agree to our `Terms of Service` and `Privacy Policy`." (Links included).
        *   On Login: `Forgot Password?` link (links to `/reset-password`).
    *   `Switch Form Link`: "Already have an account? `Log In`" or "Don't have an account? `Sign Up`".

#### **3. Route: `/forgot-password`**
*   **Purpose:** Initiate the password reset process.
*   **Checklist:**
    *   `Form Container`: Centered, with Draworld logo.
    *   `Title (H1)`: "Reset Your Password".
    *   `Instructional Text`: "Enter the email address associated with your account, and we'll send you a link to reset your password."
    *   `Email Input Field`.
    *   `Primary Button`: "Send Reset Link".
    *   `Confirmation State (After submit)`: A message replaces the form: "Check your inbox! We've sent a password reset link to your email address."
    *   `Back to Login Link`.

#### **4. Route: `/reset-password` (Requires a unique token in URL)**
*   **Purpose:** Complete the password reset.
*   **Checklist:**
    *   `Form Container`.
    *   `Title (H1)`: "Create a New Password".
    *   `Instructional Text`: "Your new password must be at least 8 characters long."
    *   `New Password Input Field`.
    *   `Confirm New Password Input Field`.
    *   `Primary Button`: "Set New Password".
    *   `Success State`: Message: "Your password has been updated successfully." with a `Log In` button.

#### **5. Route: `/create` (Core Funnel)**
*   **Purpose:** Guide the user through the video creation process.
*   **Checklist:
    *   `Header`: Global Header (Logged-in).
    *   `Wizard-style Interface (Multi-step)`:
        *   **Step 1: Upload Your Art**
            *   `Title`: "Step 1: Upload a Drawing".
            *   `Upload Box`: A large drag-and-drop area.
            *   `Primary Button`: "Upload from Computer".
            *   `Secondary Button`: "Take a Photo" (on mobile).
            *   `Image Preview`: Shows the thumbnail of the uploaded image.
            *   `Next Button`: `Crop & Continue ->`.
        *   **Step 2: Define the Magic**
            *   `Title`: "Step 2: Describe the Action".
            *   `Image Preview Pane`: Shows the cropped image on the left.
            *   `Form Pane (Right)`:
                *   `Prompt Textarea`: Placeholder "e.g., A happy sun rising over a green hill".
                *   `Prompt Template Buttons`: Clickable suggestions like `A [character] [action] in a [place]`. Clicking populates the textarea.
                *   `Mood Selector Title`: "Choose a musical mood:".
                *   `Radio Buttons`: `Joyful`, `Calm`, `Epic`, `Mysterious`.
                *   `Credit Cost Display`: "This will use **60 Credits**."
                *   `Credit Balance Display`: "Your balance: **150 Credits**."
                *   `Generate Button (Primary CTA)`: "✨ Generate Video".
                    *   `State: Insufficient Credits`: Button is disabled and says "Insufficient Credits". A link appears next to it: `Get More Credits`.
        *   **Step 3: Generating... (Modal/Page Overlay)**
            *   `Animation`: A fun animation (e.g., a crayon drawing a progress bar).
            *   `Text`: "Our AI is working its magic...", "Bringing your art to life...".
            *   `Progress Bar/Indicator`.
            *   `Featured Creations Carousel`: To keep the user engaged during the wait.
        *   **Step 4: Your Masterpiece is Ready!**
            *   `Title`: "It's Alive!".
            *   `Video Player`: Large, centered video player with play/pause/sound controls.
            *   `Action Buttons Below Player`:
                *   `Download`: Primary button.
                *   `Share`: Secondary button (opens a share modal).
                *   `Create Another`: Tertiary button (links back to step 1 of `/create`).
            *   `Share Modal`:
                *   `Copy Link` button.
                *   Direct share icons for Facebook, Pinterest, etc.

#### **6. Route: `/creation/{id}/result`**
*   **Purpose:** A shareable, dedicated page to view a finished video.
*   **Checklist:**
    *   `Header`: Global Header (Logged-in).
    *   `Title`: Can be auto-generated from the prompt, e.g., "An Animation of a Happy Sun...".
    *   `Video Player`: Large, centered video player.
    *   `Action Buttons`: `Download`, `Share`, `Create Another`.
    *   `Metadata`: "Created on [Date]", "Created by [User's Name]".

#### **7. Route: `/gallery` (NEWLY DETAILED)**
*   **Purpose:** Showcase community creations to inspire visitors and demonstrate the product's capabilities.
*   **Checklist:**
    *   `Header`: Global Header (State depends on user auth).
    *   `Page Title (H1)`: "The Draworld Gallery".
    *   `Sub-headline`: "A universe of imagination from young artists around the globe."
    *   `Filter & Sort Controls`:
        *   `Sort Dropdown`: Options like `Trending`, `Newest`, `Most Popular`.
        *   `Category Filters (Buttons/Tags)`: Pre-defined categories like `Animals`, `Fantasy`, `Nature`, `Vehicles`. (This implies a tagging feature during creation in a future version, but for MVP it can be manually curated).
    *   `Creations Grid`: An infinite-scrolling, masonry-style grid of public creation videos.
    *   `Video Card (in Grid)`:
        *   `Animated Thumbnail` (auto-plays on hover).
        *   `Title` (derived from prompt).
        *   `Creator Attribution`: "By a talented 7-year-old artist" (to maintain privacy).
        *   `Click Action`: Opens a modal for a larger view.
    *   `Video Lightbox (Modal View)`:
        *   `Large Video Player`.
        *   `Title` and `Creator Attribution`.
        *   `Share Button`: To share the link to this specific creation.
        *   `CTA Button`: "Create Your Own Animation".
    *   `Footer`: Global Footer.

#### **8. Route: `/pricing`**

*   **Purpose:** To clearly present the credit packages and convert users to paying customers.
*   **Checklist:**
    *   `Header`: Global Header.
    *   `Title (H1)`: "Choose Your Plan".
    *   `Sub-headline`: "Fuel your creativity. More credits mean more magic."
    *   `Pricing Tiers (Cards)`: Four cards, side-by-side.
        *   `Card 1`: `$1.99`, `100 Credits`.
        *   `Card 2`: `$9.99`, `550 Credits`, with a "Most Popular" banner.
        *   `Card 3`: `$49.99`, `2,900 Credits`.
        *   `Card 4`: `$99.99`, `6,000 Credits`.
        *   `Each Card Contains`: Price, Credit Amount, "Bonus" text (e.g., "Includes 50 bonus credits"), and a `Purchase` button.
	*   `Payment Modal`: Triggered by the `Purchase` button.
        *   `Order Summary`: "You are purchasing the [Package Name] for [Price]."
        *   `Payment Processor Integration`: Stripe or PayPal embedded form.
        *   `Secure Checkout Badges`: Graphics for SSL, security guarantees.
    *   `Value Proposition Section`:
        *   `Title (H2)`: "What You Can Do With Your Credits".
        *   `Feature List with Icons`: `Animate Drawings`, `Download HD Videos`, `Preserve Memories`, `Unlock Imagination`.
    *   `FAQ Section`:
        *   `Section Title (H2)`: "Frequently Asked Questions".
        *   `Accordion/Dropdowns`: For questions like "Do my credits expire?", "What payment methods do you accept?", "Can I get a refund?".

#### **9. Account Management Section (Unified Layout)**
*   *All `/account/*` routes share a common layout with a persistent sidebar for navigation.*
*   **`Account Layout Elements`**:
    *   `Header`: Global Header (Logged-in).
    *   `Page Title (H1)`: e.g., "My Creations", "Billing & History".
    *   `Account Navigation Sidebar (Left)`:
        *   `My Creations` (links to `/account/creations`)
        *   `Billing & History` (links to `/account/billing`)
        *   `Invite Friends` (links to `/account/referrals`)
        *   `Profile Settings` (links to `/account/profile`)
    *   `Main Content Area (Right)`: This area's content changes based on the route.

#### **10. Route: `/account/creations`**
*   **Purpose:** View and manage all past creations.
*   **Checklist:**
    *   `Account Layout`.
    *   `Main Content Area`:
	*   `Title (H1)`: "My Creations".
        *   `Creations Grid`: An infinite scroll grid of the user's past videos.
        *   `Video Card`:
            *   `Thumbnail` (animated GIF).
            *   `Creation Date`.
            *   `Hover State`: Shows `Play` and `Delete` icons.
        *   `Empty State`: If no creations, show a message: "Your gallery is empty. Let's make some magic!" with a `Create Now` button.

#### **11. Route: `/account/billing` (NEW & EXPANDED)**
*   **Purpose:** View order history and detailed credit transaction history.
*   **Checklist:**
    *   `Account Layout`.
    *   `Main Content Area`:
        *   `Title (H1)`: "Billing & History".
        *   `Current Balance Card`: A prominent display: "You have **150** Credits". With a `Get More Credits` button linking to `/pricing`.
        *   `Tabs`: `Order History`, `Credit History`.
        *   **`Order History Tab (Default View)`**:
            *   `Table Title`: "Order History".
            *   `Table Headers`: `Order ID`, `Date`, `Package`, `Amount`, `Status`, `Receipt`.
            *   `Table Rows`: Each row represents a purchase.
            *   `Receipt Column`: A "Download" link for a PDF invoice.
            *   `Empty State`: "You haven't made any purchases yet."
        *   **`Credit History Tab`**:
            *   `Table Title`: "Credit Transaction History".
            *   `Table Headers`: `Date`, `Description`, `Amount`, `Balance`.
            *   `Table Rows`: Each row is a transaction.
                *   *Example 1:* `Oct 27, 2023`, `Sign-up Bonus`, `+150`, `150`.
                *   *Example 2:* `Oct 28, 2023`, `Video Creation (ID: 12345)`, `-60`, `90`.
                *   *Example 3:* `Oct 28, 2023`, `Daily Check-in Bonus`, `+15`, `105`.
            *   `Empty State`: "No credit transactions yet."

#### **12. Route: `/account/referrals`**
*   **Purpose:** Enable and track the user referral program.
*   **Checklist:** *No changes. The previously defined list is complete.*
    *   `Account Layout`.
    *   `Main Content Area`: 
	*   `Title (H1)`: "Invite Friends, Earn Free Credits!".
        *   `Explanation Text`: "Share the magic of Draworld! For every friend who signs up, you get **30 credits**. When they create their first video, you get **70 more**! Your friend gets **50 bonus credits** to start."
        *   `Referral Link Box`:
            *   `Your unique link`: `draworld.com/invite?ref=USERID123`.
            *   `Copy Link` button.
        *   `Share Buttons`: Direct share to Email, Facebook, WhatsApp.
        *   `Referral Stats Section`:
            *   `Total Friends Joined`: Number.
            *   `Credits Earned`: Number.
        *   `Manual Reward Section`:
            *   `Title`: "Get Credits for Sharing on Social Media".
            *   `Instructions`: "Post your video on TikTok or Instagram with the hashtag #Draworld. We'll review and manually add credits to your account!"
            *   `Link Input Field (Optional)`: "Paste the link to your post here for faster review."
            *   `Submit Button`.

#### **13. Route: `/account/profile`**
*   **Purpose:** Manage personal information and password.
*   **Checklist:**
    *   `Account Layout`.
    *   `Main Content Area`:
        *   `Title (H1)`: "Profile Settings".
        *   `Profile Information Section`:
            *   `Label`: `Display Name`. `Input Field` with user's name.
            *   `Label`: `Email Address`. `Text` showing the user's email (not editable, with a note "Contact support to change your email").
        *   `Change Password Section`:
            *   `Current Password Input Field`.
            *   `New Password Input Field`.
            *   `Confirm New Password Input Field`.
        *   `Primary Button`: `Save Changes`.

#### **14. Route: `/404` (Page Not Found)**
*   **Purpose:** A user-friendly page for broken links.
*   **Checklist:**
    *   `Header`: Global Header.
    *   `Illustration`: A cute, on-brand illustration (e.g., a lost crayon).
    *   `Title (H1)`: "404 - Page Not Found".
    *   `Helper Text`: "Oops! It looks like this page doesn't exist."
    *   `Primary Button`: `Go to Homepage`.
    *   `Footer`: Global Footer.