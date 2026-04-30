#!/usr/bin/env python3
"""
Creditmaxxing User-Focused Knowledge Base Seeder
Loads user-facing help documentation into the LLM knowledge base
for the website AI assistant.
"""

import requests
import json
from typing import List, Dict

LLM_URL = "http://localhost:8000"

def add_knowledge_item(item: Dict) -> bool:
    """Add a knowledge item to the LLM service"""
    try:
        response = requests.post(f"{LLM_URL}/kb/items", json=item)
        if response.status_code == 200:
            print(f"✓ Added: {item['id']}")
            return True
        else:
            print(f"✗ Failed: {item['id']} - {response.text}")
            return False
    except Exception as e:
        print(f"✗ Error adding {item['id']}: {e}")
        return False


def seed_knowledge_base():
    """Seed the knowledge base with user-focused Creditmaxxing help content"""
    
    knowledge_items: List[Dict] = [
        # ==================== SYSTEM PROMPT ====================
        {
            "id": "system_prompt",
            "title": "System Prompt - Creditmaxxing Support Agent",
            "category": "system",
            "tags": ["system", "prompt", "rules"],
            "content": """You are a friendly and helpful support agent for Creditmaxxing, a credit card rewards tracking app. Your job is to help users learn how to use the app to track their credit cards, rewards, and benefits.

IMPORTANT RULES:
1. ONLY provide information from the knowledge base - do NOT infer or make up features
2. Explain everything in simple, user-friendly language focused on HOW TO USE the app
3. If asked about something not in your knowledge base, say: "I'm not sure about that. Please contact support at mlaykg@umsystem.edu"
4. Be friendly, helpful, and clear
5. When explaining tasks, use step-by-step instructions
6. Focus on what users can DO in the app, not technical details
7. Never give financial advice or investment recommendations
8. For account/security issues, always suggest contacting support

Your knowledge base has:
- How to add and manage credit cards
- How to log transactions and import from spreadsheets
- How rewards, benefits, and promotions work
- Where to find features in the app
- Troubleshooting common issues
- Getting started guide"""
        },

        # ==================== GREETING ====================
        {
            "id": "greeting",
            "title": "Greeting Users",
            "category": "system",
            "tags": ["greeting", "hello", "welcome", "hi", "hey", "start"],
            "content": """When a user greets you with any greeting like "Hi", "Hello", "Hey", "What's up", "Good morning", etc., respond warmly and friendly.

GREETING RESPONSE TEMPLATE:

👋 Hello! Welcome to the Creditmaxxing support assistant!

I'm here to help you get the most out of your credit card rewards tracking app. 

**What can I help you with today?**

- Adding a credit card?
- Logging transactions?
- Understanding your rewards?
- Tracking benefits and statement credits?
- Managing promotions and spending challenges?
- Troubleshooting issues?
- Or something else?

Just let me know what you need, and I'll guide you through it step by step!

---

KEY POINTS:
- Always sound friendly and welcoming
- Make it clear you're here to help
- Offer specific examples of what you can help with
- Invite them to ask their question
- Keep it concise and easy to read
- Use emojis sparingly but warmly
- Don't be overly formal - be conversational"""
        },

        # ==================== GETTING STARTED ====================
        {
            "id": "getting_started",
            "title": "Getting Started with Creditmaxxing",
            "category": "user_guide",
            "tags": ["getting_started", "onboarding", "setup", "beginner"],
            "content": """Welcome to Creditmaxxing! Here's what you can do:

**1. Create an Account**
- Sign up with your email and password
- Verify your email
- Fill in your profile (first name, last name, date of birth)

**2. Add Your Credit Cards**
- Go to the **Cards** page
- Click **+ Add Card**
- Select your card from our catalog
- Enter your card details (name, last 4 digits, expiration date, etc.)
- Done! Your card is now being tracked

**3. Log Your Transactions**
- Go to **Transactions**
- Click **+ Log Transaction** to add purchases one at a time
- OR click **Import Transactions** to upload a spreadsheet of many transactions at once

**4. See Your Rewards**
- Go to **Rewards** to see how much you're earning
- Creditmaxxing automatically calculates rewards based on what you spend

**5. Track Your Benefits**
- Go to **Benefits** to see statement credits
- Log when you use a benefit so you don't forget
- Check weekly to make sure you don't lose unused benefits!

**6. Monitor Your Promotions**
- Go to **Promotions** to track spending challenges
- See your progress toward welcome bonuses and other offers

**7. Check Your Dashboard**
- Go to **Dashboard** to see which of YOUR cards earns the most for each spending type
- This helps you choose the best card for every purchase

The app shows you everything you're earning and helps you maximize the value of every card!"""
        },

        # ==================== HOW TO ADD A CARD ====================
        {
            "id": "add_card",
            "title": "How to Add a Credit Card",
            "category": "user_guide",
            "tags": ["cards", "add", "setup", "getting_started"],
            "content": """Here's how to add a card to Creditmaxxing:

**Step 1: Go to the Cards Page**
- Click **Cards** in the main menu
- Click the **+ Add Card** button

**Step 2: Select Your Card**
- Search for your card from our catalog
- We support popular cards from Chase, Amex, Citi, Discover, Bank of America, and many others
- Click to select your card
- You'll see a preview of the card's rewards rates and benefits

**Step 3: Enter Card Details**
- **Card Nickname** (optional): Give it a name like "My Travel Card" so you remember which is which
- **Name on Card**: The name printed on your card (must match your card)
- **Last 4 Digits**: The last 4 digits of your card number
- **Expiration Date**: When your card expires (MM/YY)
- **Card Open Date**: When you got this card (affects when benefits reset and annual fees are due)
- **Statement Closing Date**: The day your bill closes each month (1-31) - this controls when benefits reset
- **Credit Limit** (optional): Your card's credit limit (for informational purposes)

**Step 4: Add Initial State (Optional)**
If you already have rewards or have used benefits:
- **Current Rewards Balance**: Points/miles/cash back you already have
- **Benefits Already Used This Cycle**: How much of your credits you've already used
- **Active Promotions**: Spending challenges you're working on - enter how much you've already spent toward them

This helps catch you up so your tracking is accurate from day one!

**Step 5: Click Add Card**
- Your card is added and ready to track!
- You'll see it on the Cards page
- Start logging transactions to see your rewards grow!

**Card Name Tips:**
- Use specific names so you remember which card is which
- Good examples: "My Travel Card", "Daily Driver", "Groceries Card", "Chase Sapphire"
- Short names make it easier to select from dropdowns when logging transactions"""
        },

        # ==================== HOW TO LOG TRANSACTIONS ====================
        {
            "id": "log_transactions",
            "title": "How to Log Transactions",
            "category": "user_guide",
            "tags": ["transactions", "logging", "import", "bulk_import"],
            "content": """You can add transactions in two ways:

**OPTION 1: Log One Transaction at a Time**

1. Go to **Transactions** page
2. Click **+ Log Transaction** button
3. Fill in these fields:
   - **Card Used**: Which card did you use? (dropdown)
   - **Date**: When did you make this purchase? (date picker, defaults to today)
   - **Merchant Name**: Where did you shop? (e.g., "Starbucks", "Target", "United Airlines")
   - **Merchant Category**: What type of purchase? (Dining, Groceries, Gas, Travel, Online Shopping, etc.)
   - **Amount**: How much? (in dollars)
   - **Notes** (optional): Any details you want to remember
4. Click **Save Transaction**
5. Rewards calculate automatically! ✓

**Tips for Better Tracking:**
- Use exact merchant names (e.g., "Starbucks" not "coffee shop")
- Pick the right category for more accurate tracking
- Add notes for your own reference (e.g., "Work lunch", "Birthday dinner")
- The more transactions you log, the more accurate your rewards picture

---

**OPTION 2: Bulk Import (Upload Many at Once)**

Great for uploading transactions from your bank statement all at once.

**Steps:**
1. Go to **Transactions** page
2. Click **Import Transactions** button
3. Select which card these transactions belong to
4. Drag and drop your file OR click to browse
5. Review the preview - Creditmaxxing highlights any problems
6. Fix any issues (invalid dates, missing merchants, etc.)
7. Click **Import** - all added at once!

**File Format Requirements**

Your CSV or Excel file should have these columns:
- `transaction_date` - Date of transaction (YYYY-MM-DD or MM/DD/YYYY)
- `merchant_name` - Where you spent money (e.g., "Starbucks", "Target")
- `mcc` - 4-digit merchant category code (Creditmaxxing can help you find this)
- `amount` - How much (numbers only, no $ sign)
- `notes` - (optional) Any notes

**Example CSV:**
```
transaction_date,merchant_name,mcc,amount,notes
2024-04-15,Starbucks,5814,6.50,
2024-04-16,Target,5411,45.23,groceries
2024-04-17,United Airlines,4511,320.00,flight to NYC
```

**Date Formats Accepted:**
- 2024-04-15 (YYYY-MM-DD)
- 04/15/2024 (MM/DD/YYYY)
- Both work!

**How to Find MCC Codes:**
- Your bank/credit card statement usually has them
- Common codes: 5814 (Dining), 5411 (Groceries), 4111 (Taxi), 4511 (Airlines)
- Creditmaxxing can sometimes auto-fill based on merchant name
- Download a template from the Import page to see examples

**Pro Tips:**
- Download the CSV template from the Import page as a starting point
- Import transactions from your last 3-6 months to get a good picture
- Import once per month going forward for ongoing tracking
- The more data you import, the better our system understands your spending"""
        },

        # ==================== UNDERSTANDING REWARDS ====================
        {
            "id": "rewards_explained",
            "title": "Understanding Your Rewards",
            "category": "user_guide",
            "tags": ["rewards", "points", "cashback", "miles", "how_rewards_work"],
            "content": """**What Are Rewards?**

Rewards are benefits your credit card gives you for using it. They're essentially money back or discounts on your purchases.

**Types of Rewards:**

1. **Points**: Premium cards earn points on purchases
   - Example: Chase Sapphire earns 3x points on dining
   - Meaning: For every $1 you spend on dining, you get 3 points
   - You collect points and can redeem them later

2. **Miles**: Travel cards earn miles
   - Example: United card earns 2x miles on airline tickets
   - Meaning: For every $1 you spend on airlines, you get 2 miles
   - Use miles to book free flights and travel

3. **Cash Back**: Direct money back to your account
   - Example: 1.5x cash back on everything
   - Meaning: For every $1 you spend, you get $0.015 back
   - Typically appears as a credit on your statement automatically

**How Creditmaxxing Calculates Rewards**

Each card has different reward rates. When you log a transaction:

**Rewards Earned = Amount Spent × Card's Reward Rate**

Example:
- You spend $50 at a restaurant
- You used Chase Sapphire (3x points on dining)
- Calculation: 50 × 3 = 150 points earned
- Those 150 points are added to your rewards balance

**What You Can See in Creditmaxxing**

Go to the **Rewards** page to see:
- **Total Rewards Earned**: Sum across all your cards (converted to dollar value)
- **Rewards This Month**: How much you earned this calendar month
- **Rewards by Card**: Points/miles/cash back on each individual card
- **Dollar Value**: What your rewards are worth in dollars
- **Redemption Log**: When you've cashed in points/miles

**Finding Your Best Reward Rate**

On the **Dashboard**, you'll see "Best Card by Category":
- Dining - which card earns most?
- Groceries - which card earns most?
- Gas - which card earns most?
- Travel - which card earns most?
- And more...

**Pro Tip:** Use the card with the highest reward rate for each type of purchase!
- Going to a restaurant? Use your dining card
- Buying groceries? Use your groceries card
- This way you maximize every dollar

**Why Your Card Earns Different Rates**

Credit cards offer different reward rates based on:
- What category you're spending in (dining vs. groceries)
- The merchant (some cards have specific partner bonuses)
- Sometimes the card's base rate (if nothing else matches)

**Important Notes:**
- Rewards are calculated when you log/import a transaction
- They're stored permanently - they never change
- You accumulate them over time
- Most rewards don't expire as long as your account is open
- Different cards have different values per point/mile"""
        },

        # ==================== UNDERSTANDING BENEFITS ====================
        {
            "id": "benefits_credits",
            "title": "What Are Benefits & Statement Credits?",
            "category": "user_guide",
            "tags": ["benefits", "credits", "statement_credits", "perks"],
            "content": """**What Are Benefits?**

Benefits are free perks that come with premium credit cards. They're essentially credits or discounts you get just by holding the card.

**Common Examples:**

- **$15/month Uber Cash** (Amex Gold)
  - Use at Uber or Uber Eats
  - Resets every month
  - Worth ~$180/year if you use it

- **$200 annual travel credit** (Chase Sapphire)
  - Use on flights, hotels, rental cars, or travel booking sites
  - Resets once per year

- **$60 airline fee credit** (various airlines cards)
  - Get reimbursed for airline baggage fees or seat upgrades
  - Usually resets annually

- **TSA PreCheck reimbursement** (multiple premium cards)
  - Get the $78-$100 fee back when you apply
  - Resets every 5 years

- **Streaming service credits**
  - Free Netflix, Hulu, Spotify, or Apple TV
  - Usually monthly or annual

- **Airport lounge access**
  - Free drinks, snacks, and seating in airport lounges
  - Covered by the card

- **Purchase protection & travel insurance**
  - Protection against fraud, theft, or damage
  - Trip cancellation insurance

**How Benefits Work**

1. Your card comes with specific benefits
2. Each benefit has an allotted amount per cycle (monthly, annual, etc.)
3. You log when you use them
4. You can see how much you have left
5. They reset at their scheduled time

**Example Timeline:**
- Jan 1: Your card gives you $15 Uber Cash (resets monthly)
- You use $10 on Jan 15
- You have $5 remaining for the rest of January
- Feb 1: Balance resets to $15 again (new cycle)

**How to Track Benefits in Creditmaxxing**

1. Go to **Benefits** page
2. See all benefits from all your cards
3. For each benefit, you'll see:
   - **Allotted**: Credit amount (e.g., "$15")
   - **Used**: How much you've spent
   - **Remaining**: How much left (progress bar)
   - **Reset Date**: When it refreshes

**How to Log Benefit Usage**

1. Find the benefit you used
2. Click **Log Usage** button
3. Enter:
   - **Amount**: How much did you spend?
   - **Date**: When did you use it?
   - **Merchant** (optional): Where did you use it?
   - **Notes** (optional): Any details
4. Click **Save**

**⚠️ BENEFITS EXPIRE - DON'T LOSE MONEY!**

**Benefits expire!** If you don't use your $15 Uber Cash by month end, you lose it. That's real money down the drain!

**Creditmaxxing Help:**
- Benefits expiring in less than 7 days are highlighted in RED
- Alerts appear on your Dashboard
- Check your Benefits page weekly
- Never lose another credit by accident!

**Pro Tips:**
- Check your Benefits page every week
- Plan ahead - if you have $30 Uber Cash expiring, use it!
- Link your cards to your favorite merchants to remember to use benefits
- Some benefits are automatic (like airline fee reimbursement)
- Others require you to manually log them (like Uber Cash)

**Annual Fees & Benefits**

Some high-end cards charge annual fees ($95-$550+), but they often come with valuable benefits:
- Annual fee: -$95
- Benefits value: +$180 (Uber) + $200 (travel credit)
- Your net value: +$285!

Creditmaxxing calculates this for you on each card's Net Value."""
        },

        # ==================== PROMOTIONS TRACKING ====================
        {
            "id": "promotions_tracking",
            "title": "Tracking Promotions & Spending Challenges",
            "category": "user_guide",
            "tags": ["promotions", "spending_challenges", "goals", "welcome_bonus"],
            "content": """**What Are Promotions?**

Promotions are temporary spending challenges and welcome bonuses that credit card issuers offer. They're incentives to use your card.

**Common Examples:**

1. **Welcome Bonus** (most common)
   - "Spend $4,000 in first 3 months, earn $200 cash back"
   - Or: "Spend $5,000 in 3 months, earn 50,000 points (~$750)"
   - This is the biggest reward for new cards!

2. **Spending Challenge**
   - "Earn 5x points on groceries this quarter"
   - "Spend $500 on dining in April, earn $50"

3. **Category Bonus**
   - "2x points on restaurants until end of year"
   - Limited-time boost to a specific category

4. **Seasonal Offer**
   - "Bonus miles during summer travel season"

**Why Promotions Matter**

- Welcome bonuses can be worth $100-$1,000+
- Easy money if you meet the spending requirement
- Great way to maximize new cards

**How to Track Promotions in Creditmaxxing**

1. Go to **Promotions** page
2. See all active spending challenges
3. For each promotion, you'll see:
   - **Spending Goal**: Amount you need to spend (e.g., $4,000)
   - **Your Progress**: How much you've spent so far
   - **Progress Bar**: Visual showing your progress
   - **Days Left**: Countdown to the deadline
   - **Reward**: What you earn when you hit the goal
   - **Status**: On Track, At Risk, or Completed

**Status Meanings:**

- **Active**: You're working on it, on track to complete
- **On Track** (Green): Everything is good, you'll finish
- **At Risk** (Red): You're falling behind, need to spend more
- **Completed**: You hit the goal! Reward earned
- **Expired**: Deadline passed without completing it

**How to Add a Promotion**

1. Click **+ Enroll in Promotion** button
2. Select your card
3. Choose a promotion
4. Enter start date
5. If you've already spent toward it, enter that amount
6. Click **Save**

**Understanding "At Risk"**

Creditmaxxing calculates if you can realistically hit your target:
- If you need to spend $100/day to meet the goal (unrealistic)
- If the math shows it's impossible to finish in time
- You'll see "At Risk" in red

This helps you know early if a promotion is in trouble!

**Pro Tips:**

1. **Check promotions when you get a new card**
   - Add them to Creditmaxxing so you don't forget
   
2. **Review your Dashboard for deadlines**
   - Creditmaxxing alerts you when promotions are expiring
   
3. **Strategic spending**
   - Plan your spending around promotion deadlines
   - "I need $2,000 more by March 31"
   
4. **Track multiple cards**
   - Use this to keep all your welcome bonuses in one place
   
5. **Don't miss bonuses**
   - Easy $200+ in free money - just keep track!

**Example: Meeting a Welcome Bonus**

Card: Chase Sapphire
Promotion: Spend $4,000 in first 3 months, earn $200

- Month 1: You spend $1,200 (30% complete)
- Month 2: You spend $1,800 (75% complete)
- Month 3: You need to spend $1,000 more (deadline approaching!)
- Before deadline: You spend another $1,500 ✓
- Result: You hit $4,500 total, earn $200!

Creditmaxxing tracks all this for you!"""
        },

        # ==================== PAGES OVERVIEW ====================
        {
            "id": "page_overview",
            "title": "Main Pages & Features",
            "category": "user_guide",
            "tags": ["pages", "features", "navigation", "menu"],
            "content": """**Here's what you'll find on each main page:**

**Dashboard** (Home)
- Your summary stats: Total cards, total rewards, total benefits, net value
- "Best Card by Category" table showing which card earns most for each spending type
- Alerts for expiring benefits and approaching promotion deadlines
- Recent transactions

**Cards**
- All your linked credit cards displayed as tiles
- Click any card to see details: net value, rewards, benefits, promotions
- Edit or delete cards
- Add new cards with multi-step wizard

**Transactions**
- View all your spending across all cards
- Filter by card, category, date range
- Log new transactions one at a time
- Bulk import from CSV/Excel spreadsheet
- Edit transactions (date and notes only)
- Delete transactions

**Rewards**
- Your complete rewards picture
- Total earned, earned this month, redeemed this year
- Rewards balance for each card (in points/miles and dollar value)
- Chart showing earnings over time
- Log redemptions (points/miles only)
- Redemption history

**Benefits**
- All benefits from all your cards in one place
- See what you have, what you've used, what's remaining
- Visual alerts for benefits expiring in less than 7 days
- Log benefit usage
- Track usage history

**Promotions**
- All your spending challenges and welcome bonuses
- Track progress toward goals
- See days remaining and status (On Track, At Risk, Completed, Expired)
- Add new promotions
- Remove promotions if you change your mind

**Settings**
- Update your profile (name, email, date of birth)
- Change your password
- Notification preferences
- Delete your account (if needed)
- Quick view of all your linked cards

**Help** (where this AI assistant lives!)
- Ask questions about how to use the app
- FAQ section
- Contact support form
- Email support: mlaykg@umsystem.edu

---

**Quick Navigation Tips:**

- Use the top menu to jump between pages
- Clickable cards take you to details
- Breadcrumbs show where you are
- Mobile-friendly design works on phone too
- Search functionality helps find transactions quickly"""
        },

        # ==================== TROUBLESHOOTING ====================
        {
            "id": "troubleshooting",
            "title": "Troubleshooting & Common Issues",
            "category": "user_guide",
            "tags": ["help", "troubleshooting", "issues", "faq", "problems"],
            "content": """**"My card isn't showing up"**
- Make sure you completed all the add card steps
- Try refreshing the page (F5 or Ctrl+R)
- Check that you're logged in to the right account
- Still not there? Contact support at mlaykg@umsystem.edu

**"Rewards aren't calculating"**
- Make sure you've logged transactions on that card
- Check the Rewards page - it shows all earned rewards
- Rewards calculate automatically when you log a transaction
- Try refreshing to see latest data

**"I can't find a benefit"**
- Go to the card's detail page (click the card on Cards page)
- Scroll down to the Benefits section
- Benefits are tied to specific cards, not shared
- If you don't see it, the card might not have that benefit

**"Import file isn't working"**
- Check the file columns: transaction_date, merchant_name, mcc, amount, notes
- Make sure dates are: YYYY-MM-DD or MM/DD/YYYY
- Check that amounts are numbers only (no $ signs)
- MCC must be 4-digit codes (no dashes)
- Download the template from Import page and use that format

**"A benefit expired"**
- Unfortunately, once a benefit's reset date passes, the credit is gone
- You can't recover it
- Tip: Check your Benefits page weekly to catch expiring benefits in time
- Creditmaxxing highlights benefits expiring in less than 7 days - watch for the red alert!

**"I see the wrong reward rate"**
- Card rewards vary by merchant, category, and sometimes portal
- Check the card's detail page to see the exact rates
- Some rates only apply to specific merchants
- Is the transaction in the right category?

**"Can I edit my transactions?"**
- You can only edit the Date and Notes fields
- To change merchant, category, or amount: Delete and re-create it
- This is because rewards are calculated when you log the transaction
- Rewards never change once calculated

**"Can I delete a transaction?"**
- Yes, click the delete icon on the Transactions page
- Confirm the deletion
- The transaction and its rewards are removed
- Any benefit usage linked to that transaction is also removed
- This is permanent!

**"I'm getting error messages"**
- Try logging out and back in
- Clear your browser cache (Ctrl+Shift+Delete)
- Try a different browser or incognito mode
- If it continues, contact support at mlaykg@umsystem.edu

**"I can't log in"**
- Check that you're using the correct email
- Try "Forgot Password" to reset your password
- Make sure Caps Lock is off
- Try a different browser
- Still stuck? Contact support at mlaykg@umsystem.edu

**"My rewards seem wrong"**
- Double-check transaction details (amount, category, card)
- Review the card's reward structure on the card detail page
- Some merchants have special rates or exclusions
- If something looks off, contact support at mlaykg@umsystem.edu

**"Where's my redemption?"**
- Go to Rewards page and check Redemption Log at the bottom
- Redemptions only show for points/miles, not cash back
- Cash back automatically applies to your statement
- If your log is empty, you haven't logged any redemptions yet

**Still need help?**
- Use this AI assistant to ask questions
- Go to the Help page and contact support
- Email: mlaykg@umsystem.edu
- Be as specific as possible when describing the issue"""
        },

        # ==================== ACCOUNT & SECURITY ====================
        {
            "id": "account_security",
            "title": "Account & Security",
            "category": "user_guide",
            "tags": ["account", "security", "password", "login", "privacy"],
            "content": """**Account Information**

**Creating Your Account:**
- Email address
- Strong password (use a mix of uppercase, lowercase, numbers, symbols)
- First name
- Last name
- Date of birth (for verification and security purposes)

**Logging In:**
- Use your email and password
- You'll be taken to your Dashboard after login
- Your session stays active as long as you're using the app
- Close the app or click "Log Out" to end your session

**Password Reset:**
1. On the login page, click "Forgot Password"
2. Enter your email address
3. Check your email for a reset link
4. Click the link and enter your new password
5. Log in with your new password

**Changing Your Password:**
1. Go to Settings page
2. Scroll to "Change Your Password" section
3. Enter your current password
4. Enter your new password (twice to confirm)
5. Click "Update Password"
6. You're all set!

---

**Security & Privacy**

**Your Data is Private:**
- Your data is only visible to you
- Supabase row-level security ensures only you can access your information
- We use industry-standard encryption
- Credit card numbers are NOT stored - only last 4 digits

**Two-Factor Authentication:**
- Currently available through Supabase Auth
- Adds an extra layer of security
- Contact support if you want to enable it

**Session Security:**
- Your session expires after a period of inactivity
- Log out on shared computers
- Never share your login credentials
- Don't type your password on public WiFi without VPN

**Notification Preferences:**
- Control what notifications you receive
- Go to Settings → Notification Preferences
- Choose which alerts you want to see
- Email delivery available for some notifications

---

**Deleting Your Account**

**What Happens When You Delete:**
1. Your account is permanently deleted
2. All your data is removed (cards, transactions, rewards, benefits, promotions)
3. This cannot be undone
4. You'll receive a confirmation email

**How to Delete:**
1. Go to Settings page
2. Scroll to "Danger Zone" at the bottom
3. Click "Delete Account"
4. You'll be asked to type your email to confirm
5. Click "Delete" to permanently remove everything

**Before You Delete:**
- Make sure this is what you want - it's permanent
- You won't be able to recover any data
- If you just want a break, you can log out instead
- Contact support if you have questions: mlaykg@umsystem.edu

---

**Privacy & Data**

**What Data We Collect:**
- Login credentials (email, password hashed)
- Profile information (name, date of birth)
- Card information (last 4 digits, expiration, nickname)
- Transactions (merchant name, amount, category, date)
- Rewards and benefits tracking
- Promotion progress

**What We Don't Collect:**
- Full credit card numbers (only last 4 digits)
- Full SSN or sensitive ID numbers
- Biometric data
- Payment information (we never process payments)

**How Your Data is Used:**
- To calculate your rewards and benefits
- To track your spending categories
- To show you personalized insights
- To power the AI assistant
- To provide customer support

**Data Security:**
- Encrypted in transit (HTTPS)
- Encrypted at rest in Supabase
- Regular security updates
- No third-party access without permission

**Questions About Privacy?**
- Contact support at mlaykg@umsystem.edu
- Review our Privacy Policy (link in footer)
- Review our Terms of Service (link in footer)"""
        },

        # ==================== GETTING HELP ====================
        {
            "id": "getting_help",
            "title": "Getting Help",
            "category": "user_guide",
            "tags": ["help", "support", "contact", "faq", "assistance"],
            "content": """**How to Get Help**

**1. This AI Assistant (Right Now!)**

You can ask me questions like:
- "How do I add a card?"
- "What are rewards?"
- "How do I log transactions?"
- "Where do I find my benefits?"
- "How do promotions work?"
- "I can't import my file - help!"
- "Is my card showing the right rewards?"

I'll give you step-by-step help for using the app.

**Things I Can Help With:**
- How to use features in the app
- Step-by-step guides for tasks
- Explanation of rewards, benefits, and promotions
- Troubleshooting common issues
- Tips and best practices
- Navigating the website

**Things I CANNOT Help With:**
- Technical account access (password resets, locked accounts)
- Billing or payment issues
- Data recovery after deletion
- Financial advice or investment recommendations
- Privacy concerns or data requests
- Bug reports or feature requests

For those, contact support directly.

---

**2. Contact Support**

For issues I can't help with:

1. Go to the **Help** page
2. Scroll to "Contact Support" section
3. Fill out the form with:
   - Your name
   - Your email
   - Type: Bug Report, Feature Request, or Question
   - Detailed description of your issue
4. Click **Submit**

**Support Email:** mlaykg@umsystem.edu

**What to Include in Your Message:**
- What were you trying to do?
- What happened instead?
- What did you expect to happen?
- Any error messages?
- What browser and device are you using?
- The more detail, the faster we can help!

**Response Time:**
- We aim to respond within 1-2 business days
- For urgent issues, describe it as urgent in your message

---

**3. Common Issues & Quick Fixes**

**Problem: Card not showing up**
- Complete all the add card steps
- Make sure you clicked "Add Card" at the end
- Try refreshing the page (F5)
- Still missing? Contact support

**Problem: Rewards not calculating**
- Log a transaction on that card
- Check the Rewards page to see totals
- Refresh the page to see latest data

**Problem: Can't find a benefit**
- Go to your card's detail page
- Benefits are card-specific
- Check that card has that benefit in the catalog

**Problem: Import file not working**
- Check columns: transaction_date, merchant_name, mcc, amount, notes
- Dates: YYYY-MM-DD or MM/DD/YYYY format
- Amounts: numbers only (no $ signs)
- MCC: 4-digit codes only
- Download the template as a guide

**Problem: Benefit expired**
- Unfortunately, once reset date passes, credit is lost
- Check Benefits page weekly to catch expiring ones
- Creditmaxxing alerts you when benefits expire in <7 days

**Problem: Password forgotten**
- Go to login page
- Click "Forgot Password"
- Enter your email
- Check email for reset link
- Follow link to set new password

**Problem: Getting error messages**
- Try logging out and back in
- Clear browser cache (Ctrl+Shift+Delete)
- Try a different browser or incognito mode
- Still seeing errors? Contact support

---

**4. FAQ (Frequently Asked Questions)**

**Q: Is my data secure?**
A: Yes! We use Supabase with encryption and row-level security. Only you can access your data.

**Q: Do you store my full card number?**
A: No. We only store the last 4 digits. Never the full number.

**Q: What happens if I delete a transaction?**
A: It's permanently removed. The rewards and linked benefits are also removed. You can't undo it.

**Q: Can I edit my transactions?**
A: Only date and notes. To change other fields, delete and re-create.

**Q: Do my rewards ever expire?**
A: Rewards don't expire as long as you keep the account open. But benefits DO expire!

**Q: Can I see rewards from before I added the card?**
A: No. We track from the date you added the card forward. You can manually enter initial rewards during setup.

**Q: What if I have multiple of the same card?**
A: Add each one separately with a different nickname (e.g., "Chase Sapphire #1" and "Chase Sapphire #2").

**Q: Does the app work on mobile?**
A: Yes! It's mobile-friendly and works on phones and tablets.

**Q: Can I export my data?**
A: You can export transactions as CSV on the Transactions page. Contact support for full data export.

**Q: Is Creditmaxxing affiliated with credit card issuers?**
A: No. We're an independent tracking tool. We're not endorsed by or affiliated with any credit card company.

---

**Still Have Questions?**

- Ask this AI assistant - ask away!
- Use the Help page to contact support
- Email: mlaykg@umsystem.edu
- We're here to help make your life easier!"""
        },

        # ==================== MOBILE & ACCESSIBILITY ====================
        {
            "id": "mobile_accessibility",
            "title": "Mobile, Accessibility & Device Support",
            "category": "user_guide",
            "tags": ["mobile", "accessibility", "responsive", "browser", "devices"],
            "content": """**Mobile Support**

**Creditmaxxing Works On:**
- Desktop computers (Windows, Mac, Linux)
- Tablets (iPad, Android tablets)
- Smartphones (iPhone, Android phones)
- Any modern web browser

**Mobile Features:**
- Full functionality on mobile devices
- Touch-friendly buttons and menus
- Responsive design that adapts to screen size
- Works in portrait and landscape mode
- Can be bookmarked for quick access

**Mobile Tips:**
- Use landscape mode for tables with lots of data
- Transaction list scrolls horizontally if needed
- Photos/screenshots of receipts can help with logging
- Log transactions on the go
- Check your Dashboard from anywhere

**Progressive Web App:**
- You can add Creditmaxxing to your home screen
- Bookmark it for quick access
- Works even with spotty connectivity
- Loads faster when bookmarked

---

**Browsers Supported**

We support all modern browsers:
- Chrome (recommended)
- Firefox
- Safari
- Edge
- Opera

**Browser Requirements:**
- Modern browser (released in last 2-3 years)
- JavaScript enabled
- Cookies enabled
- 4GB+ RAM recommended

**If You Have Issues:**
- Try a different browser
- Clear your browser cache
- Disable browser extensions (ad blockers, etc.)
- Try incognito/private mode

---

**Accessibility**

**We're Committed to Accessibility:**

- Keyboard navigation works throughout the app
- Screen reader compatible (ARIA labels)
- High contrast mode support
- Resizable text
- Color-blind friendly design

**Accessibility Features:**
- Alt text on all images
- Form labels clearly marked
- Clear page structure and headings
- Links are obvious and descriptive
- Error messages are clear
- Tables have headers

**Tab Through the App:**
- Use Tab key to navigate
- Enter to click buttons
- Arrow keys for dropdowns
- Escape to close modals
- Spacebar to toggle checkboxes

**Zoom In:**
- Most browsers allow text zoom (Ctrl/Cmd + plus)
- Page remains usable even zoomed in
- No horizontal scrolling at normal zoom levels

**Dark Mode:**
- System dark mode settings are respected
- Easy on the eyes for late-night tracking

**If You Need Help:**
- Tell us what would help you use the app better
- Contact support at mlaykg@umsystem.edu
- Provide specific accessibility requests
- We want everyone to be able to use Creditmaxxing!

---

**Network & Connectivity**

**Internet Connection:**
- WiFi recommended
- Works on mobile data/LTE
- Minimal data usage
- ~1-2 MB per session

**Offline Mode:**
- Currently limited offline functionality
- Some features require internet connection
- Data syncs when connection returns
- We're working on better offline support

**Slow Connection:**
- App works on slower connections
- May take longer to load/save
- Import large files on good WiFi
- Try a different browser if very slow

**VPN & Security:**
- Safe to use on VPN
- Consider VPN on public WiFi
- Don't enter passwords on unsecured WiFi
- VPN doesn't affect app functionality

---

**Common Device Issues**

**"App is running slow"**
- Close other browser tabs
- Clear browser cache
- Try a different browser
- Restart your browser
- Check your internet connection

**"Features look weird"**
- Zoom to 100% (Ctrl/Cmd + 0)
- Try a different browser
- Disable browser extensions
- Clear cache and reload

**"Can't tap buttons on mobile"**
- Update your browser
- Try zooming in/out
- Restart your phone
- Try a different browser app

**"Screen is too small to use"**
- Zoom in (Ctrl/Cmd + plus)
- Rotate to landscape mode
- Use larger font size in phone settings
- Contact us for accessibility help

**"Buttons/text too small"**
- Zoom in using browser zoom
- Increase font size in system settings
- Use mobile accessibility settings
- Contact support for help"""
        },
    ]
    
    print("\n" + "="*70)
    print("Seeding Creditmaxxing User-Focused Knowledge Base")
    print("="*70 + "\n")
    
    success_count = 0
    fail_count = 0
    
    for item in knowledge_items:
        if add_knowledge_item(item):
            success_count += 1
        else:
            fail_count += 1
    
    print("\n" + "="*70)
    print(f"Summary: {success_count} added, {fail_count} failed")
    print(f"Total knowledge items: {len(knowledge_items)}")
    print("="*70 + "\n")
    
    if success_count == len(knowledge_items):
        print("✓ Knowledge base seeded successfully!")
        print("  Your LLM now has comprehensive user-facing help content.")
        print("\n  The AI assistant can now help users with:")
        print("  - Getting started and onboarding")
        print("  - Adding and managing credit cards")
        print("  - Logging transactions (manual and bulk import)")
        print("  - Understanding rewards, benefits, and promotions")
        print("  - Navigating the website")
        print("  - Troubleshooting common issues")
        print("  - Account security and privacy")
        print("  - Mobile and accessibility features")
        print("\n  Try asking:")
        print("  - 'How do I add a card?'")
        print("  - 'What are rewards and how do they work?'")
        print("  - 'How do I import transactions?'")
        print("  - 'What should I do if my benefit expired?'")
        print("  - 'Can I edit my transactions?'")
    else:
        print("⚠ Some items failed to seed. Check the errors above.")


if __name__ == "__main__":
    seed_knowledge_base()
