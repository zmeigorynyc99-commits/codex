---
title: "Windows Server & AD — Active Directory Concepts"
slug: "winserver-active-directory-concepts"
track: "windows-server-ad"
trackName: "Windows Server & Active Directory"
module: "Active Directory"
order: 702
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [active-directory, domain, forest, ou, domain-controller, intermediate]
cover: "/covers/curriculum/windows-server-ad.svg"
estMinutes: 55
status: "published"
summary: "The heart of the Windows enterprise. What Active Directory is, the domain model (domains, trees, forests), organizational units, domain controllers and the global catalog, replication, and how AD centralizes identity and policy — the concepts every Windows enterprise role builds on."
seoTitle: "Windows Server & AD 2: Active Directory Concepts (domains, OUs, DCs)"
seoDescription: "Intermediate Windows: Active Directory explained — domains, trees, forests, OUs, domain controllers, global catalog, replication, FSMO, and how AD centralizes identity. Lab + assessment."
---

**Active Directory (AD)** is the system that turns a pile of Windows machines into a
managed enterprise: one place to define **who users are**, **what they can access**,
and **how machines are configured** — for thousands of users and computers. If you've
only managed standalone machines, AD is the conceptual leap to "managed at scale."
This lesson builds the mental model — domains, forests, OUs, domain controllers — that
every later AD task depends on.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what **Active Directory Domain Services** provides.
- Describe the structure: **domain → tree → forest**.
- Use **organizational units (OUs)** to organize and delegate.
- Explain **domain controllers**, the **global catalog**, and **replication**.
- Read **distinguished names (DN)** and know the role of **DNS** in AD.

## Part 1 — What AD provides

**AD DS** is a **directory service**: a centralized, replicated database of
**objects** (users, groups, computers, printers…) plus the services to authenticate
and authorize them. It gives an organization:

- **Single sign-on / centralized identity** — one account works across all domain
  machines and services; no per-machine local accounts.
- **Centralized authentication** — domain controllers verify logons (via **Kerberos**)
  for the whole domain.
- **Centralized management & policy** — manage users/computers in one place and push
  configuration with **Group Policy** (Lesson 704).
- **Delegation** — grant specific admins control over specific slices (OUs) without
  making them domain admins.

A machine that's **joined to a domain** trusts the domain's identities; you log in
with `DOMAIN\user` and your access follows you to any domain machine.

## Part 2 — Domains, trees, and forests

AD's logical structure nests:

- **Domain** — the core administrative/security boundary: a set of objects sharing a
  database, policies, and a DNS name (e.g. `corp.botera.local`). Authentication and
  most policy happen at the domain level.
- **Tree** — one or more domains sharing a **contiguous DNS namespace** (e.g.
  `botera.local`, `eu.botera.local`, `us.botera.local`) with automatic trust between
  them.
- **Forest** — the **top-level security boundary**: one or more trees that share a
  common **schema** and **global catalog**, with trust across all domains. The
  **forest is the true security boundary** — everything in it trusts the same schema.

```text
Forest: botera.local
 ├─ Tree: botera.local
 │    ├─ domain: botera.local
 │    └─ domain: eu.botera.local
 └─ Tree: contoso.local   (different namespace, same forest)
```

> [!IMPORTANT]
> The **forest — not the domain — is the real security boundary.** Domains within a
> forest **trust each other** automatically and share the schema/global catalog, so a
> compromise of one domain can threaten the forest. Use **separate forests** when you
> need genuine security isolation between organizations/environments; use multiple
> **domains** within a forest for administrative/geographic separation under shared
> trust. Many modern deployments are intentionally a **single domain, single forest**
> for simplicity.

## Part 3 — Organizational Units (OUs)

An **OU** is a container **within a domain** used to **organize** objects and to
**delegate administration** and **apply Group Policy**. Unlike groups (which are about
*permissions/membership*), OUs are about **structure and management**:

- **Organize** users/computers logically (by department, location, function).
- **Delegate** control — give the "Helpdesk" group the right to reset passwords for the
  `OU=Staff` only.
- **Target Group Policy** — link a GPO to an OU so its settings apply to just those
  objects.

```text
Domain: botera.local
 ├─ OU=Staff
 │   ├─ OU=Engineering   (users, with the "Engineering admins" delegated)
 │   └─ OU=Sales
 ├─ OU=Servers
 └─ OU=Workstations
```

> [!TIP]
> Design OUs around **how you administer**, not just an org chart: OUs are where you
> **delegate** rights and **link Group Policy**, so structure them so the right
> policies and the right delegated admins map cleanly. Don't confuse **OUs**
> (structure/management/GPO scope) with **groups** (collections for permissions) — you
> use both, for different jobs.

## Part 4 — Domain controllers, global catalog, replication

- A **Domain Controller (DC)** is a server running **AD DS** that holds a copy of the
  domain database and **authenticates** users. You typically run **multiple DCs** per
  domain for **redundancy** — if one fails, others keep authenticating.
- DCs **replicate** changes among themselves (multi-master): create a user on one DC
  and it propagates to the others. Replication has latency, so a brand-new account may
  take a moment to appear everywhere.
- The **Global Catalog (GC)** is a partial, forest-wide index (held by designated DCs)
  enabling **forest-wide searches** and logons across domains.
- Certain unique roles (**FSMO** roles — e.g. PDC Emulator, RID Master, Schema Master)
  are held by specific DCs for operations that can't be multi-master.

> [!IMPORTANT]
> **Run at least two domain controllers.** AD authenticates every domain logon, so a
> single DC is a single point of failure for the *entire* organization's ability to
> log in. Multiple DCs (and replication between them) provide resilience. Also: a
> healthy AD depends on **time sync** (Kerberos rejects tickets with >5 min skew —
> Lesson 211) and **DNS** (Part 5), which is why those are recurring themes.

## Part 5 — DNS and distinguished names

Two practical essentials:

- **AD requires DNS.** Clients find domain controllers and services via special DNS
  **SRV records**; AD is almost always paired with **AD-integrated DNS** (Lesson 705).
  "AD problems" are frequently **DNS** problems — clients can't locate a DC.
- Every object has a **Distinguished Name (DN)** — its full path in the directory,
  read right-to-left as DC (domain components) → OU → CN (common name):

```text
CN=Alex Smith,OU=Engineering,OU=Staff,DC=botera,DC=local
└─ object ──┘ └─ containers (OUs) ──┘ └── domain (botera.local) ──┘
```

You'll see DNs constantly in PowerShell AD cmdlets (next lesson). Reading them tells
you exactly **where** an object lives in the structure.

## Hands-on lab

> Best on a Windows Server VM promoted to a domain controller (or a domain-joined
> machine with RSAT). If you don't have AD, study the structure and DNs.

```powershell
# (Run on a DC or with RSAT + the ActiveDirectory module)

# 1. Domain and forest facts
Get-ADDomain  | Select-Object Name, DNSRoot, NetBIOSName, DomainMode, PDCEmulator
Get-ADForest  | Select-Object Name, ForestMode, GlobalCatalogs, Domains, SchemaMaster

# 2. Domain controllers in the domain
Get-ADDomainController -Filter * | Select-Object Name, IPv4Address, Site, IsGlobalCatalog

# 3. The OU structure (how the domain is organized)
Get-ADOrganizationalUnit -Filter * | Select-Object Name, DistinguishedName | Format-Table -Wrap

# 4. Read a few objects' Distinguished Names
Get-ADUser -Filter * -ResultSetSize 5 | Select-Object Name, DistinguishedName

# 5. FSMO roles (which DC holds each unique role)
netdom query fsmo 2>$null
Get-ADForest | Select-Object SchemaMaster, DomainNamingMaster
Get-ADDomain | Select-Object PDCEmulator, RIDMaster, InfrastructureMaster

# 6. AD relies on DNS — check the SRV records that locate DCs
nslookup -type=SRV _ldap._tcp.dc._msdcs.$env:USERDNSDOMAIN 2>$null
```

## Exercises

1. State, in your own words, what AD DS provides to an organization (give three
   benefits).
2. Draw (in text) a forest with one tree, two domains, and two OUs under one domain,
   and label the security boundary.
3. Explain the difference between an **OU** and a **group**, and what each is used for.
4. Why run more than one domain controller, and what is the global catalog for?
5. Read this DN and describe where the object lives: `CN=Sam
   Lee,OU=Sales,OU=Staff,DC=corp,DC=botera,DC=local`.

## Troubleshooting

- **Clients can't log in / find the domain** — almost always **DNS** (can't locate a
  DC via SRV records). *Fix:* point clients at the AD DNS servers; verify SRV records;
  check DC health.
- **New user/group not appearing on another DC** — **replication latency**. *Fix:*
  wait, or force replication (`repadmin /syncall`); check replication health.
- **Kerberos/logon failures across the domain** — **time skew** > 5 min. *Fix:* sync
  time to the PDC Emulator (Lesson 211).
- **A forest-wide search fails** — no reachable **global catalog**. *Fix:* ensure a GC
  is available/healthy.
- **Confusing OUs with groups** — *Fix:* OUs = structure/delegation/GPO scope; groups =
  permission membership; use both appropriately.

Reproduce the DNS dependency idea: `nslookup -type=SRV _ldap._tcp.dc._msdcs.<domain>`
returns the DCs — this is exactly how clients find a domain controller, which is why
broken DNS breaks AD.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. What is Active Directory Domain Services, and name two things it provides.
2. Define domain, tree, and forest.
3. Which is the true security boundary, and why does that matter?
4. What is an OU used for, and how does it differ from a group?
5. What is a domain controller, and why run more than one?
6. What is the global catalog?
7. Why does AD depend on DNS and on time sync?
8. Read a DN: what do CN, OU, and DC components represent?
9. **Practical:** show the domain and forest names/modes.
10. **Practical:** list the domain controllers.

## Solutions & validation

1. A **directory service** (centralized, replicated object database + auth); provides
   any two of **central identity/SSO, central authentication (Kerberos), central
   management/Group Policy, delegation**.
2. **Domain** = core admin/security unit (shared DB/policy/DNS name); **tree** =
   domains in a contiguous namespace with trust; **forest** = one or more trees sharing
   schema/global catalog (top boundary).
3. The **forest** — domains within it auto-trust and share the schema, so isolation
   between organizations needs separate **forests**.
4. An **OU** organizes objects and is where you **delegate** admin and **link GPOs**; a
   **group** is a collection for **permissions/membership**.
5. A server running **AD DS** that holds the domain DB and **authenticates** users; run
   **multiple** for redundancy (AD is critical to all logons).
6. A **forest-wide partial index** (on designated DCs) enabling forest-wide searches
   and cross-domain logons.
7. Clients **locate DCs/services via DNS SRV records**; **Kerberos** rejects tickets
   with >5 min **time skew**.
8. **CN** = the object (common name), **OU** = containing organizational unit(s), **DC**
   = the domain components (e.g. botera.local).
9. **Validation:** `Get-ADDomain` / `Get-ADForest`.
10. **Validation:** `Get-ADDomainController -Filter *`.

> [!TIP]
> The AD mental model: **forest (security boundary) ⊃ domains (auth/policy) ⊃ OUs
> (structure/delegation/GPO) ⊃ objects.** Multiple DCs replicate it; DNS locates them;
> time keeps Kerberos happy. Hold that picture and every AD task has an obvious place
> in the structure.

## What's next

Next: **Lesson 703 — Managing AD Users, Groups & Computers.** The daily work: creating
and managing accounts, the **group scopes** (Domain Local / Global / Universal) and
the **AGDLP** strategy, joining computers to the domain, and doing it all efficiently
with the **ActiveDirectory PowerShell module** — bulk operations included.
