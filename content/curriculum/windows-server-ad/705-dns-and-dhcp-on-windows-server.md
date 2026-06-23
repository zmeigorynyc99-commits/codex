---
title: "Windows Server & AD — DNS & DHCP on Windows Server"
slug: "winserver-dns-and-dhcp"
track: "windows-server-ad"
trackName: "Windows Server & Active Directory"
module: "Core Infrastructure Services"
order: 705
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows-server, dns, dhcp, ad-integrated, scopes, intermediate]
cover: "/covers/curriculum/windows-server-ad.svg"
estMinutes: 50
status: "published"
summary: "The network services Active Directory depends on. AD-integrated DNS — zones, the SRV records that locate domain controllers, and secure dynamic updates — plus DHCP scopes, reservations, options and failover on Windows Server, tying the networking track to the Windows infrastructure that runs it."
seoTitle: "Windows Server & AD 5: DNS & DHCP (AD-integrated zones, scopes)"
seoDescription: "Intermediate Windows: AD-integrated DNS zones and SRV records, secure dynamic updates, and DHCP scopes/reservations/options/failover on Windows Server. Lab + assessment."
---

Active Directory is built on **DNS**, and a managed network runs on **DHCP** — and on
Windows Server these are roles you'll configure constantly. This lesson applies the
networking track's DNS/DHCP concepts to **Windows Server**: **AD-integrated DNS**
(zones, the SRV records that let clients find domain controllers, secure updates) and
**DHCP** (scopes, reservations, options, failover). Because "AD problems are usually
DNS problems," getting these right is foundational to a healthy domain.

## Learning objectives

By the end of this lesson you will be able to:

- Explain why AD requires **DNS** and what **AD-integrated zones** add.
- Identify the **SRV records** that locate domain controllers.
- Manage DNS zones/records and **secure dynamic updates**.
- Configure a **DHCP scope**, **reservations**, and **options**.
- Understand **DHCP failover** for resilience.

## Part 1 — DNS and AD

AD clients **find domain controllers and services through DNS** — specifically
**SRV records** under `_msdcs` and `_tcp`. Without working DNS, clients can't locate a
DC to authenticate against, so logons, Group Policy and AD itself fail. That's why AD
is almost always deployed with the **DNS Server role on the domain controllers**.

```powershell
# Install + inspect DNS (often auto-installed with AD DS)
Install-WindowsFeature DNS -IncludeManagementTools
Get-DnsServerZone                          # zones this server hosts
Get-DnsServerResourceRecord -ZoneName "botera.local" | Select-Object -First 10 HostName, RecordType

# The SRV records that locate DCs:
Resolve-DnsName -Type SRV "_ldap._tcp.dc._msdcs.botera.local"
```

> [!IMPORTANT]
> **"AD problems are usually DNS problems."** If clients can't log in, can't find the
> domain, or Group Policy won't apply, suspect DNS first: clients must point at the
> **AD DNS servers** (not a public resolver) so they can resolve the `_msdcs`/SRV
> records that locate DCs. A domain-joined machine using `8.8.8.8` as its DNS will
> mysteriously fail to find its own domain. Check client DNS settings and SRV records
> before anything else.

## Part 2 — AD-integrated zones

A DNS **zone** can be **file-based** (a text file, like classic BIND) or
**AD-integrated** (stored **in Active Directory** and replicated with it). For domain
DNS you want **AD-integrated**:

- **Replicated with AD** — every DC that's a DNS server has a copy; no single point of
  failure, no separate zone-transfer setup.
- **Multi-master** — any DC can accept updates; they replicate.
- **Secure dynamic updates** — clients (and DCs) **register their own records**
  automatically, but only **authenticated** domain members can, preventing spoofed
  registrations.

```powershell
Get-DnsServerZone | Select-Object ZoneName, ZoneType, IsDsIntegrated, DynamicUpdate
# Forward lookup (name->IP) and reverse (IP->name, PTR) zones
Add-DnsServerPrimaryZone -Name "10.0.0.in-addr.arpa" -ReplicationScope Domain   # reverse zone
# Add a static record
Add-DnsServerResourceRecordA -ZoneName "botera.local" -Name "app" -IPv4Address "10.0.0.50"
```

> [!TIP]
> Set dynamic updates to **"Secure only"** on AD-integrated zones: members
> auto-register their A/PTR records (so DNS stays current as DHCP hands out addresses),
> but unauthenticated hosts can't inject records. And create the **reverse lookup
> zone** so PTR records (IP→name) work — some services and troubleshooting depend on
> reverse DNS, and it keeps `nslookup -x` useful.

## Part 3 — Forwarders and resolution

A DNS server that can't answer a query (e.g. an internet name) needs to ask someone
else:

- **Forwarders** — upstream resolvers (e.g. your ISP or `1.1.1.1`) the server forwards
  external queries to. Configure forwarders so domain DNS servers resolve internet
  names without each one walking the root hierarchy.
- **Conditional forwarders** — forward queries for a **specific** domain to a specific
  server (useful for partner domains or hybrid setups).
- **Root hints** — fallback to the root servers if no forwarder answers.

```powershell
Set-DnsServerForwarder -IPAddress "1.1.1.1","8.8.8.8"
Add-DnsServerConditionalForwarderZone -Name "partner.local" -MasterServers "10.9.0.10"
```

## Part 4 — DHCP scopes, reservations, options

The **DHCP Server role** hands out IP configuration (the DORA process from Lesson 507).
On Windows Server you configure:

- **Scope** — the range of addresses for a subnet (e.g. `10.0.0.100`–`10.0.0.200`),
  with a subnet mask and lease duration.
- **Exclusions** — addresses within the range to **not** hand out (for static infra).
- **Reservations** — a specific MAC always gets a specific IP (stable address via
  DHCP).
- **Options** — extra config delivered with the lease: **003 Router** (gateway), **006
  DNS Servers**, **015 DNS Domain Name**, **042 NTP**.

```powershell
Install-WindowsFeature DHCP -IncludeManagementTools
Add-DhcpServerv4Scope -Name "LAN" -StartRange 10.0.0.100 -EndRange 10.0.0.200 -SubnetMask 255.255.255.0 -LeaseDuration 8:00:00
Set-DhcpServerv4OptionValue -ScopeId 10.0.0.0 -Router 10.0.0.1 -DnsServer 10.0.0.10 -DnsDomain "botera.local"
Add-DhcpServerv4Reservation -ScopeId 10.0.0.0 -IPAddress 10.0.0.50 -ClientId "00-15-5d-aa-bb-cc" -Name "printer"
Get-DhcpServerv4Scope; Get-DhcpServerv4Lease -ScopeId 10.0.0.0
```

> [!IMPORTANT]
> **Point DHCP-issued DNS (option 006) at your AD DNS servers, not a public resolver**
> — otherwise domain-joined clients can't find the domain (Part 1). Keep **static
> infrastructure addresses outside the scope range** (or excluded), and use
> **reservations** for devices needing a stable IP without manual config. A DHCP server
> in an AD domain must also be **authorized** in AD (`Add-DhcpServerInDC`) before it
> will serve — a common "DHCP installed but not handing out addresses" gotcha.

## Part 5 — Resilience: DHCP failover and redundancy

A single DHCP server is a single point of failure for **getting on the network**.
Windows Server provides **DHCP Failover** — two servers share a scope:

- **Hot standby** — one active, one standby that takes over if the first fails.
- **Load balance** — both serve, splitting the load (e.g. 50/50).

```powershell
Add-DhcpServerv4Failover -Name "LAN-Failover" -ScopeId 10.0.0.0 -PartnerServer "dhcp2.botera.local" -LoadBalancePercent 50
```

Combined with **multiple DCs running AD-integrated DNS**, this gives the core network
services the redundancy a production domain needs — the same "no single point of
failure" thinking as running multiple domain controllers (Lesson 702).

## Hands-on lab

> Use a lab DC/server with the DNS and DHCP roles. Confine changes to a test scope/zone.

```powershell
# 1. DNS: zones and the SRV records that locate DCs
Get-DnsServerZone | Select-Object ZoneName, ZoneType, IsDsIntegrated, DynamicUpdate
Resolve-DnsName -Type SRV "_ldap._tcp.dc._msdcs.$env:USERDNSDOMAIN" -ErrorAction SilentlyContinue

# 2. Add and remove a test A record
Add-DnsServerResourceRecordA -ZoneName "$env:USERDNSDOMAIN" -Name "labhost" -IPv4Address "10.0.0.250" -ErrorAction SilentlyContinue
Resolve-DnsName "labhost.$env:USERDNSDOMAIN" -ErrorAction SilentlyContinue
Remove-DnsServerResourceRecord -ZoneName "$env:USERDNSDOMAIN" -Name "labhost" -RRType A -Force -ErrorAction SilentlyContinue

# 3. Forwarders
Get-DnsServerForwarder

# 4. DHCP: a test scope with options, a reservation, then remove
Add-DhcpServerv4Scope -Name "LabScope" -StartRange 10.0.99.100 -EndRange 10.0.99.150 -SubnetMask 255.255.255.0 -State InActive -ErrorAction SilentlyContinue
Set-DhcpServerv4OptionValue -ScopeId 10.0.99.0 -Router 10.0.99.1 -DnsServer 10.0.0.10 -DnsDomain "$env:USERDNSDOMAIN" -ErrorAction SilentlyContinue
Get-DhcpServerv4Scope -ScopeId 10.0.99.0 -ErrorAction SilentlyContinue
Remove-DhcpServerv4Scope -ScopeId 10.0.99.0 -Force -ErrorAction SilentlyContinue

# 5. Is this DHCP server authorized in AD?
Get-DhcpServerInDC
```

## Exercises

1. List the DNS zones on the server and identify which are AD-integrated and their
   dynamic-update setting.
2. Resolve the `_ldap._tcp.dc._msdcs.<domain>` SRV record and explain why it's critical
   to AD.
3. Add a static A record to your domain zone, resolve it, then remove it.
4. Create a DHCP scope with a range, set options 003 (router) and 006 (DNS), and add a
   reservation for a given MAC.
5. Explain why DHCP option 006 must point at AD DNS, and what "authorizing" a DHCP
   server in AD means.

## Troubleshooting

- **Clients can't find the domain / can't log in** — wrong client **DNS** (pointing at
  a public resolver). *Fix:* set clients' DNS to the **AD DNS servers**; verify SRV
  records resolve.
- **A record didn't auto-register** — dynamic updates off, or client misconfigured.
  *Fix:* enable **secure dynamic updates**; ensure clients register with the AD DNS.
- **DHCP installed but not handing out addresses** — not **authorized** in AD or scope
  inactive. *Fix:* `Add-DhcpServerInDC`; activate the scope.
- **Clients get an IP but no internet/DNS** — bad options (gateway/DNS). *Fix:* set 003
  and 006 correctly (006 → AD DNS).
- **DHCP outage took the network down** — single server. *Fix:* configure **DHCP
  failover** with a partner.

Reproduce the AD-DNS link: on a domain-joined client, set DNS to `8.8.8.8` and watch
domain logon/`gpupdate` fail (can't find a DC); set it back to the AD DNS and it works
— proving SRV-record resolution is the linchpin.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. Why does AD require DNS, and what records locate domain controllers?
2. What do AD-integrated zones add over file-based zones?
3. What is "secure only" dynamic update, and why use it?
4. What are DNS forwarders for?
5. What is a DHCP scope, and what are reservations and exclusions?
6. Name three common DHCP options and what they configure.
7. Why must DHCP option 006 point at AD DNS?
8. What does authorizing a DHCP server in AD do, and what is DHCP failover?
9. **Practical:** list DNS zones and their integration/update status.
10. **Practical:** create and remove a DHCP scope.

## Solutions & validation

1. Clients **locate DCs/services via DNS SRV records** (under `_msdcs`/`_tcp`); without
   DNS, AD logon/policy fail.
2. Storage **in AD** with AD replication (every DC has a copy), **multi-master**
   updates, and **secure dynamic updates** — no separate zone transfers, no single
   point of failure.
3. Only **authenticated domain members** can register/update their records, preventing
   spoofed registrations while keeping records current.
4. To **forward external queries** to upstream resolvers so the server can answer
   internet names.
5. A **range of addresses for a subnet** to lease; **reservations** tie a MAC to a
   fixed IP; **exclusions** are addresses in the range not to hand out.
6. Any three: **003 Router** (gateway), **006 DNS Servers**, **015 DNS Domain**, **042
   NTP**.
7. So domain-joined clients use **AD DNS** and can resolve the SRV records to find DCs.
8. **Authorizing** registers/permits the DHCP server to serve in the AD domain;
   **failover** pairs two servers (hot standby or load balance) for resilience.
9. **Validation:** `Get-DnsServerZone | Select ZoneName, IsDsIntegrated,
   DynamicUpdate`.
10. **Validation:** `Add-DhcpServerv4Scope ...` then `Remove-DhcpServerv4Scope`.

> [!TIP]
> For a healthy domain: **AD-integrated DNS on multiple DCs, clients pointed at it,
> secure dynamic updates on, reverse zones present; DHCP authorized, option 006 → AD
> DNS, statics excluded, failover configured.** And remember the mantra — when AD
> misbehaves, **check DNS first**.

## What's next

Next: **Lesson 706 — AD Security & Hardening.** Completing the track: protecting the
directory that protects everything else — the password/account policies, privileged-
group control and the tiering model, securing domain controllers, auditing, and
**backing up and recovering** Active Directory.
