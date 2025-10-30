# 🚀 Quick Start: Campaign Creation

## ✅ Everything is Ready!

Your application is running with all the new features:
- ✅ Click-to-insert variable picker
- ✅ Save all templates at once
- ✅ Auto-fill variables with journalist data
- ✅ Skip outdated/incomplete data
- ✅ 3 email preview displays
- ✅ 28/day sending logic

---

## 📝 Create Your First Campaign (2 minutes)

### Step 1: Go to Campaign Creation
**URL:** [/campaigns/new](https://3000--019a0442-73bc-74c1-bda9-07a3429fe00e.eu-central-1-01.gitpod.dev/campaigns/new)

### Step 2: Enter Campaign Name
```
Example: "Tech Journalists Q1 2024"
```

### Step 3: Use the Variable Picker

**See the variable buttons:**
```
┌─────────────────────────────────────────────────────┐
│  📝 Personalization Variables                       │
│                                                      │
│  [👤 First Name] [👤 Last Name] [📧 Email]          │
│  [🏢 Company] [💼 Title]                             │
└─────────────────────────────────────────────────────┘
```

**How to use:**
1. Click in the **Subject Line** field
2. Type: "Quick question about "
3. Click the **🏢 Company** button
4. See it insert: `{{company}}`
5. Continue typing: "'s coverage"

**Result:**
```
Subject: Quick question about {{company}}'s coverage
```

### Step 4: Create Email Body

1. Click in the **Email Body** field
2. Type: "Hi "
3. Click **👤 First Name** button
4. Type: ","
5. Press Enter twice
6. Type: "I noticed "
7. Click **🏢 Company** button
8. Type: " has been covering AI extensively."

**Result:**
```
Hi {{first_name}},

I noticed {{company}} has been covering AI extensively.

As {{title}} at {{company}}, would you be interested in...

Best,
Mark
```

### Step 5: Add Follow-ups (Optional)

Click **"Add Follow-up #1"** to add a follow-up email.

Repeat the process with different messaging.

### Step 6: Save All Templates

Click **"Save & Select Leads"** button.

All templates (initial + follow-ups) are saved at once!

### Step 7: Select Leads

- System shows only valid leads (complete data)
- Search and filter
- Select leads to contact
- Click **"Continue to Preview"**

### Step 8: Preview Emails

See 3 real examples with variables replaced:
```
┌─────────────────────┐
│ John Smith          │
│ john@techcrunch.com │
│ TechCrunch          │
├─────────────────────┤
│ Initial Email       │
│ Subject: Quick      │
│ question about      │
│ TechCrunch's        │
│ coverage            │
│                     │
│ Hi John,            │
│                     │
│ I noticed           │
│ TechCrunch has been │
│ covering AI...      │
└─────────────────────┘
```

### Step 9: Start Campaign

Click **"🚀 Start Campaign"**

Done! Emails will be sent automatically with 28/day limit.

---

## 🎯 Variable Picker Tips

### ✅ Do This:
1. **Click in field first** - Subject or Body
2. **Then click variable button** - Inserts at cursor
3. **Mix with your text** - Type around variables
4. **Use multiple times** - Same variable can be used multiple times

### Example:
```
Subject: {{first_name}}, question about {{company}}

Hi {{first_name}},

I saw {{company}}'s recent article...

As {{title}} at {{company}}, you might be interested...
```

### Available Variables:
| Button | Variable | Example |
|--------|----------|---------|
| 👤 First Name | `{{first_name}}` | John |
| 👤 Last Name | `{{last_name}}` | Smith |
| 📧 Email | `{{email}}` | john@techcrunch.com |
| 🏢 Company | `{{company}}` | TechCrunch |
| 💼 Title | `{{title}}` | Senior Editor |

---

## 🔥 Pro Tips

### 1. Personalize Every Email
```
❌ Bad:  "Hi there,"
✅ Good: "Hi {{first_name}},"
```

### 2. Reference Their Company
```
❌ Bad:  "I noticed your recent article..."
✅ Good: "I noticed {{company}}'s recent article..."
```

### 3. Use Title When Relevant
```
✅ Good: "As {{title}} at {{company}}, you might..."
```

### 4. Test Variables
The preview page shows exactly how emails will look with real data.

---

## 📊 Complete Example

### Initial Email:
```
Subject: {{first_name}}, quick question about {{company}}'s AI coverage

Hi {{first_name}},

I noticed {{company}} has been covering AI developments extensively, 
particularly your recent piece on machine learning.

As {{title}} at {{company}}, I thought you might be interested in 
an exclusive story about...

Would you have 10 minutes this week for a quick call?

Best,
Mark Hayward
SwayPR
mark@swaypr.com
```

### Follow-up #1 (3 days later):
```
Subject: Re: {{first_name}}, quick question about {{company}}'s AI coverage

Hi {{first_name}},

Just following up on my previous email about the AI story.

I know {{company}}'s readers would find this particularly relevant 
given your focus on emerging tech.

Let me know if you'd like to learn more.

Best,
Mark
```

### Follow-up #2 (6 days later):
```
Subject: Last follow-up: AI story for {{company}}

Hi {{first_name}},

This is my last follow-up. I wanted to make sure you saw this 
opportunity before we move forward with other publications.

Happy to send over the details if you're interested.

Best,
Mark
```

---

## ✅ What Happens Next

1. **Day 1:** Initial emails sent (28/day, 9am-5pm)
2. **Day 4:** Follow-up #1 sent (if no response)
3. **Day 7:** Follow-up #2 sent (if no response)
4. **Auto-stop:** Follow-ups cancelled when recipient replies

---

## 🎉 You're All Set!

**Your URL:** [/campaigns/new](https://3000--019a0442-73bc-74c1-bda9-07a3429fe00e.eu-central-1-01.gitpod.dev/campaigns/new)

**Features:**
- ✅ Click-to-insert variables
- ✅ Save all templates at once
- ✅ Auto-fill with real data
- ✅ Skip invalid contacts
- ✅ Preview before sending
- ✅ 28/day automation

**Time to create campaign:** 2-5 minutes

**Time to send:** Automatic (28/day)

---

**Go create your first campaign now!** 🚀
