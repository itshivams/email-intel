import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import Image from "next/image";
import { analyze, EmailIntelResult } from "email-intel";
import SponsorModal from "../components/SponsorModal";


export default function Home() {
  const [emailInput, setEmailInput] = useState("test@itshivam.in");
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<EmailIntelResult | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"js" | "go" | "python" | "cli">("js");
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);

  const logTimerRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    return () => {
      logTimerRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const handleVerify = async (emailToTest: string) => {
    logTimerRef.current.forEach((t) => clearTimeout(t));
    logTimerRef.current = [];

    setIsVerifying(true);
    setResult(null);
    setConsoleLogs([]);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToTest)) {
      setConsoleLogs(["❌ [ERROR] Invalid email address format."]);
      setIsVerifying(false);
      return;
    }

    const domain = emailToTest.split("@")[1].toLowerCase().trim();

    setConsoleLogs((prev) => [...prev, `[DNS] Extracting domain: "${domain}"`]);

    const steps = [
      { delay: 300, msg: `[DNS] Querying MX records for "${domain}"...` },
      { delay: 650, msg: `[DNS] Auditing SPF record...` },
      { delay: 1000, msg: `[DNS] Auditing DMARC record...` },
      { delay: 1350, msg: `[DB] Checking disposable domains database...` },
      { delay: 1700, msg: `[SCORE] Analyzing overall intelligence report...` },
    ];

    steps.forEach((step) => {
      const timer = setTimeout(() => {
        setConsoleLogs((prev) => [...prev, step.msg]);
      }, step.delay);
      logTimerRef.current.push(timer);
    });

    try {
      const parsed = await analyze(emailToTest);

      const timer = setTimeout(() => {
        setConsoleLogs((prev) => [
          ...prev,
          parsed.mx
            ? `[MX] Active MX records found! Inferred: "${parsed.provider}"`
            : `[MX] No active MX records found.`,
          `[DNS] SPF check: ${parsed.spf ? "FOUND (v=spf1)" : "NOT FOUND / INVALID"}`,
          `[DNS] DMARC check: ${parsed.dmarc ? "FOUND" : "NOT FOUND"}`,
          parsed.disposable
            ? `[WARNING] Domain matches temporary mail provider blacklist!`
            : `[DB] Domain is not blacklisted.`,
          `[SCORE] Trust score calculated: ${parsed.confidence}/100`,
          `[COMPLETED] Real-time intelligence analysis finished!`
        ]);
        setResult(parsed);
        setIsVerifying(false);
      }, 1900);
      logTimerRef.current.push(timer);
    } catch (error: any) {
      const timer = setTimeout(() => {
        setConsoleLogs((prev) => [
          ...prev,
          `❌ [ERROR] Verification failed: ${error?.message || "Unknown error"}`
        ]);
        setIsVerifying(false);
      }, 1900);
      logTimerRef.current.push(timer);
    }
  };

  useEffect(() => {
    handleVerify("test@itshivam.in");
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const codeSnippetsRaw = {
    js: `import { analyze } from 'email-intel';

// Inside async function
const report = await analyze('test@itshivam.in');
console.log(report);
/* Output:
{
  email: 'test@itshivam.in',
  domain: 'itshivam.in',
  valid: true,
  provider: 'Zoho Mail',
  type: 'Business',
  mx: true,
  spf: true,
  dmarc: true,
  disposable: false,
  risk: 'low',
  score: 100
}
*/`,
    go: `package main

import (
	"fmt"
	"github.com/itshivams/email-intel/go"
)

func main() {
	report, err := emailintel.Analyze("test@itshivam.in")
	if err != nil {
		panic(err)
	}
	fmt.Printf("Score: %d, Valid: %t\\n", report.Score, report.Valid)
}`,
    python: `from email_intel import analyze

report = analyze("test@itshivam.in")
print(f"Provider: {report['provider']}, Score: {report['score']}")
# Output: Provider: Zoho Mail, Score: 100`,
    cli: `# Install Node CLI globally
npm install -g email-intel

# Or run instantly via Go CLI
go install github.com/itshivams/email-intel/cmd/email-intel@latest

# Run verification in your terminal
email-intel test@itshivam.in`,
  };

  const codeSnippetsHighlighted = {
    js: (
      <>
        <span className="text-[#ff49db]">import</span> {"{"} analyze {"}"} <span className="text-[#ff49db]">from</span> <span className="text-[#26e6e6]">'email-intel'</span>;{"\n\n"}
        <span className="text-zinc-500">// Inside async function</span>{"\n"}
        <span className="text-[#ff49db]">const</span> report = <span className="text-[#ff49db]">await</span> <span className="text-[#ffde43]">analyze</span>(<span className="text-[#26e6e6]">'test@itshivam.in'</span>);{"\n"}
        console.<span className="text-[#ffde43]">log</span>(report);{"\n\n"}
        <span className="text-zinc-500">/* Output:{"\n"}
          {"{"}{"\n"}
          {"  "}email: <span className="text-[#26e6e6]">'test@itshivam.in'</span>,{"\n"}
          {"  "}domain: <span className="text-[#26e6e6]">'itshivam.in'</span>,{"\n"}
          {"  "}valid: <span className="text-[#3cd070]">true</span>,{"\n"}
          {"  "}provider: <span className="text-[#26e6e6]">'Zoho Mail'</span>,{"\n"}
          {"  "}type: <span className="text-[#26e6e6]">'Business'</span>,{"\n"}
          {"  "}mx: <span className="text-[#3cd070]">true</span>,{"\n"}
          {"  "}spf: <span className="text-[#3cd070]">true</span>,{"\n"}
          {"  "}dmarc: <span className="text-[#3cd070]">true</span>,{"\n"}
          {"  "}disposable: <span className="text-[#3cd070]">false</span>,{"\n"}
          {"  "}risk: <span className="text-[#26e6e6]">'low'</span>,{"\n"}
          {"  "}score: <span className="text-[#a855f7]">100</span>{"\n"}
          {"}"}{"\n"}
          */</span>
      </>
    ),
    go: (
      <>
        <span className="text-[#ff49db]">package</span> main{"\n\n"}
        <span className="text-[#ff49db]">import</span> ({"\n"}
        {"\t"}<span className="text-[#26e6e6]">"fmt"</span>{"\n"}
        {"\t"}<span className="text-[#26e6e6]">"github.com/itshivams/email-intel/go"</span>{"\n"}
        ){"\n\n"}
        <span className="text-[#ff49db]">func</span> <span className="text-[#ffde43]">main</span>() {"{"}{"\n"}
        {"\t"}report, err := emailintel.<span className="text-[#ffde43]">Analyze</span>(<span className="text-[#26e6e6]">"test@itshivam.in"</span>){"\n"}
        {"\t"}<span className="text-[#ff49db]">if</span> err != <span className="text-[#3cd070]">nil</span> {"{"}{"\n"}
        {"\t\t"}<span className="text-[#ffde43]">panic</span>(err){"\n"}
        {"\t"}{"}"}{"\n"}
        {"\t"}fmt.<span className="text-[#ffde43]">Printf</span>(<span className="text-[#26e6e6]">"Score: %d, Valid: %t\\n"</span>, report.Score, report.Valid){"\n"}
        {"}"}
      </>
    ),
    python: (
      <>
        <span className="text-[#ff49db]">from</span> email_intel <span className="text-[#ff49db]">import</span> <span className="text-[#ffde43]">analyze</span>{"\n\n"}
        report = <span className="text-[#ffde43]">analyze</span>(<span className="text-[#26e6e6]">"test@itshivam.in"</span>){"\n"}
        <span className="text-[#ffde43]">print</span>(<span className="text-[#26e6e6]">f"Provider: </span>{"{"}report[<span className="text-[#26e6e6]">'provider'</span>]{"}"}<span className="text-[#26e6e6]">, Score: </span>{"{"}report[<span className="text-[#26e6e6]">'score'</span>]{"}"}<span className="text-[#26e6e6]">"</span>){"\n"}
        <span className="text-zinc-500"># Output: Provider: Zoho Mail, Score: 100</span>
      </>
    ),
    cli: (
      <>
        <span className="text-zinc-500"># Install Node CLI globally</span>{"\n"}
        npm install -g email-intel{"\n\n"}
        <span className="text-zinc-500"># Or run instantly via Go CLI</span>{"\n"}
        go install github.com/itshivams/email-intel/cmd/email-intel@latest{"\n\n"}
        <span className="text-zinc-500"># Run verification in your terminal</span>{"\n"}
        email-intel test@itshivam.in
      </>
    ),
  };

  return (
    <>
      <Head>
        <title>Email Intel</title>
        <meta
          name="description"
          content="The ultimate open-source email verification library for JavaScript, Python, and Go. Real-time MX probing, disposable email detection, and provider inference."
        />
        <meta name="keywords" content="email verification, email validation, disposable email detector, mx lookup, spf audit, dmarc audit, go, python, typescript, nodejs, email intelligence" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://email-intel.itshivam.in" />
        <meta property="og:title" content="Email Intel - High-Performance Email Verification & Intelligence" />
        <meta property="og:description" content="Verify MX records, detect disposable domains, audit DNS security (SPF, DMARC), and infer providers instantly. Perfect parity across JS, Go, and Python." />
        <meta property="og:image" content="https://raw.githubusercontent.com/itshivams/email-intel/main/.github/assets/banner.jpeg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://email-intel.itshivam.in" />
        <meta property="twitter:title" content="Email Intel - High-Performance Email Verification & Intelligence" />
        <meta property="twitter:description" content="Verify MX records, detect disposable domains, audit DNS security (SPF, DMARC), and infer providers instantly. Perfect parity across JS, Go, and Python." />
        <meta property="twitter:image" content="https://raw.githubusercontent.com/itshivams/email-intel/main/.github/assets/banner.jpeg" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="canonical" href="https://email-intel.itshivam.in" />
      </Head>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full border-b-4 border-black bg-white px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="neo-border-sm bg-neo-yellow px-3 py-1 text-lg font-extrabold uppercase tracking-tight shadow-neo-sm transform -rotate-1 hover:rotate-0 transition-transform">
              EMAIL-INTEL
            </span>
          </a>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="font-bold uppercase tracking-wide border-b-2 border-transparent hover:border-black py-1 transition-all">
              Features
            </a>
            <a href="#ecosystem" className="font-bold uppercase tracking-wide border-b-2 border-transparent hover:border-black py-1 transition-all">
              Ecosystems
            </a>
            <a href="#usage" className="font-bold uppercase tracking-wide border-b-2 border-transparent hover:border-black py-1 transition-all">
              CLI & Code
            </a>
            <a href="#schema" className="font-bold uppercase tracking-wide border-b-2 border-transparent hover:border-black py-1 transition-all">
              Schema
            </a>
            <a href="#contributing" className="font-bold uppercase tracking-wide border-b-2 border-transparent hover:border-black py-1 transition-all">
              Contributing
            </a>
            <a href="#sponsors" className="font-bold uppercase tracking-wide border-b-2 border-transparent hover:border-black py-1 transition-all">
              Sponsors
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSponsorModalOpen(true)}
              className="neo-border-sm bg-neo-pink px-4 py-2 text-sm font-extrabold uppercase tracking-wider shadow-neo-sm neo-btn-hover flex items-center gap-1.5 cursor-pointer text-black"
            >
              💖 Sponsor
            </button>
            <a
              href="https://github.com/itshivams/email-intel"
              target="_blank"
              rel="noreferrer"
              className="neo-border-sm bg-neo-cyan px-4 py-2 text-sm font-extrabold uppercase tracking-wider shadow-neo-sm neo-btn-hover flex items-center gap-2"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">

        {/* HERO SECTION */}
        <section className="grid gap-8 py-12 lg:grid-cols-12 lg:py-20 items-center">
          <div className="flex flex-col gap-6 lg:col-span-7">
            <div className="neo-border-sm bg-neo-pink text-black text-xs md:text-sm uppercase px-3 py-1 font-black shadow-neo-sm w-fit -rotate-2">
              100% Free &amp; Open Source
            </div>
            <h1 className="text-4xl font-extrabold uppercase leading-none tracking-tight text-black sm:text-6xl md:text-7xl">
              Email Verification, <span className="bg-neo-yellow px-2 border-2 border-black inline-block transform rotate-1">Simplified.</span>
            </h1>
            <p className="max-w-2xl text-lg font-bold text-black md:text-xl leading-relaxed">
              Verify MX records in real-time, block burn-after-reading temp domains, audit DNS security (SPF &amp; DMARC), and infer backend providers instantly. Enterprise intelligence for your login flows.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <a
                href="#ecosystem"
                className="neo-border bg-neo-yellow text-black font-extrabold text-lg uppercase px-8 py-4 shadow-neo neo-btn-hover text-center select-none"
              >
                Get Started
              </a>
              <a
                href="#usage"
                className="neo-border bg-white text-black font-extrabold text-lg uppercase px-8 py-4 shadow-neo neo-btn-hover text-center select-none"
              >
                View Docs
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 font-extrabold uppercase text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <span className="neo-border-sm bg-neo-green p-1 flex items-center justify-center rounded-none shadow-neo-sm">✓</span>
                No API Key Required
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <span className="neo-border-sm bg-neo-cyan p-1 flex items-center justify-center rounded-none shadow-neo-sm">✓</span>
                Isomorphic browser + backend
              </div>
              <div className="flex items-center gap-2 text-purple-700">
                <span className="neo-border-sm bg-neo-purple text-white p-1 flex items-center justify-center rounded-none shadow-neo-sm">✓</span>
                Zero Third-party APIs
              </div>
            </div>
          </div>

          {/* INTERACTIVE DEMO CONSOLE */}
          <div className="lg:col-span-5">
            <div className="neo-border bg-white p-6 shadow-neo-lg flex flex-col gap-6 relative">
              <div className="absolute top-0 right-0 -mr-2 -mt-2 neo-border bg-neo-green text-xs font-black uppercase px-3 py-1 shadow-neo-sm transform rotate-3 z-10">
                Live Analyzer
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-extrabold uppercase">Test an email address</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="e.g. user@domain.com"
                    onKeyDown={(e) => e.key === "Enter" && handleVerify(emailInput)}
                    className="w-full text-base font-bold border-4 border-black px-4 py-3 bg-white focus:outline-none focus:bg-neo-yellow/10 transition-all placeholder-zinc-500 rounded-none"
                  />
                  <button
                    onClick={() => handleVerify(emailInput)}
                    disabled={isVerifying}
                    className="neo-border bg-neo-cyan hover:bg-neo-cyan/85 font-black uppercase px-6 cursor-pointer neo-btn-hover shadow-neo-sm rounded-none"
                  >
                    {isVerifying ? "..." : "Verify"}
                  </button>
                </div>
              </div>

              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs font-black uppercase self-center mr-1">Try presets:</span>
                {[
                  { label: "Business", email: "test@itshivam.in" },
                  { label: "Disposable", email: "spam@10minutemail.com" },
                  { label: "Gmail", email: "shivam@gmail.com" },
                  { label: "College", email: "dean@stanford.edu" },
                ].map((preset) => (
                  <button
                    key={preset.email}
                    onClick={() => {
                      setEmailInput(preset.email);
                      handleVerify(preset.email);
                    }}
                    className="neo-border-sm bg-zinc-100 hover:bg-neo-yellow text-xs font-bold px-2 py-1 shadow-neo-sm transition-colors cursor-pointer rounded-none"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Console Logs */}
              <div className="neo-border bg-zinc-950 p-4 font-mono text-xs text-green-400 min-h-[160px] max-h-[180px] overflow-y-auto flex flex-col gap-1.5 select-all rounded-none">
                <div className="text-zinc-500 border-b border-zinc-800 pb-1 mb-1 font-bold flex justify-between">
                  <span>SYSTEM LOG CONSOLE</span>
                  <span className="animate-pulse">●</span>
                </div>
                {consoleLogs.map((log, idx) => (
                  <div key={idx} className="whitespace-pre-line leading-relaxed">
                    {log}
                  </div>
                ))}
                {isVerifying && (
                  <div className="text-zinc-500 animate-pulse mt-1">
                    Resolving records in real-time...
                  </div>
                )}
                {consoleLogs.length === 0 && !isVerifying && (
                  <div className="text-zinc-500 text-center py-8">
                    Console idle. Type an email and click verify!
                  </div>
                )}
              </div>

              {/* Verification Output Card */}
              {result && (
                <div className="neo-border bg-zinc-50 p-4 shadow-neo flex flex-col gap-4 animate-fadeIn">
                  <div className="flex justify-between items-center border-b-2 border-black pb-2">
                    <div>
                      <h4 className="font-extrabold uppercase text-sm text-zinc-500">Report details</h4>
                      <p className="font-black text-black break-all text-sm">{result.email}</p>
                    </div>
                    <div className="flex flex-col items-center neo-border-sm bg-white p-2 shadow-neo-sm">
                      <span className="text-xs font-black text-zinc-500">SCORE</span>
                      <span className={`text-2xl font-black ${result.confidence > 80 ? "text-green-600" : result.confidence > 50 ? "text-orange-500" : "text-red-500"}`}>
                        {result.confidence}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="neo-border-sm bg-white p-2.5 shadow-neo-sm">
                      <span className="font-bold text-zinc-400 block uppercase">Validity</span>
                      <span className={`font-black text-sm uppercase ${result.valid ? "text-green-600" : "text-red-500"}`}>
                        {result.valid ? "VALID" : "INVALID"}
                      </span>
                    </div>
                    <div className="neo-border-sm bg-white p-2.5 shadow-neo-sm">
                      <span className="font-bold text-zinc-400 block uppercase">Mail Provider</span>
                      <span className="font-black text-sm text-black truncate block">{result.provider}</span>
                    </div>
                    <div className="neo-border-sm bg-white p-2.5 shadow-neo-sm">
                      <span className="font-bold text-zinc-400 block uppercase">Domain Type</span>
                      <span className="font-black text-sm text-black uppercase">{result.type}</span>
                    </div>
                    <div className="neo-border-sm bg-white p-2.5 shadow-neo-sm">
                      <span className="font-bold text-zinc-400 block uppercase">Risk Assessment</span>
                      <span className={`font-black text-sm uppercase ${result.risk === "high" ? "text-red-500" : result.risk === "medium" ? "text-orange-500" : "text-green-600"}`}>
                        {result.risk}
                      </span>
                    </div>
                  </div>

                  <div className="neo-border-sm bg-zinc-900 text-zinc-100 p-2 px-3 flex justify-between font-mono text-xs uppercase font-extrabold rounded-none">
                    <span>DNS Checks:</span>
                    <div className="flex gap-4">
                      <span>MX: <b className={result.mx ? "text-green-400" : "text-red-400"}>{result.mx ? "✓" : "✗"}</b></span>
                      <span>SPF: <b className={result.spf ? "text-green-400" : "text-red-400"}>{result.spf ? "✓" : "✗"}</b></span>
                      <span>DMARC: <b className={result.dmarc ? "text-green-400" : "text-red-400"}>{result.dmarc ? "✓" : "✗"}</b></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>


        {/* FEATURES GRID */}
        <section id="features" className="py-16 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-3xl font-black uppercase md:text-5xl inline-block bg-neo-cyan px-4 py-1 border-4 border-black transform -rotate-1">
              CORE CAPABILITIES
            </h2>
            <p className="max-w-2xl font-bold text-black uppercase text-sm">
              Powerful checks executed dynamically. No external HTTP request limits.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            <div className="neo-border bg-white p-6 shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg transition-all">
              <div className="h-12 w-12 neo-border-sm bg-neo-yellow flex items-center justify-center text-2xl mb-4 shadow-neo-sm font-bold">
                ✉️
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Real-time MX Validation</h3>
              <p className="text-black font-medium leading-relaxed">
                Directly queries domains to guarantee they have active mail exchanger (MX) records. Prevents syntax-valid but dead-end signups.
              </p>
            </div>

            <div className="neo-border bg-white p-6 shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg transition-all">
              <div className="h-12 w-12 neo-border-sm bg-neo-pink flex items-center justify-center text-2xl mb-4 shadow-neo-sm font-bold">
                🗑️
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Disposable Detection</h3>
              <p className="text-black font-medium leading-relaxed">
                Flags "burn-after-reading" temporary emails in milliseconds. Auto-syncs daily lists containing thousands of known burner domains.
              </p>
            </div>

            <div className="neo-border bg-white p-6 shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg transition-all">
              <div className="h-12 w-12 neo-border-sm bg-neo-green flex items-center justify-center text-2xl mb-4 shadow-neo-sm font-bold">
                🤖
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Provider Inference</h3>
              <p className="text-black font-medium leading-relaxed">
                Analyzes hostnames to detect the underlying email host (e.g. Google Workspace, Office 365, Zoho Mail, Proofpoint gateways).
              </p>
            </div>

            <div className="neo-border bg-white p-6 shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg transition-all">
              <div className="h-12 w-12 neo-border-sm bg-neo-cyan flex items-center justify-center text-2xl mb-4 shadow-neo-sm font-bold">
                🏢
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Domain Intelligence</h3>
              <p className="text-black font-medium leading-relaxed">
                Classifies domains immediately into Business, Public Webmail, Education, Government, or Organization based on patterns.
              </p>
            </div>

            <div className="neo-border bg-white p-6 shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg transition-all">
              <div className="h-12 w-12 neo-border-sm bg-neo-purple text-white flex items-center justify-center text-2xl mb-4 shadow-neo-sm font-bold">
                🛡️
              </div>
              <h3 className="text-xl font-black uppercase mb-2">DNS Audit Logs</h3>
              <p className="text-black font-medium leading-relaxed">
                Audits structural domain configurations checking for the presence of SPF, DKIM, and DMARC security tags.
              </p>
            </div>

            <div className="neo-border bg-white p-6 shadow-neo hover:translate-y-[-4px] hover:shadow-neo-lg transition-all">
              <div className="h-12 w-12 neo-border-sm bg-neo-orange flex items-center justify-center text-2xl mb-4 shadow-neo-sm font-bold">
                ⚡
              </div>
              <h3 className="text-xl font-black uppercase mb-2">Perfect Parity</h3>
              <p className="text-black font-medium leading-relaxed">
                Identical validation structures and returns across Javascript/Typescript, Go, and Python libraries. Code once, use anywhere.
              </p>
            </div>

          </div>
        </section>

        {/* ECOSYSTEM / LANGUAGE SECTION */}
        <section id="ecosystem" className="py-16 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-3xl font-black uppercase md:text-5xl inline-block bg-neo-pink text-black px-4 py-1 border-4 border-black transform rotate-1">
              SUPPORTED STACKS
            </h2>
            <p className="max-w-2xl font-bold text-black uppercase text-sm">
              Highly optimized packages designed for local performance.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">

            {/* JS / TS Card */}
            <div className="neo-border bg-[#fffbeb] p-6 shadow-neo-lg flex flex-col justify-between gap-6 hover:translate-y-[-2px] hover:shadow-neo-xl transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="neo-border-sm bg-[#f7df1e] text-black font-extrabold px-3 py-1 text-sm shadow-neo-sm">
                    JS / TS
                  </span>
                  <span className="font-mono text-xs font-black text-zinc-500">npm: email-intel</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">JavaScript / TypeScript</h3>
                <p className="text-sm text-zinc-800 font-bold leading-relaxed">
                  Isomorphic design compatible with both Node.js server runtimes and browser frontends. In browser environments, it automatically switches to Google's secure DNS-over-HTTPS API.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="neo-border-sm bg-zinc-950 p-2.5 px-3 flex justify-between items-center text-zinc-100 font-mono text-xs select-all rounded-none">
                  <span>npm install email-intel</span>
                  <button
                    onClick={() => copyToClipboard("npm install email-intel", "js-npm")}
                    className="text-yellow-400 hover:text-yellow-300 font-bold ml-2 cursor-pointer uppercase text-[10px]"
                  >
                    {copiedText === "js-npm" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <a
                  href="https://www.npmjs.com/package/email-intel"
                  target="_blank"
                  rel="noreferrer"
                  className="neo-border-sm bg-white text-center font-bold text-xs uppercase py-2 hover:bg-zinc-150 transition-colors shadow-neo-sm"
                >
                  NPM Registry ↗
                </a>
              </div>
            </div>

            {/* Go Card */}
            <div className="neo-border bg-[#f0fdfa] p-6 shadow-neo-lg flex flex-col justify-between gap-6 hover:translate-y-[-2px] hover:shadow-neo-xl transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="neo-border-sm bg-neo-cyan text-black font-extrabold px-3 py-1 text-sm shadow-neo-sm">
                    GO MODULE
                  </span>
                  <span className="font-mono text-xs font-black text-zinc-500">go.dev: github.com/itshivams/email-intel</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Golang Module</h3>
                <p className="text-sm text-zinc-800 font-bold leading-relaxed">
                  Blazing fast concurrency model utilizing the native Go `net.Resolver`. Ideal for enterprise middleware, high-throughput microservices, and high-frequency validation checks.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="neo-border-sm bg-zinc-950 p-2.5 px-3 flex justify-between items-center text-zinc-100 font-mono text-xs select-all rounded-none">
                  <span className="truncate">go get github.com/itshivams/email-intel/go</span>
                  <button
                    onClick={() => copyToClipboard("go get github.com/itshivams/email-intel/go", "go-get")}
                    className="text-cyan-400 hover:text-cyan-300 font-bold ml-2 cursor-pointer uppercase text-[10px]"
                  >
                    {copiedText === "go-get" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <a
                  href="https://pkg.go.dev/github.com/itshivams/email-intel/go"
                  target="_blank"
                  rel="noreferrer"
                  className="neo-border-sm bg-white text-center font-bold text-xs uppercase py-2 hover:bg-zinc-150 transition-colors shadow-neo-sm"
                >
                  Go Reference ↗
                </a>
              </div>
            </div>

            {/* Python Card */}
            <div className="neo-border bg-[#fff7ed] p-6 shadow-neo-lg flex flex-col justify-between gap-6 hover:translate-y-[-2px] hover:shadow-neo-xl transition-all">
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <span className="neo-border-sm bg-neo-orange text-white font-extrabold px-3 py-1 text-sm shadow-neo-sm">
                    PYTHON PYPI
                  </span>
                  <span className="font-mono text-xs font-black text-zinc-500">pypi: email-intel-py</span>
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Python Package</h3>
                <p className="text-sm text-zinc-800 font-bold leading-relaxed">
                  Robust, highly synchronous package leveraging the popular `dnspython` library. Seamless integration into Django frameworks, Flask REST APIs, and modern FastAPI routing systems.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <div className="neo-border-sm bg-zinc-950 p-2.5 px-3 flex justify-between items-center text-zinc-100 font-mono text-xs select-all rounded-none">
                  <span>pip install email-intel-py</span>
                  <button
                    onClick={() => copyToClipboard("pip install email-intel-py", "py-pip")}
                    className="text-orange-400 hover:text-orange-300 font-bold ml-2 cursor-pointer uppercase text-[10px]"
                  >
                    {copiedText === "py-pip" ? "Copied!" : "Copy"}
                  </button>
                </div>
                <a
                  href="https://pypi.org/project/email-intel-py/"
                  target="_blank"
                  rel="noreferrer"
                  className="neo-border-sm bg-white text-center font-bold text-xs uppercase py-2 hover:bg-zinc-150 transition-colors shadow-neo-sm"
                >
                  PyPI Project ↗
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* CODE PLAYGROUND & INTEGRATION */}
        <section id="usage" className="py-16 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-3xl font-black uppercase md:text-5xl inline-block bg-neo-yellow text-black px-4 py-1 border-4 border-black transform -rotate-1">
              INTEGRATION SAMPLES
            </h2>
            <p className="max-w-2xl font-bold text-black uppercase text-sm">
              Copy-pasteable boilerplates to get running in under 2 minutes.
            </p>
          </div>

          <div className="neo-border bg-white shadow-neo-lg grid lg:grid-cols-12 overflow-hidden">
            {/* Tabs Sidebar */}
            <div className="lg:col-span-3 border-b-4 lg:border-b-0 lg:border-r-4 border-black bg-zinc-50 flex lg:flex-col">
              {[
                { id: "js", label: "NodeJS / TS" },
                { id: "go", label: "Golang (Go)" },
                { id: "python", label: "Python 3" },
                { id: "cli", label: "Terminal CLI" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveCodeTab(tab.id as any)}
                  className={`flex-1 lg:flex-initial text-left px-5 py-4 font-black uppercase text-sm border-r-2 lg:border-r-0 lg:border-b-2 border-black transition-all cursor-pointer rounded-none ${activeCodeTab === tab.id
                    ? "bg-neo-yellow text-black translate-x-[2px]"
                    : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Block Container */}
            <div className="lg:col-span-9 bg-zinc-950 p-6 flex flex-col justify-between gap-4 font-mono text-sm relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={() => copyToClipboard(codeSnippetsRaw[activeCodeTab], "tab-code")}
                  className="neo-border-sm bg-neo-cyan text-black px-3 py-1 font-bold text-xs cursor-pointer hover:bg-neo-cyan/85 shadow-neo-sm uppercase rounded-none"
                >
                  {copiedText === "tab-code" ? "Copied!" : "Copy Code"}
                </button>
              </div>

              <pre className="text-zinc-100 overflow-x-auto whitespace-pre leading-relaxed select-all pt-8 pr-16 max-h-[420px]">
                <code>{codeSnippetsHighlighted[activeCodeTab]}</code>
              </pre>

              <div className="border-t border-zinc-800 pt-4 flex justify-between text-xs text-zinc-500 font-bold">
                <span>FILE PATH: EXAMPLE.{activeCodeTab === "js" ? "ts" : activeCodeTab === "go" ? "go" : activeCodeTab === "python" ? "py" : "sh"}</span>
                <span>STATUS: READY</span>
              </div>
            </div>
          </div>
        </section>

        {/* SCHEMA DOCUMENTATION TABLE */}
        <section id="schema" className="py-16 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-3xl font-black uppercase md:text-5xl inline-block bg-neo-cyan text-black px-4 py-1 border-4 border-black transform rotate-1">
              REPORT SCHEMA DEFINITION
            </h2>
            <p className="max-w-2xl font-bold text-black uppercase text-sm">
              The structure of the JSON payload returned by all three core packages.
            </p>
          </div>

          <div className="neo-border bg-white shadow-neo-lg overflow-x-auto">
            <table className="w-full min-w-[640px] text-left border-collapse">
              <thead>
                <tr className="bg-neo-purple text-white uppercase border-b-4 border-black font-extrabold text-sm">
                  <th className="p-4 border-r-4 border-black">Field</th>
                  <th className="p-4 border-r-4 border-black">Type</th>
                  <th className="p-4 border-r-4 border-black">Example</th>
                  <th className="p-4">Description</th>
                </tr>
              </thead>
              <tbody className="font-bold text-sm text-black divide-y-4 divide-black">
                {[
                  { field: "email", type: "string", example: '"test@itshivam.in"', desc: "The parsed email address submitted for validation." },
                  { field: "domain", type: "string", example: '"itshivam.in"', desc: "The extracted domain used to resolve DNS queries." },
                  { field: "valid", type: "boolean", example: "true", desc: "Main switch indicating if the domain has active MX servers AND isn't disposable." },
                  { field: "provider", type: "string", example: '"Zoho Mail"', desc: "The detected organization/service managing email delivery behind the scenes." },
                  { field: "type", type: "string", example: '"Business"', desc: "TLD/Pattern classification: Business, Public Webmail, Education, Government, or Organization." },
                  { field: "mx", type: "boolean", example: "true", desc: "DNS Audit: Returns true if valid Mail Exchanger records exist on the domain." },
                  { field: "spf", type: "boolean", example: "true", desc: "DNS Audit: Returns true if a TXT record with SPF parameters was resolved." },
                  { field: "dmarc", type: "boolean", example: "true", desc: "DNS Audit: Returns true if a DMARC policy is actively configured on _dmarc." },
                  { field: "disposable", type: "boolean", example: "false", desc: "Returns true if domain matches a burner/temporary email blacklisted domain." },
                  { field: "risk", type: "string", example: '"low"', desc: "Calculated risk categorization level: low, medium, or high." },
                  { field: "score", type: "number", example: "100", desc: "Calculated credibility score from 0-100 built out of DNS records presence & type." },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-neo-cyan/15 transition-colors">
                    <td className="p-4 border-r-4 border-black font-mono text-zinc-800 font-extrabold">{row.field}</td>
                    <td className="p-4 border-r-4 border-black text-purple-700 font-extrabold">{row.type}</td>
                    <td className="p-4 border-r-4 border-black font-mono text-green-700 font-extrabold">{row.example}</td>
                    <td className="p-4 text-zinc-700 font-medium">{row.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CONTRIBUTION / ATTRIBUTIONS */}
        <section id="contributing" className="py-16 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-3xl font-black uppercase md:text-5xl inline-block bg-neo-pink text-black px-4 py-1 border-4 border-black transform -rotate-1">
              CONTRIBUTING
            </h2>
            <p className="max-w-2xl font-bold text-black uppercase text-sm">
              How to support and expand this multi-ecosystem repository.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">

            <div className="neo-border bg-white p-6 shadow-neo-lg flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <span className="neo-border-sm bg-neo-yellow px-3 py-1 text-xs font-black uppercase w-fit shadow-neo-sm">
                  Parity Requirement
                </span>
                <h3 className="text-2xl font-black uppercase">Maintaining Feature Parity</h3>
                <p className="font-medium text-black leading-relaxed">
                  We enforce 100% logic and schema alignment. If you suggest modifications or add provider detection in one language (e.g. JS), you are highly encouraged to implement the matching logic additions in the Python and Go packages. Let's build a unified library experience!
                </p>
              </div>
              <a
                href="https://github.com/itshivams/email-intel/blob/main/README.md#🤝-contributing"
                target="_blank"
                rel="noreferrer"
                className="neo-border-sm bg-neo-cyan text-center font-black text-sm uppercase py-3 shadow-neo-sm neo-btn-hover"
              >
                Read Contributing Guide ↗
              </a>
            </div>

            <div className="neo-border bg-white p-6 shadow-neo-lg flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <span className="neo-border-sm bg-neo-purple text-white px-3 py-1 text-xs font-black uppercase w-fit shadow-neo-sm">
                  Attributions
                </span>
                <h3 className="text-2xl font-black uppercase">Open-Source Citations</h3>
                <p className="font-medium text-black leading-relaxed">
                  A substantial thank you to the open-source community developers who compile datasets for domains. Email-Intel fetches daily, sanitized, and compressed lists built out of:
                </p>
                <ul className="text-xs font-bold flex flex-col gap-2 list-disc pl-5">
                  <li>
                    <a href="https://github.com/disposable-email-domains/disposable-email-domains" className="underline hover:text-neo-pink">
                      disposable-email-domains / disposable-email-domains
                    </a>
                  </li>
                  <li>
                    <a href="https://github.com/Kikobeats/free-email-domains" className="underline hover:text-neo-pink">
                      Kikobeats / free-email-domains
                    </a>
                  </li>
                </ul>
              </div>
              <div className="neo-border bg-zinc-950 p-3 text-zinc-100 font-mono text-xs uppercase font-extrabold rounded-none">
                ⚙️ Autoupdated weekly via Github Actions workflows
              </div>
            </div>

          </div>
        </section>

        {/* MY SPONSORS SECTION */}
        <section id="sponsors" className="py-16 flex flex-col gap-10">
          <div className="text-center flex flex-col items-center gap-3">
            <h2 className="text-3xl font-black uppercase md:text-5xl inline-block bg-neo-yellow text-black px-4 py-1 border-4 border-black transform rotate-1">
              My Sponsors
            </h2>
            <p className="max-w-2xl font-bold text-black uppercase text-sm">
              Supporting open source software &amp; active package development.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-12 max-w-4xl mx-auto w-full">
            {/* Main callout */}
            <div className="md:col-span-8 neo-border bg-[#fdf2f8] p-6 md:p-8 shadow-neo-lg flex flex-col justify-between gap-6 hover:translate-y-[-2px] hover:shadow-neo-xl transition-all">
              <div className="flex flex-col gap-4 text-black">
                <span className="neo-border-sm bg-neo-pink text-black font-extrabold px-3 py-1 text-xs shadow-neo-sm w-fit uppercase">
                  Support the project
                </span>
                <h3 className="text-2xl font-black uppercase tracking-tight">Become a sponsor</h3>
                <p className="text-sm text-zinc-800 font-bold leading-relaxed">
                  Your sponsorship helps maintain feature parity across JavaScript, Python, and Go, updates disposable domain blacklists weekly, and keeps the DNS resolution tool fast and free.
                </p>
              </div>
              <div>
                <button
                  onClick={() => setIsSponsorModalOpen(true)}
                  className="neo-border bg-neo-yellow hover:bg-neo-yellow/85 text-black font-black uppercase text-sm py-3 px-6 shadow-neo neo-btn-hover cursor-pointer"
                >
                  💖 Sponsor via Razorpay
                </button>
              </div>
            </div>

            {/* List of current sponsors */}
            <div className="md:col-span-4 neo-border bg-white p-6 shadow-neo-lg flex flex-col justify-between gap-4 text-black">
              <div className="flex flex-col gap-3">
                <span className="neo-border-sm bg-neo-green text-black font-extrabold px-3 py-1 text-xs shadow-neo-sm w-fit uppercase">
                  Sponsors List
                </span>
                <h4 className="text-lg font-black uppercase">Current Sponsors</h4>
                
                {/* Empty State / Call to Action */}
                <div className="flex flex-col gap-2 py-4 text-center border-2 border-dashed border-zinc-300 rounded-none bg-zinc-50">
                  <span className="text-3xl">✨</span>
                  <p className="text-xs font-bold text-zinc-500 uppercase px-2">
                    Your name here!
                  </p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase px-4">
                    Sponsor this tool to show your support.
                  </p>
                </div>
              </div>

              <div className="text-[10px] font-bold text-zinc-500 uppercase text-center">
                Autoupdated weekly
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t-4 border-black bg-white px-4 py-8 md:px-8 mt-12">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <span className="neo-border-sm bg-neo-yellow px-3 py-1 text-sm font-extrabold uppercase shadow-neo-sm w-fit">
              EMAIL-INTEL
            </span>
            <p className="text-xs font-bold text-zinc-500 uppercase mt-2 flex items-center gap-1 flex-wrap">
              <span>© {new Date().getFullYear()}</span>
              <a
                href="https://itshivam.in"
                target="_blank"
                rel="noreferrer"
                className="neo-border-sm bg-neo-yellow text-black px-1.5 py-0.5 text-[10px] font-black shadow-neo-sm hover:translate-y-[-1px] hover:shadow-neo transition-all duration-100 inline-block uppercase"
              >
                Shivam ↗
              </a>
              <span>. MIT License.</span>
            </p>
          </div>

          <div className="flex gap-6 font-bold text-xs uppercase text-black">
            <a href="#features" className="hover:underline">Features</a>
            <a href="#ecosystem" className="hover:underline">Ecosystems</a>
            <a href="#usage" className="hover:underline">Docs</a>
            <button
              onClick={() => setIsSponsorModalOpen(true)}
              className="hover:underline font-bold uppercase cursor-pointer"
            >
              Sponsor
            </button>
            <a href="https://github.com/itshivams/email-intel" className="hover:underline">GitHub</a>
          </div>

          <div className="neo-border-sm bg-zinc-900 text-zinc-100 font-mono text-xs uppercase px-3 py-1 font-extrabold shadow-neo-sm rounded-none">
            NO ADS. NO TRACKERS. PURE INTEL.
          </div>
        </div>
      </footer>

      <SponsorModal
        isOpen={isSponsorModalOpen}
        onClose={() => setIsSponsorModalOpen(false)}
      />
    </>
  );
}
