# Ingredient Identification via Vision API

## Plan
1. Image → Vision model request  
2. Prompt design for ingredient extraction  
3. API response parsing + confidence handling  
4. Edge cases & production considerations  

---

## 1. Vision API Call

Send an image (URL or base64) with a structured prompt.

### JavaScript Example
```js
import OpenAI from "openai";
const openai = new OpenAI();

const response = await openai.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Identify all visible ingredients. Be concise." },
        {
          type: "image_url",
          image_url: { url: IMAGE_URL }
        }
      ]
    }
  ]
});

console.log(response.choices[0].message.content);
```

---

## 2. Prompt Design (Critical)

Use strict instructions and structured output.

### Recommended Prompt
```
You are a food ingredient recognition system.

Tasks:
1. List all visible ingredients
2. Group by category (produce, spices, nuts)
3. Mark uncertain items with "?"
4. Do NOT guess unseen items

Output JSON only.
```

### Example Output
```json
{
  "produce": ["lemongrass", "kaffir lime", "shallots"],
  "spices": ["red chili", "green chili", "turmeric?"],
  "nuts": ["cashews", "peanuts"]
}
```

---

## 3. Parsing & Confidence Handling

Best practices:
- Treat results as probabilistic
- Preserve uncertainty markers
- Allow human override when needed

Optional refinement call:
```
Confirm which ingredients you are least confident about and why.
```

---

## 4. Edge Cases

| Case | Mitigation |
|----|----|
| Similar roots | Require uncertainty flag |
| Processed food | Restrict to visible items |
| Cluttered image | Ask for top-level items |
| Multiple cuisines | Avoid cuisine inference |

---

## Suggested Architecture

```
Image Upload
   ↓
Vision Ingredient Detection (JSON)
   ↓
Confidence Filter
   ↓
Human Review (optional)
   ↓
Database
```

---

## Model Selection

| Use Case | Model |
|----|----|
| MVP / low cost | gpt-4o-mini |
| High accuracy | gpt-4o |

---

## Notes
- Vision is imperfect → design for uncertainty
- Prompt quality matters more than model choice
- Never infer unseen ingredients
