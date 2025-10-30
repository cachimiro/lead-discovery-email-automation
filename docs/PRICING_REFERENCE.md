# AI Lead Discovery - Pricing Reference

## Current Model: GPT-4o (Transitioning to GPT-5)

**Note:** We are currently using GPT-4o as GPT-5 is not yet publicly available. Pricing will be updated when GPT-5 is released.

### Current Pricing (GPT-4o)
- **Input**: $2.50 per 1M tokens
- **Output**: $10.00 per 1M tokens

## Future: OpenAI GPT-5 Pricing (When Available)

### GPT-5 (Full Model)
- **Input**: $1.25 per 1M tokens
- **Output**: $10.00 per 1M tokens
- **Use Case**: Complex reasoning, company research, detailed analysis

### GPT-5 Mini
- **Input**: $0.25 per 1M tokens
- **Output**: $2.00 per 1M tokens
- **Use Case**: Simple classification, industry detection, quick tasks

### GPT-5 Nano
- **Input**: $0.05 per 1M tokens
- **Output**: $0.40 per 1M tokens
- **Use Case**: Bulk processing, very light reasoning, high-volume tasks

## Our Pricing Model (5% Profit Margin)

### Formula
```
Your Price per Token = OpenAI Price × 1.05
Billable Amount = Actual Cost × 1.05
```

### Per-1,000-Token Pricing (Human Readable)

#### GPT-5
- **Input**: $0.00125 per 1K tokens → **Bill: $0.0013125** (×1.05)
- **Output**: $0.01 per 1K tokens → **Bill: $0.0105** (×1.05)

#### GPT-5 Mini
- **Input**: $0.00025 per 1K tokens → **Bill: $0.0002625** (×1.05)
- **Output**: $0.002 per 1K tokens → **Bill: $0.0021** (×1.05)

#### GPT-5 Nano
- **Input**: $0.00005 per 1K tokens → **Bill: $0.0000525** (×1.05)
- **Output**: $0.0004 per 1K tokens → **Bill: $0.00042** (×1.05)

## Example Cost Calculations

### Scenario 1: Company Research (GPT-5)
```
Input: 1,500 tokens (detailed search criteria)
Output: 3,000 tokens (20 companies with details)

Actual Cost:
- Input: 1,500 / 1,000,000 × $1.25 = $0.001875
- Output: 3,000 / 1,000,000 × $10.00 = $0.03000
- Total: $0.031875

Billable (5% markup):
- Total: $0.031875 × 1.05 = $0.0334688
- Rounded: $0.03 (3 cents)
- Profit: $0.0016 (0.16 cents)
```

### Scenario 2: Industry Detection (GPT-5 Mini)
```
Input: 200 tokens (journalist info)
Output: 5 tokens (industry name)

Actual Cost:
- Input: 200 / 1,000,000 × $0.25 = $0.00005
- Output: 5 / 1,000,000 × $2.00 = $0.00001
- Total: $0.00006

Billable (5% markup):
- Total: $0.00006 × 1.05 = $0.000063
- Rounded: $0.0001 (0.01 cents)
- Profit: $0.000003
```

### Scenario 3: Full AI Search (100 leads)
```
Company Research (GPT-5): $0.03
Email Finding (API): $5.00 (varies by provider)
Email Validation (NeverBounce): $0.80 (100 × $0.008)
Industry Classification (GPT-5 Mini): $0.01

Actual Total: $5.84
Billable (5% markup): $6.13
Profit: $0.29
```

## Third-Party Service Costs

### Email Verification (NeverBounce)
- **Cost**: ~$0.008 per email
- **Billable**: $0.0084 per email (×1.05)
- **100 emails**: $0.84 billable

### Data Providers (Estimated)
- **Apollo**: $0.05-0.10 per lead
- **Clearbit**: $0.10-0.20 per enrichment
- **Crunchbase**: $0.15-0.25 per company lookup

### SERP/Search APIs
- **Google Custom Search**: $5 per 1,000 queries
- **SerpAPI**: $0.002-0.005 per search

## Batch Pricing Recommendations

### Small Batch (1-50 leads)
- Fixed fee: $10-15
- Covers: Research + Finding + Validation
- Profit margin: ~20-30%

### Medium Batch (51-200 leads)
- Per-lead: $0.15-0.25
- Volume discount applied
- Profit margin: ~15-20%

### Large Batch (201-1000 leads)
- Per-lead: $0.10-0.15
- Bulk discount applied
- Profit margin: ~10-15%

### Enterprise (1000+ leads)
- Custom pricing
- Per-lead: $0.05-0.10
- Profit margin: ~5-10%

## Cost Tracking in Database

All costs are stored in `cold_outreach_cost_to_bill` table:

```sql
-- Example query to see total costs
SELECT 
  service_name,
  COUNT(*) as api_calls,
  SUM(tokens_input) as total_input_tokens,
  SUM(tokens_output) as total_output_tokens,
  SUM(cost_cents) / 100.0 as total_cost_usd,
  SUM(billable_cents) / 100.0 as total_billable_usd,
  SUM(billable_cents - cost_cents) / 100.0 as total_profit_usd
FROM cold_outreach_cost_to_bill
WHERE user_id = 'YOUR_USER_ID'
GROUP BY service_name;
```

## Implementation Notes

### Cost Calculation in Code
```typescript
// GPT-5 pricing
const costCents = Math.ceil(
  (tokensInput / 1000000 * 1.25 * 100) + 
  (tokensOutput / 1000000 * 10.00 * 100)
);

// Apply 5% markup
const markupPercent = 5.0;
const billableCents = Math.ceil(costCents * (1 + markupPercent / 100));
```

### Why Store in Cents?
- Avoids floating-point precision issues
- Accurate calculations for billing
- Easy to convert to dollars: `cents / 100`

## Model Selection Guide

### Use GPT-5 When:
- Complex company research
- Detailed analysis required
- High accuracy needed
- Multi-step reasoning

### Use GPT-5 Mini When:
- Simple classification
- Industry detection
- Quick categorization
- Cost-sensitive operations

### Use GPT-5 Nano When:
- Bulk processing
- Very simple tasks
- High-volume operations
- Maximum cost efficiency

## Transparency & Reporting

Every API call is logged with:
- Exact token counts
- Model used
- Actual cost
- Markup percentage
- Billable amount
- Timestamp
- Request details

Users can view detailed cost breakdowns in `/admin/costs` dashboard.
