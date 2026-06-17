package main

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/itshivams/mailverify/go"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: email-intel <email>")
		os.Exit(1)
	}
	email := os.Args[1]

	result, err := mailverify.Analyze(email)
	if err != nil {
		fmt.Printf("Error analyzing email: %v\n", err)
		os.Exit(1)
	}

	b, err := json.MarshalIndent(result, "", "  ")
	if err != nil {
		fmt.Printf("Error formatting result: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(string(b))
}
