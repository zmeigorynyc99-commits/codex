---
title: "Linux Administration — Network Configuration with Netplan & nmcli"
slug: "linux-admin-network-configuration-netplan-nmcli"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Networking Configuration"
order: 205
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, networking, netplan, nmcli, static-ip, interfaces, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Configure a server's network the way it's done in production: assign a static IP that survives reboots with Netplan (Ubuntu) or nmcli/NetworkManager (RHEL), understand interfaces and the renderer model, and apply changes safely with netplan try so a mistake can't lock you out."
seoTitle: "Linux Administration 5: Static IPs with Netplan & nmcli"
seoDescription: "Intermediate Linux: assign persistent static IPs with Netplan (Ubuntu) and nmcli (RHEL/NetworkManager), understand interfaces and renderers, and apply safely with netplan try. Lab + assessment."
---

Earlier in the curriculum you learned networking *fundamentals* — IPs, ports, DNS,
and the tools to inspect them. Now you'll **configure** a server's network the way
it's done in production: assigning a **static IP** that persists across reboots,
understanding the modern configuration model, and — critically — applying changes
**safely** so a typo doesn't lock you out of a remote box. We cover both major
worlds: **Netplan** (Ubuntu) and **nmcli/NetworkManager** (RHEL/Rocky/Fedora).

> [!NOTE]
> Practise on a VM you can reach by **console** (not only SSH), because a network
> misconfiguration can cut your SSH session. Both tools below have a "test/rollback"
> mechanism precisely for this — we'll use it every time.

## Learning objectives

By the end of this lesson you will be able to:

- Identify interfaces and their current addressing with `ip`.
- Explain the **Netplan → renderer** model and where config lives.
- Configure a **persistent static IP** with Netplan (Ubuntu).
- Do the same with **`nmcli`** (RHEL/NetworkManager).
- Apply changes **safely** with `netplan try` / NetworkManager, and verify them.

## Part 1 — Know your interfaces first

Before changing anything, inspect the current state (your fundamentals tools):

```bash
ip -br a                       # brief: each interface, state (UP/DOWN), IP
ip -br link                    # interfaces and MAC addresses
ip route                       # routing table; note the 'default via' gateway
ip a show eth0                 # detail for one interface
```

Modern Linux uses **predictable interface names** like `enp0s3`, `ens18`, `eth0`,
`wlp2s0` (derived from the hardware location) instead of the old, unstable `eth0/
eth1` ordering. Note your interface's exact name from `ip -br a` — you'll put it in
the config. The `lo` interface is loopback (`127.0.0.1`); leave it alone.

A static IP needs four facts; gather them now:

- The **interface name** (e.g. `enp0s3`).
- The **IP address + prefix** you want (e.g. `192.168.1.50/24`).
- The **gateway** (the `default via` from `ip route`, e.g. `192.168.1.1`).
- The **DNS servers** (e.g. `1.1.1.1`, `8.8.8.8`).

## Part 2 — The Netplan model (Ubuntu)

Ubuntu configures networking with **Netplan**: you write simple **YAML** in
`/etc/netplan/*.yaml`, and Netplan generates config for a **renderer** that does the
actual work — either **`networkd`** (servers, default) or **NetworkManager**
(desktops). You edit YAML; Netplan handles the backend.

```bash
ls /etc/netplan/                          # e.g. 00-installer-config.yaml
sudo cat /etc/netplan/*.yaml              # see the current config
```

> [!IMPORTANT]
> Netplan YAML is **whitespace-sensitive** and uses **2-space indentation, never
> tabs** — a single bad indent breaks the whole file. Keep a backup
> (`sudo cp file file.bak`) before editing, and always validate/apply with the safe
> command in Part 3 rather than a blind `netplan apply`.

## Part 3 — A persistent static IP with Netplan

Edit (or create) a file like `/etc/netplan/01-static.yaml`:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:                     # <-- YOUR interface name from `ip -br a`
      dhcp4: false              # turn OFF DHCP; we set the address ourselves
      addresses:
        - 192.168.1.50/24       # the static IP and prefix
      routes:
        - to: default
          via: 192.168.1.1      # the gateway
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
```

Now apply it **the safe way**:

```bash
sudo cp /etc/netplan/01-static.yaml /etc/netplan/01-static.yaml.bak
sudo netplan generate                     # validate: errors here mean a YAML/syntax problem
sudo netplan try                          # APPLY with auto-rollback after 120s if you don't confirm
#   -> if your connection still works, press Enter to keep it.
#   -> if you got locked out, do nothing: it reverts automatically.
sudo netplan apply                        # only after `try` proves it's good
```

Verify:

```bash
ip -br a show enp0s3                       # shows 192.168.1.50/24
ip route                                   # default via 192.168.1.1
ping -c2 192.168.1.1                       # gateway reachable
ping -c2 1.1.1.1                           # internet reachable
```

> [!IMPORTANT]
> **`sudo netplan try` is your safety net on a remote server.** It applies the new
> config but **automatically rolls back after 120 seconds unless you confirm** — so
> if a wrong IP/gateway cuts your SSH, you simply wait and the old, working config
> returns. Never apply networking changes to a remote box with a blind `netplan
> apply`; use `try` first, every time.

## Part 4 — The same with nmcli (RHEL / NetworkManager)

On RHEL/Rocky/Fedora (and Ubuntu desktops), **NetworkManager** is in charge and
**`nmcli`** is its command-line tool. It edits **connection profiles** rather than a
YAML file:

```bash
nmcli connection show                      # list connection profiles
nmcli device status                        # interfaces and their connection

# Set a static IP on a connection named 'ens18' (adjust to yours)
sudo nmcli con mod ens18 ipv4.method manual \
  ipv4.addresses 192.168.1.50/24 \
  ipv4.gateway 192.168.1.1 \
  ipv4.dns "1.1.1.1 8.8.8.8"

# Apply by bringing the connection down then up
sudo nmcli con down ens18 && sudo nmcli con up ens18
nmcli -f IP4 device show ens18             # verify the address
```

To go back to DHCP: `sudo nmcli con mod ens18 ipv4.method auto` then re-up the
connection. `nmtui` is a friendly text-menu front-end to the same settings if you
prefer arrows to flags.

> [!TIP]
> Mental map across distros: **Ubuntu = Netplan YAML → networkd**; **RHEL =
> NetworkManager via nmcli/nmtui**. Both express the same four facts (interface,
> address/prefix, gateway, DNS). Learn the concept once; the tool is whichever the
> distro in front of you uses. The legacy `/etc/network/interfaces` (old Debian) and
> `ifcfg-*` files (old RHEL) still appear on older systems — recognise them, but new
> work uses Netplan or NetworkManager.

## Hands-on lab

> Do this with **console access available**. We make a change, verify, and revert.

```bash
# 1. Record the current state so you can restore it
ip -br a
ip route
IFACE=$(ip -br a | awk '$1!="lo" && $2=="UP"{print $1; exit}')
echo "working on interface: $IFACE"

# 2. Ubuntu/Netplan path -------------------------------------------------
sudo cp /etc/netplan/*.yaml /root/netplan-backup.yaml 2>/dev/null
sudoedit /etc/netplan/99-lab.yaml   # (or: sudo nano) paste a static config for $IFACE
sudo netplan generate               # must report no errors
sudo netplan try                    # confirm within 120s if connectivity holds
ip -br a show "$IFACE"              # verify new address
ping -c2 1.1.1.1                     # verify internet

# 3. Revert cleanly
sudo rm /etc/netplan/99-lab.yaml
sudo netplan apply
ip -br a show "$IFACE"

# 4. RHEL/nmcli path (if on NetworkManager) ------------------------------
nmcli connection show
# (mod / down / up as in Part 4, then revert ipv4.method auto)
```

## Exercises

1. From `ip -br a` and `ip route`, write down the four facts needed for a static IP
   on your main interface: name, address/prefix, gateway, DNS.
2. On Ubuntu, write a Netplan YAML that gives your interface a static IP, and
   validate it with `netplan generate` (fix any indentation errors).
3. Apply it with `netplan try`, confirm connectivity, then keep it — then revert to
   the original config.
4. On a NetworkManager system, set the same static IP with `nmcli`, verify, and
   switch the connection back to DHCP.
5. Explain why `netplan try` (or NetworkManager's behaviour) matters specifically
   when configuring a **remote** server.

## Troubleshooting

- **Lost SSH right after applying** — wrong IP/gateway/interface. *Fix:* if you used
  `netplan try`, wait 120s for auto-rollback; otherwise use the **console** to fix
  the file and `netplan apply`. Prevention: always `netplan try`.
- **`netplan generate` errors / nothing applies** — YAML indentation (tabs, wrong
  spaces). *Fix:* use **2 spaces**, no tabs; compare against the example; restore
  the `.bak` if needed.
- **Static IP set but no internet** — missing or wrong **gateway** or **DNS**. *Fix:*
  `ping` the gateway (layer-3 ok?) then `ping 1.1.1.1` (routing ok?) then resolve a
  name (DNS ok?); add `nameservers` if name resolution fails (next lesson).
- **Two configs fighting / address from DHCP still present** — another netplan file
  or DHCP still enabled. *Fix:* set `dhcp4: false`; ensure only one file configures
  the interface.
- **`nmcli` change "didn't take"** — you modified the profile but didn't reactivate
  it. *Fix:* `nmcli con down <name> && nmcli con up <name>`.

Reproduce the rollback safety net: on a VM, set a deliberately wrong gateway, run
`netplan try`, do nothing, and watch the config revert after 120 seconds.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on
a VM with console access.

1. Which command shows interfaces and their current IPs briefly?
2. What four pieces of information define a static IPv4 configuration?
3. On Ubuntu, where do Netplan config files live, and what format are they?
4. What is a Netplan "renderer," and name the two common ones.
5. Which command applies Netplan changes with automatic rollback, and why does that
   matter?
6. How do you set a static IP with `nmcli`, and how do you make it take effect?
7. What's the cross-distro mental map for network config (Ubuntu vs RHEL)?
8. After setting a static IP, which three pings/checks confirm it fully works?
9. **Practical:** identify your active interface and its gateway. Commands?
10. **Practical:** validate a Netplan file without applying it. Command?

## Solutions & validation

1. `ip -br a` (or `ip -br address`).
2. **Interface name**, **IP address + prefix**, **gateway**, **DNS servers**.
3. In **`/etc/netplan/*.yaml`**, written in **YAML** (2-space indent, no tabs).
4. The backend that actually applies the config Netplan generates; the two are
   **networkd** (servers) and **NetworkManager** (desktops).
5. **`sudo netplan try`** — it auto-reverts after ~120s unless confirmed, preventing
   a bad config from permanently locking you out of a remote server.
6. `nmcli con mod <name> ipv4.method manual ipv4.addresses .../24 ipv4.gateway ...
   ipv4.dns "..."`, then `nmcli con down <name> && nmcli con up <name>`.
7. **Ubuntu = Netplan YAML → networkd; RHEL = NetworkManager (nmcli/nmtui)** — same
   four facts, different tool.
8. Ping the **gateway**, ping an **internet IP** (e.g. `1.1.1.1`), and resolve a
   **name** (DNS) — layer 3, routing, and name resolution.
9. **Validation:** `ip -br a` for the interface; `ip route` shows `default via
   <gateway>`.
10. **Validation:** `sudo netplan generate` (reports errors without applying).

> [!TIP]
> "Gather the four facts, write the config, `netplan try`, verify with three pings,
> then keep it" is a safe, repeatable workflow for any server. The discipline of
> `try`/rollback on remote boxes is what keeps a 2 a.m. change from becoming a
> drive-to-the-datacentre.

## What's next

Next: **Lesson 206 — DNS Resolution & Hostnames.** A static IP gets you on the
network; **DNS** turns names into addresses. You'll configure how a server resolves
names — `/etc/hosts`, `/etc/resolv.conf`, and modern `systemd-resolved` — set the
machine's hostname, and debug the extremely common "ping by IP works but by name
fails" class of problems.
