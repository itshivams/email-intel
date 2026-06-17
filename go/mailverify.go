package email-intel

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net"
	"net/http"
	"regexp"
	"strings"
	"sync"
)

type Result struct {
	Email              string `json:"email"`
	Domain             string `json:"domain"`
	Valid              bool   `json:"valid"`
	Provider           string `json:"provider"`
	ProviderConfidence int    `json:"providerConfidence"`
	MX                 bool   `json:"mx"`
	SPF                bool   `json:"spf"`
	DKIM               bool   `json:"dkim"`
	DMARC              bool   `json:"dmarc"`
	Disposable         bool   `json:"disposable"`
	PublicProvider     bool   `json:"publicProvider"`
	Type               string `json:"type"`
	CatchAll           bool   `json:"catchAll"`
	Risk               string `json:"risk"`
	Confidence         int    `json:"confidence"`
}

var (
	cachedDisposable = make(map[string]bool)
	cachedPublic     = make(map[string]bool)
	listsFetched     bool
	mu               sync.Mutex
)

var fallbackDisposable = []string{
	"10minutemail.com", "dispostable.com", "guerrillamail.com", "mailinator.com",
	"tempmail.com", "temp-mail.org", "yopmail.com",
}

var fallbackPublic = []string{
	"aol.com", "gmail.com", "googlemail.com", "hotmail.com", "icloud.com", "live.com",
	"mail.com", "msn.com", "outlook.com", "proton.me", "protonmail.com", "yahoo.com", "zoho.com",
}

func fetchLists() {
	mu.Lock()
	defer mu.Unlock()
	if listsFetched {
		return
	}

	fetchAndPopulate := func(url string, cache map[string]bool, fallback []string) {
		resp, err := http.Get(url)
		var domains []string
		if err == nil && resp.StatusCode == 200 {
			body, _ := ioutil.ReadAll(resp.Body)
			json.Unmarshal(body, &domains)
			resp.Body.Close()
		}
		if len(domains) == 0 {
			domains = fallback
		}
		for _, d := range domains {
			cache[strings.ToLower(d)] = true
		}
	}

	fetchAndPopulate("https://raw.githubusercontent.com/itshivams/email-intel/main/data/disposable.json", cachedDisposable, fallbackDisposable)
	fetchAndPopulate("https://raw.githubusercontent.com/itshivams/email-intel/main/data/free.json", cachedPublic, fallbackPublic)
	listsFetched = true
}

func inferProvider(mxRecords []*net.MX) (string, int) {
	mxStr := ""
	for _, mx := range mxRecords {
		mxStr += strings.ToLower(mx.Host) + " "
	}
	
	if strings.Contains(mxStr, "google.com") || strings.Contains(mxStr, "googlemail.com") {
		return "Google Workspace", 98
	}
	if strings.Contains(mxStr, "mail.protection.outlook.com") {
		return "Microsoft 365", 98
	}
	if strings.Contains(mxStr, "pphosted.com") {
		return "Proofpoint", 95
	}
	if strings.Contains(mxStr, "mimecast.com") {
		return "Mimecast", 95
	}
	if strings.Contains(mxStr, "barracudanetworks.com") {
		return "Barracuda", 95
	}
	if strings.Contains(mxStr, "iphmx.com") {
		return "Cisco IronPort", 95
	}
	if strings.Contains(mxStr, "amazonses.com") {
		return "Amazon SES", 95
	}
	if strings.Contains(mxStr, "mx.cloudflare.net") {
		return "Cloudflare", 95
	}
	if strings.Contains(mxStr, "mailgun.org") {
		return "Mailgun", 95
	}
	if strings.Contains(mxStr, "sendgrid.net") {
		return "Sendgrid", 95
	}
	if strings.Contains(mxStr, "secureserver.net") {
		return "GoDaddy", 95
	}
	if strings.Contains(mxStr, "zoho.com") || strings.Contains(mxStr, "zoho.in") {
		return "Zoho Mail", 95
	}
	if strings.Contains(mxStr, "protonmail.ch") || strings.Contains(mxStr, "protonmail.com") {
		return "Proton Mail", 95
	}
	if strings.Contains(mxStr, "yandex.net") {
		return "Yandex", 95
	}
	if strings.Contains(mxStr, "fastmail.com") {
		return "Fastmail", 95
	}

	return "Unknown", 0
}

func determineDomainType(domain string, isPublic bool, isDisposable bool) string {
	if isDisposable {
		return "Disposable"
	}
	if isPublic {
		return "Public Webmail"
	}

	if matched, _ := regexp.MatchString(`\.(edu|ac)(\.[a-z]{2})?$`, domain); matched {
		if strings.HasSuffix(domain, ".in") {
			return "Indian Education"
		}
		if strings.HasSuffix(domain, ".uk") {
			return "UK Education"
		}
		return "Education"
	}

	if matched, _ := regexp.MatchString(`\.(gov|mil)(\.[a-z]{2})?$`, domain); matched {
		if strings.HasSuffix(domain, ".in") {
			return "Indian Government"
		}
		if strings.HasSuffix(domain, ".uk") {
			return "UK Government"
		}
		if strings.HasSuffix(domain, ".gov") || strings.HasSuffix(domain, ".mil") {
			return "US Government"
		}
		return "Government"
	}

	if matched, _ := regexp.MatchString(`\.org(\.[a-z]{2})?$`, domain); matched {
		return "Organization"
	}

	return "Business"
}

func hasRecord(records []string, prefix string) bool {
	for _, r := range records {
		if strings.Contains(r, prefix) {
			return true
		}
	}
	return false
}

func Analyze(email string) (*Result, error) {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid email format")
	}
	domain := strings.ToLower(strings.TrimSpace(parts[1]))

	fetchLists()

	isDisposable := cachedDisposable[domain]
	isPublic := cachedPublic[domain]

	mxRecords, _ := net.LookupMX(domain)
	txtRecords, _ := net.LookupTXT(domain)
	dmarcRecords, _ := net.LookupTXT("_dmarc." + domain)
	
	dkimProbes := []string{}
	selectors := []string{"google", "default", "s1", "s2", "m1", "m2", "k1", "k2", "selector1", "mail", "dkim"}
	for _, selector := range selectors {
		dkim, _ := net.LookupTXT(selector + "._domainkey." + domain)
		dkimProbes = append(dkimProbes, dkim...)
	}

	mx := len(mxRecords) > 0
	spf := hasRecord(txtRecords, "v=spf1")
	dmarc := hasRecord(dmarcRecords, "v=DMARC1")
	dkim := len(dkimProbes) > 0

	provider, providerConf := inferProvider(mxRecords)
	domainType := determineDomainType(domain, isPublic, isDisposable)
	
	score := 0
	if mx {
		score += 30
		if spf { score += 20 }
		if dmarc { score += 15 }
		if !isDisposable { score += 10 }
		score += 10 
		score += 15 
	}

	risk := "high"
	if score >= 80 && !isDisposable {
		risk = "low"
	} else if score >= 50 {
		risk = "medium"
	}
	if isDisposable {
		risk = "high"
	}

	finalProvider := provider
	if isPublic && provider == "Unknown" {
		finalProvider = "Public Webmail"
	}

	return &Result{
		Email:              email,
		Domain:             domain,
		Valid:              mx && !isDisposable,
		Provider:           finalProvider,
		ProviderConfidence: providerConf,
		MX:                 mx,
		SPF:                spf,
		DKIM:               dkim,
		DMARC:              dmarc,
		Disposable:         isDisposable,
		PublicProvider:     isPublic,
		Type:               domainType,
		CatchAll:           false,
		Risk:               risk,
		Confidence:         score,
	}, nil
}
