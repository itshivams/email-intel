import sys
import argparse
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

from . import analyze

def main():
    parser = argparse.ArgumentParser(description="Enterprise standard email intelligence and verification.")
    parser.add_argument("email", help="Email address to analyze")
    args = parser.parse_args()

    console = Console()
    
    with console.status(f"[bold green]Analyzing {args.email}...") as status:
        try:
            result = analyze(args.email)
        except Exception as e:
            console.print(f"[bold red]Error analyzing email:[/bold red] {e}")
            sys.exit(1)

    console.print(f"\n[bold]Analysis complete for {args.email}[/bold]\n")

    # Email Intelligence Report
    intel_table = Table(title="Email Intelligence Report", show_header=False, box=None)
    intel_table.add_column("Property", style="dim")
    intel_table.add_column("Value")
    
    intel_table.add_row("Domain:", result["domain"])
    intel_table.add_row("Valid:", "[green]Yes[/green]" if result["valid"] else "[red]No[/red]")
    intel_table.add_row("Provider:", f'{result["provider"]} [dim](Confidence: {result["providerConfidence"]}%)[/dim]')
    
    email_type = "[blue]Business[/blue]" if result["businessEmail"] else "[yellow]Public Webmail[/yellow]" if result["publicProvider"] else "[red]Unknown/Disposable[/red]"
    intel_table.add_row("Type:", email_type)
    intel_table.add_row("Disposable:", "[red]Yes[/red]" if result["disposable"] else "[green]No[/green]")
    
    console.print(intel_table)
    console.print("")

    # DNS Records
    dns_table = Table(title="DNS Records", show_header=False, box=None)
    dns_table.add_column("Record", style="dim")
    dns_table.add_column("Status")
    
    dns_table.add_row("MX Record:", "[green]Found[/green]" if result["mx"] else "[red]Missing[/red]")
    dns_table.add_row("SPF Record:", "[green]Found[/green]" if result["spf"] else "[red]Missing[/red]")
    dns_table.add_row("DKIM Record:", "[green]Found[/green]" if result["dkim"] else "[yellow]Not Found (Common selectors checked)[/yellow]")
    dns_table.add_row("DMARC Record:", "[green]Found[/green]" if result["dmarc"] else "[yellow]Missing[/yellow]")
    
    console.print(dns_table)
    console.print("")

    # Risk Assessment
    risk_color = "green"
    if result["risk"] == "medium": risk_color = "yellow"
    if result["risk"] == "high": risk_color = "red"
    
    risk_text = Text(f"Risk Level: {result['risk'].upper()}", style=f"bold {risk_color}")
    score_text = Text(f"Score:      {result['confidence']} / 100", style=f"{risk_color}")
    
    panel = Panel.fit(f"{risk_text}\n{score_text}", title="Risk Assessment", border_style=risk_color)
    console.print(panel)

if __name__ == "__main__":
    main()
