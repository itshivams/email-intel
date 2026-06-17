package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/itshivams/email-intel"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: email-intel <email>")
		os.Exit(1)
	}
	email := os.Args[1]

	fmt.Printf("Analyzing %s...\n", email)
	result, err := emailintel.Analyze(email)
	if err != nil {
		fmt.Printf("\033[31mError analyzing email: %v\033[0m\n", err)
		os.Exit(1)
	}

	fmt.Printf("\033[32m✔ Analysis complete for %s\033[0m\n\n", email)

	fmt.Println("\033[1m--- Email Intelligence Report ---\033[0m")
	fmt.Printf("\033[90m%-15s\033[0m %s\n", "Domain:", result.Domain)

	validStr := "\033[31mNo\033[0m"
	if result.Valid {
		validStr = "\033[32mYes\033[0m"
	}
	fmt.Printf("\033[90m%-15s\033[0m %s\n", "Valid:", validStr)
	fmt.Printf("\033[90m%-15s\033[0m %s \033[90m(Confidence: %d%%)\033[0m\n", "Provider:", result.Provider, result.ProviderConfidence)

	typeColor := "\033[34m" 
	if result.Type == "Disposable" {
		typeColor = "\033[31m" 
	} else if result.Type == "Public Webmail" {
		typeColor = "\033[33m" 
	}
	fmt.Printf("\033[90m%-15s\033[0m %s%s\033[0m\n", "Type:", typeColor, result.Type)

	dispStr := "\033[32mNo\033[0m"
	if result.Disposable {
		dispStr = "\033[31mYes\033[0m"
	}
	fmt.Printf("\033[90m%-15s\033[0m %s\n\n", "Disposable:", dispStr)

	fmt.Println("\033[1m--- DNS Records ---\033[0m")
	
	printRecord := func(name string, found bool) {
		status := "\033[31mMissing\033[0m"
		if found {
			status = "\033[32mFound\033[0m"
		}
		fmt.Printf("\033[90m%-15s\033[0m %s\n", name+":", status)
	}
	
	printRecord("MX Record", result.MX)
	printRecord("SPF Record", result.SPF)
	if result.DKIM {
		printRecord("DKIM Record", result.DKIM)
	}
	
	dmarcStatus := "\033[33mMissing\033[0m"
	if result.DMARC {
		dmarcStatus = "\033[32mFound\033[0m"
	}
	fmt.Printf("\033[90m%-15s\033[0m %s\n\n", "DMARC Record:", dmarcStatus)

	fmt.Println("\033[1m--- Risk Assessment ---\033[0m")
	riskColor := "\033[32m" 
	if result.Risk == "medium" {
		riskColor = "\033[33m" 
	} else if result.Risk == "high" {
		riskColor = "\033[31m" 
	}

	fmt.Printf("\033[90m%-15s\033[0m %s%s\033[0m\n", "Risk Level:", riskColor, strings.ToUpper(result.Risk))
	fmt.Printf("\033[90m%-15s\033[0m %s%d / 100\033[0m\n\n", "Score:", riskColor, result.Confidence)
}
