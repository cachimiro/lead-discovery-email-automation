# Variable Picker Guide

## Easy Variable Insertion

No more typing `{{first_name}}` manually! Just click to insert variables.

## How It Works

### Step 1: Click in a Field
Click in either the **Subject Line** or **Email Body** field where you want to insert a variable.

### Step 2: Click a Variable Button
Click any of the variable buttons above the email fields:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│     👤      │ │     👤      │ │     📧      │ │     🏢      │ │     💼      │
│ First Name  │ │  Last Name  │ │    Email    │ │   Company   │ │    Title    │
│{{first_name}}│ │{{last_name}}│ │  {{email}}  │ │ {{company}} │ │  {{title}}  │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Step 3: Variable Inserted!
The variable is automatically inserted at your cursor position.

## Available Variables

| Variable | Icon | Description | Example Output |
|----------|------|-------------|----------------|
| `{{first_name}}` | 👤 | Contact's first name | John |
| `{{last_name}}` | 👤 | Contact's last name | Smith |
| `{{email}}` | 📧 | Contact's email address | john@techcrunch.com |
| `{{company}}` | 🏢 | Contact's company name | TechCrunch |
| `{{title}}` | 💼 | Contact's job title | Senior Editor |

## Example Usage

### Before (What You Type):
```
Subject: Quick question about {{company}}'s coverage

Hi {{first_name}},

I noticed {{company}} has been covering AI extensively. 

As {{title}} at {{company}}, would you be interested in...

Best,
Mark
```

### After (What Gets Sent):
```
Subject: Quick question about TechCrunch's coverage

Hi John,

I noticed TechCrunch has been covering AI extensively.

As Senior Editor at TechCrunch, would you be interested in...

Best,
Mark
```

## Tips

### ✅ Do This:
- Click in the field first, then click the variable button
- Use variables to personalize every email
- Mix variables with your own text
- Use the same variable multiple times if needed

### ❌ Don't Do This:
- Don't type variables manually (use the buttons!)
- Don't forget to click in the field first
- Don't use variables that might be empty (like title)

## Visual Guide

```
┌─────────────────────────────────────────────────────────────┐
│  📝 Personalization Variables                               │
│  Click a variable to insert it at your cursor position      │
│                                                              │
│  [👤 First Name] [👤 Last Name] [📧 Email]                  │
│  [🏢 Company] [💼 Title]                                     │
│                                                              │
│  💡 Click in a subject or body field below to activate      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Initial Email                                              │
│                                                              │
│  Subject Line:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Quick question about {{company}}'s coverage ▊       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Email Body:                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Hi {{first_name}},                                  │   │
│  │                                                      │   │
│  │ I noticed {{company}} has been covering AI...▊      │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Keyboard Shortcuts

While the variable picker is active:
- **Tab** - Move to next field
- **Shift + Tab** - Move to previous field
- **Ctrl/Cmd + A** - Select all text
- **Ctrl/Cmd + Z** - Undo

## Advanced Usage

### Multiple Variables in One Line
```
Hi {{first_name}} {{last_name}},
```
Output: `Hi John Smith,`

### Variables in Subject
```
{{first_name}}, quick question about {{company}}
```
Output: `John, quick question about TechCrunch`

### Conditional Text
If a variable is empty, it will be replaced with an empty string:
```
Hi {{first_name}},

{{title}} at {{company}}
```

If title is empty:
```
Hi John,

 at TechCrunch
```

**Tip:** Avoid using optional fields like `{{title}}` in critical positions.

## Troubleshooting

### Variable Buttons Are Disabled
**Problem:** Variable buttons are grayed out
**Solution:** Click in a subject or body field first

### Variable Not Inserting
**Problem:** Clicking variable button does nothing
**Solution:** Make sure you clicked in the field first, not just near it

### Wrong Variable Inserted
**Problem:** Variable inserted in wrong place
**Solution:** Click exactly where you want the variable before clicking the button

## Benefits

✅ **Faster** - No typing `{{` and `}}`
✅ **Accurate** - No typos in variable names
✅ **Visual** - See all available variables at once
✅ **Easy** - Just click to insert
✅ **Smart** - Inserts at cursor position

---

**Location:** `/campaigns/new`
**Feature:** Click-to-insert variable picker
**Status:** ✅ Ready to use
