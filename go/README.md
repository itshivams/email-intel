# mailverify (Go)

Enterprise standard email intelligence and verification library for Go.

Reliably detect email providers, verify MX and SPF/DMARC records, and identify disposable or temporary email addresses.

## Features

- **DNS Verification**: MX, SPF, DMARC, and basic DKIM checks.
- **Provider Inference**: Identifies Google Workspace, Microsoft 365, Zoho, etc.
- **Disposable Detection**: Checks domains against an automatically updated daily list of disposable email services.
- **Public vs Business**: Distinguishes between free public webmails (Gmail, Yahoo) and custom business domains.
- **Confidence Scoring**: Computes a risk and confidence score for the email address.

## Installation

```bash
go get github.com/itshivams/mailverify/go
```

## Usage

### In your Go application

```go
package main

import (
	"fmt"
	"github.com/itshivams/mailverify/go"
)

func main() {
	result, err := mailverify.Analyze("john@acme.com")
	if err != nil {
		panic(err)
	}

	fmt.Printf("Valid: %v\n", result.Valid)
	fmt.Printf("Provider: %s\n", result.Provider)
	fmt.Printf("Risk: %s\n", result.Risk)
}
```

### CLI Usage

You can also use the package globally as a CLI tool:

```bash
go install github.com/itshivams/mailverify/go/cmd/email-intel@latest

email-intel john@acme.com
```

This will output a JSON report of the intelligence gathering.
