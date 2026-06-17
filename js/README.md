<div align="center">
  <img src="https://raw.githubusercontent.com/itshivams/email-intel/main/.github/assets/banner.jpeg" alt="Email-Intel Banner" width="100%" />

  <br />

  <p><b>The Ultimate Enterprise-Standard Email Verification & Intelligence Library for JS/TS</b></p>

  [![npm version](https://img.shields.io/npm/v/email-intel.svg?style=flat-square)](https://www.npmjs.com/package/email-intel)
  [![npm downloads](https://img.shields.io/npm/dt/email-intel.svg?style=flat-square)](https://www.npmjs.com/package/email-intel)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

  <p>🌐 <b>Website:</b> <a href="https://email-intel.itshivam.in">email-intel.itshivam.in</a></p>
</div>

---

This library is primarily focused on **checking if an email is valid**, **checking if it's a temp/disposable email**, and inferring the underlying email provider (e.g. Google Workspace, Microsoft 365, Zoho) with deep DNS analysis.

## Features

- **Email Validation**: Real-time MX record resolution to check if the domain can actually receive emails.
- **Disposable Email Detection**: Checks domains against an automatically updated daily list of thousands of disposable/temp email services (like 10minutemail, GuerrillaMail).
- **Provider Inference**: Identifies enterprise security gateways and providers like Proofpoint, Mimecast, Google Workspace, Microsoft 365, Zoho, etc.
- **Domain Classification**: Intelligently classifies domains into `Education`, `Government`, `Organization`, `Public Webmail`, or `Business` based on TLDs and regex.
- **Isomorphic**: Works flawlessly in the backend (Node.js) and the frontend (Browsers) out of the box.

---

## 📊 Intelligence Report Schema

When you analyze an email address (e.g., `test@itshivam.in`), the library returns a comprehensive intelligence report. Here is the data dictionary and an example of the return values:

| Field | Type | Example Value | Description |
|---|---|---|---|
| `email` | string | `"test@itshivam.in"` | The email address that was analyzed. |
| `domain` | string | `"itshivam.in"` | The extracted domain. |
| `valid` | boolean | `true` | **True** if the domain has MX records and is not disposable. |
| `provider` | string | `"Zoho Mail"` | The detected email provider behind the domain. |
| `type` | string | `"Business"` | Categorization (e.g., `Business`, `Public Webmail`, `Education`). |
| `mx` / `spf` / `dmarc` | boolean | `true` | **True** if the respective DNS security records were found. |
| `disposable` | boolean | `false` | **True** if the domain belongs to a temporary/burn-after-reading email service. |
| `risk` | string | `"low"` | Assessed risk level (`low`, `medium`, `high`) based on the score. |
| `score` | number | `100` | A score out of 100 indicating the trustworthiness of the email address. |

## Installation

```bash
npm install email-intel
```

---

## Integration Guide

### 1. Backend Integration (Node.js)

In your Node.js backend (e.g., Express, NestJS), you can use `email-intel` to block signups from disposable emails or validate that an email's domain actually exists before saving it to your database.

```typescript
import { analyze } from 'email-intel';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/register', async (req, res) => {
  const { email } = req.body;

  try {
    const report = await analyze(email);

    // 1. Check if the email domain is valid (has MX records)
    if (!report.valid) {
      return res.status(400).json({ error: "Invalid email domain. Please provide a real email." });
    }

    // 2. Check if the email is a disposable/temp email
    if (report.disposable) {
      return res.status(400).json({ error: "Disposable emails are not allowed." });
    }

    // 3. Optional: Block free public webmails if you only want B2B users
    if (report.type === "Public Webmail") {
      return res.status(400).json({ error: "Please use your company email address." });
    }

    // Proceed with registration...
    res.json({ message: "Registration successful!", data: report });

  } catch (error) {
    res.status(500).json({ error: "Email validation failed." });
  }
});
```

### 2. Frontend Integration (React / Next.js / Vue)

You can also use `email-intel` directly in the browser! When run in the browser, it seamlessly falls back to Google's DNS-over-HTTPS (DoH) API to resolve DNS records without requiring a backend.

This is perfect for providing instant feedback to users as they type.

```tsx
import React, { useState } from 'react';
import { analyze, EmailIntelResult } from 'email-intel';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlur = async () => {
    if (!email.includes('@')) return;
    
    setLoading(true);
    setError('');
    
    try {
      const report: EmailIntelResult = await analyze(email);
      
      // Instantly warn the user if the domain is invalid
      if (!report.valid) {
        setError('This email domain does not appear to exist.');
      } 
      // Warn them if they are using a temporary email
      else if (report.disposable) {
        setError('Please use a real, permanent email address.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onBlur={handleBlur} // Validate when user leaves the input field
        placeholder="Enter your email"
      />
      {loading && <span>Verifying...</span>}
      {error && <span style={{ color: 'red' }}>{error}</span>}
      
      <button disabled={!!error || loading}>Sign Up</button>
    </form>
  );
}
```

---

## CLI Usage

You can also use the package globally as a CLI tool:

```bash
npm install -g email-intel

email-intel shivam@test.com
```

This will output a nice, formatted intelligence report in your terminal!
