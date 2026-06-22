import type Database from 'better-sqlite3';

const NETWORKING_TUTORIAL_SLUG = 'zero-to-hero-networking-linux-windows-openstack-openvswitch';

const NETWORKING_TUTORIAL_CONTENT = `# Zero to Hero Networking Academy: Linux, Windows, OpenStack, and Open vSwitch

This 60-hour learning path is designed for a beginner who wants to become productive with real-world networking across Linux servers, Windows clients and servers, virtual networks, OpenStack clouds, and Open vSwitch. Work through it in order, type the commands yourself, and keep a lab journal with diagrams, mistakes, packet captures, and fixes.

> Safety note: run labs in isolated virtual machines or a private test network. Do not scan, spoof, intercept, or attack networks you do not own or have explicit permission to test.

## How to use this 60-hour roadmap

- **Pace:** 20 sessions of about 3 hours each.
- **Outcome:** you should be able to explain network flows, configure basic services, debug common failures, and understand how Linux bridges, Windows networking, OpenStack Neutron, and Open vSwitch fit together.
- **Lab stack:** one laptop or desktop with virtualization, 16 GB RAM recommended, and at least 80 GB free disk.
- **Suggested VMs:** Ubuntu Server, Fedora or Debian, Windows evaluation VM, and optionally an OpenStack all-in-one lab such as DevStack or MicroStack.
- **Core tools:** terminal, PowerShell, Wireshark, tcpdump, iproute2, NetworkManager, nmcli, netplan, nftables or iptables, Windows Event Viewer, OpenStack CLI, and ovs-vsctl.


## Read this first: the quality rule

Do not continue when a word is unclear. Networking is cumulative: if you skip a small word such as "route", "prefix", "frame", "state", "encapsulation", "gateway", or "namespace", later sections become memorization instead of understanding. Use this rule throughout the academy:

1. **Stop** when a term is unclear.
2. **Define it in one sentence** in your own words.
3. **Draw it** if it is a relationship, path, or boundary.
4. **Run a command** that proves the idea exists on a real system.
5. **Explain the failure mode**: what breaks when this thing is wrong?

This tutorial is intentionally broad and detailed, but no single article can literally cover every networking product, protocol, vendor feature, exam blueprint, or production design. The goal is to build a precise foundation so certification books, vendor docs, and real incidents become understandable instead of overwhelming.

## Exam and DevOps reality check

Reading alone is not enough to pass serious exams or become a DevOps engineer. To pass exams and work in production, combine this academy with:

- official exam objectives for the exact certification;
- timed practice questions;
- hands-on labs repeated until commands feel natural;
- packet captures for successful and failed traffic;
- troubleshooting notes written in your own words;
- at least one capstone where you build, break, diagnose, and repair a network.

A learner who completes every lab here should be prepared to start certification-specific preparation and should understand the networking layer of DevOps work much better. They will still need deeper practice in Linux, scripting, Git, CI/CD, cloud, containers, Kubernetes, monitoring, and incident response.

## Definition-first glossary: learn these before moving fast

### Address

An **address** identifies a thing so other things can find it. A MAC address identifies a network interface on a local layer 2 network. An IP address identifies an interface or endpoint at layer 3. A port identifies an application conversation on a host.

### Application

An **application** is the program that wants to communicate, such as a browser, SSH client, database server, DNS resolver, or API service. Applications do not usually know every network detail; they ask the operating system to open sockets and send data.

### ARP

**Address Resolution Protocol** maps IPv4 addresses to MAC addresses on a local Ethernet network. If a host knows it needs to send to \`192.168.1.10\` but does not know the destination MAC, it asks the LAN, "Who has this IP?" A wrong or missing ARP entry can make local hosts unable to talk even when IP addresses look correct.

### Bandwidth

**Bandwidth** is the theoretical or measured amount of data that can pass per second. It is not the same as latency. A network can have high bandwidth but still feel slow if latency, packet loss, DNS, or application delays are bad.

### Bridge

A **bridge** is a software or hardware layer 2 device that forwards Ethernet frames between ports. A Linux bridge and an Open vSwitch bridge can both act like virtual switches for VMs, containers, and namespaces.

### Broadcast domain

A **broadcast domain** is the set of devices that receive layer 2 broadcast frames from each other. VLANs split one physical switching infrastructure into multiple broadcast domains.

### CIDR

**Classless Inter-Domain Routing** writes IP networks as address plus prefix length, such as \`10.0.0.0/24\`. The prefix length tells how many bits identify the network. CIDR replaced older classful assumptions and is essential for subnetting and route summarization.

### Client and server

A **client** initiates a request. A **server** listens for requests. The same machine can be both: your laptop is a DNS client when resolving names and may be an SSH server if it accepts SSH connections.

### Default gateway

A **default gateway** is the router a host uses when the destination is not on a directly connected local network. If the default gateway is wrong, local traffic may work while internet or cross-subnet traffic fails.

### DNS

**Domain Name System** converts names into records, commonly names to IP addresses. DNS failure often looks like "the internet is down" even when routing works. Always test both name-based and IP-based connectivity.

### Encapsulation

**Encapsulation** means wrapping data with headers for each layer. Application data is wrapped by TCP or UDP, then IP, then Ethernet or another link layer. Each layer adds information needed by devices at that layer.

### Firewall

A **firewall** decides whether traffic is allowed or denied based on rules. Firewalls may be host-based, network-based, cloud security groups, Kubernetes NetworkPolicy, or application firewalls. A firewall can drop silently or reject actively.

### Frame

A **frame** is the layer 2 unit placed on a local link, usually Ethernet. Switches forward frames using MAC addresses.

### Interface

An **interface** is a network attachment point. It may be physical, virtual, wireless, loopback, VLAN, tunnel, bridge, bond, or OVS internal interface.

### Latency

**Latency** is delay. It is usually measured as round-trip time with tools like \`ping\`, but application latency may include DNS, TCP setup, TLS negotiation, server processing, queues, and retries.

### MTU

**Maximum Transmission Unit** is the largest packet payload a link can carry without fragmentation. MTU mismatches are common in tunnels, VPNs, VXLAN, and cloud networks. Symptoms can include small pings working while large transfers fail.

### NAT

**Network Address Translation** rewrites source or destination addresses. Source NAT is common when many private hosts share one public IP. Destination NAT publishes an internal service behind another address or port.

### Packet

A **packet** is the layer 3 unit, usually IPv4 or IPv6. Routers forward packets using destination IP addresses and routing tables.

### Port

A **port** is a layer 4 number used by TCP or UDP. For example, HTTPS commonly uses TCP port 443. Ports let many applications share one IP address.

### Prefix

A **prefix** is the network portion of an IP route, such as \`192.168.10.0/24\`. Longer prefixes are more specific. Routing uses longest-prefix match.

### Protocol

A **protocol** is an agreed set of rules for communication. Ethernet, IP, TCP, UDP, DNS, HTTP, BGP, OSPF, VXLAN, and ARP are protocols.

### Route

A **route** tells a host or router where to send packets for a destination prefix. A route usually includes a destination network, next hop, output interface, metric, and sometimes source constraints.

### Socket

A **socket** is an endpoint for communication, commonly described by protocol, local IP, local port, remote IP, and remote port. \`ss -tupn\` on Linux and \`Get-NetTCPConnection\` on Windows reveal socket state.

### Subnet

A **subnet** is a smaller IP network carved from a larger one. Subnets control which hosts are local to each other and where routing boundaries exist.

### Switch

A **switch** forwards Ethernet frames inside a layer 2 network. It learns which MAC addresses are reachable through which ports.

### TCP

**Transmission Control Protocol** is connection-oriented. It uses a handshake, sequence numbers, acknowledgements, retransmissions, flow control, and congestion control. TCP is reliable from the application perspective, but it can still be slow or fail.

### UDP

**User Datagram Protocol** sends datagrams without TCP-style connection state or retransmission. DNS, DHCP, many VPNs, VoIP, streaming protocols, and QUIC use UDP.

### VLAN

A **Virtual LAN** separates layer 2 networks using tags, commonly IEEE 802.1Q. VLANs are not magic security by themselves; they must be combined with routing and firewall policy.

### VXLAN

**Virtual Extensible LAN** encapsulates layer 2 frames inside UDP packets, usually to build overlays across layer 3 networks. OpenStack tenant networks often use VXLAN.

## The complete mental model: every network problem is a path problem

When something cannot connect, write the path as a chain:

\`application -> socket -> local firewall -> local route -> local interface -> local switch/bridge -> gateway/router -> transit network -> destination firewall -> destination interface -> listening service -> application logs\`

Then test each link in the chain. Beginners often jump randomly between commands. Professionals move along the path and prove each assumption.

## Minimum lab evidence for every topic

For every topic in this academy, collect three kinds of proof:

1. **Configuration proof:** command output showing the intended setting.
2. **Traffic proof:** packet capture, connection test, or flow log showing real traffic.
3. **Failure proof:** intentionally break one setting and record the symptom.

Example for DNS:

- configuration proof: resolver address from \`resolvectl status\` or \`Get-DnsClientServerAddress\`;
- traffic proof: \`dig example.com\` plus a packet capture showing a DNS query and reply;
- failure proof: set a wrong resolver and capture timeout behavior.

## Certification bridge: what to add for common exams

### CompTIA Network+

Add more memorization of standards, cable types, wireless basics, troubleshooting scenarios, port numbers, network appliances, documentation, and security terminology. Use the official exam objective list as the checklist.

### Cisco CCNA

Add Cisco IOS configuration, VLAN trunking on switches, inter-VLAN routing, STP/RSTP, EtherChannel, OSPF, static routes, ACLs, NAT, wireless fundamentals, device management, and automation basics. This academy explains concepts, but CCNA requires Cisco-specific command practice.

### Linux networking exams

Add distribution-specific persistent config, systemd-networkd, NetworkManager profiles, nftables persistence, routing policy database, bonding, teaming, bridges, namespaces, and service troubleshooting.

### Cloud and DevOps exams

Add VPC/VNet design, security groups, NACLs, route tables, private endpoints, load balancers, DNS zones, VPNs, peering, transit gateways, Kubernetes services, ingress controllers, CNI behavior, and observability.

## DevOps bridge: how networking connects to daily work

DevOps engineers do not only configure routers. They debug delivery systems. Networking appears when:

- CI runners cannot reach artifact repositories;
- containers resolve names differently than hosts;
- Kubernetes pods cannot reach services;
- TLS certificates fail because DNS points to the wrong endpoint;
- cloud security groups allow health checks but block users;
- NAT gateways run out of ports;
- private subnets cannot reach package mirrors;
- OpenStack VMs boot but cannot receive DHCP;
- load balancers pass TCP but applications return HTTP errors;
- MTU issues break large responses across overlays or VPNs.

For each incident, identify source, destination, protocol, port, route, firewall, name resolution, identity, and application behavior.

## 60-hour curriculum at a glance

| Hours | Module | Main skills |
| --- | --- | --- |
| 1-3 | Foundations | OSI/TCP-IP model, packets, frames, ports, protocols |
| 4-6 | Addressing | IPv4, IPv6, CIDR, subnetting, default gateways |
| 7-9 | Ethernet and switching | MAC addresses, ARP/NDP, VLANs, trunks |
| 10-12 | Routing | Static routes, route tables, NAT, path selection |
| 13-15 | Linux basics | ip, ss, dig, tcpdump, NetworkManager, netplan |
| 16-18 | Linux services | DNS, DHCP, SSH, firewalling, forwarding |
| 19-21 | Windows basics | ipconfig, PowerShell networking cmdlets, DNS cache |
| 22-24 | Windows services | firewall rules, shares, RDP, troubleshooting |
| 25-27 | Packet analysis | Wireshark, tcpdump filters, TCP handshake, TLS clues |
| 28-30 | Virtualization | vNICs, NAT networks, host-only networks, bridges |
| 31-33 | Linux bridges | bridge command, VLAN-aware bridges, namespaces |
| 34-36 | Open vSwitch | OVS bridges, ports, bonds, trunks, patch ports |
| 37-39 | OpenStack overview | Keystone, Glance, Nova, Neutron, Horizon concepts |
| 40-42 | OpenStack networking | provider networks, tenant networks, routers, floating IPs |
| 43-45 | Neutron + OVS | agents, integration bridge, tunnel bridge, security groups |
| 46-48 | Containers | Docker bridge, container DNS, Kubernetes CNI concepts |
| 49-51 | Security | segmentation, least privilege, VPN basics, logging |
| 52-54 | Observability | metrics, logs, flow tracing, baselines |
| 55-57 | Troubleshooting | structured workflow and repeatable runbooks |
| 58-60 | Capstone | build, document, break, and repair a cloud lab network |

## Module 1 — Networking foundations (hours 1-3)

Networking is the art of moving data between processes on different machines. A browser does not send a web page directly to a server; it sends bytes into a stack of protocols. Each layer adds information that helps the next device make a decision.

### Concepts to master

- **Frame:** layer 2 unit used on a local link, usually Ethernet.
- **Packet:** layer 3 unit, usually IPv4 or IPv6.
- **Segment/datagram:** layer 4 unit, TCP segment or UDP datagram.
- **Port:** layer 4 number identifying an application endpoint.
- **Socket:** IP address plus port plus protocol.
- **Encapsulation:** wrapping application data in transport, network, and link headers.

### Practical lab

1. Open Wireshark and start a capture on your active interface.
2. Visit a simple website or run \`curl https://example.com\`.
3. Identify DNS, TCP, TLS, and HTTP-related packets.
4. Write down source IP, destination IP, source port, destination port, and protocol.

### Check yourself

- Can you explain the difference between a MAC address, an IP address, and a TCP port?
- Can you describe what changes when traffic leaves the local network through a router?
- Can you identify a DNS query and a TCP three-way handshake in a packet capture?

## Module 2 — IPv4, IPv6, CIDR, and subnetting (hours 4-6)

IP addressing tells hosts where they are and what destinations are local. CIDR notation combines an address and prefix length, such as \`192.168.10.25/24\` or \`2001:db8:10::25/64\`.

### IPv4 essentials

- \`/24\` means 24 network bits and 8 host bits.
- \`192.168.10.0/24\` normally spans \`192.168.10.1\` through \`192.168.10.254\` for hosts.
- Private ranges include \`10.0.0.0/8\`, \`172.16.0.0/12\`, and \`192.168.0.0/16\`.
- A default gateway is the router used when no more specific route matches.

### IPv6 essentials

- IPv6 uses 128-bit addresses and commonly uses \`/64\` LAN prefixes.
- Link-local addresses start with \`fe80::/10\` and are required for neighbor discovery.
- IPv6 does not rely on broadcast; it uses multicast and Neighbor Discovery Protocol.

### Subnetting drill

For each network, calculate network address, usable range, and broadcast address for IPv4:

- \`10.10.10.45/24\`
- \`10.10.10.45/26\`
- \`172.20.8.130/25\`
- \`192.168.50.200/28\`

## Module 3 — Ethernet, ARP, NDP, VLANs, and switching (hours 7-9)

Switches forward frames by learning MAC addresses on ports. If a destination MAC is unknown, a switch floods within the same VLAN. VLANs create separate layer 2 broadcast domains on shared hardware.

### Key ideas

- **Access port:** carries one untagged VLAN to an endpoint.
- **Trunk port:** carries multiple tagged VLANs between switches or virtualization hosts.
- **ARP:** resolves IPv4 addresses to MAC addresses.
- **NDP:** IPv6 neighbor discovery, router discovery, and duplicate address detection.
- **MTU:** maximum frame payload size; mismatches can cause strange failures.

### Lab commands on Linux

~~~bash
ip link show
ip neigh show
bridge link
bridge vlan show
sudo tcpdump -ni any arp or icmp6
~~~

### Windows equivalents

~~~powershell
Get-NetAdapter
Get-NetNeighbor
Get-NetIPConfiguration
arp -a
~~~

## Module 4 — Routing, NAT, and path selection (hours 10-12)

Routers move packets between networks. Hosts choose routes using longest prefix match: a \`/24\` route beats a \`/16\`, and both beat the default route \`0.0.0.0/0\` or \`::/0\`.

### Linux route inspection

~~~bash
ip route show
ip -6 route show
ip route get 8.8.8.8
traceroute 8.8.8.8
tracepath 8.8.8.8
~~~

### Windows route inspection

~~~powershell
Get-NetRoute
route print
Test-NetConnection 8.8.8.8 -TraceRoute
~~~

### NAT in plain language

Network Address Translation rewrites packet addresses, often allowing private hosts to share one public address. Source NAT is common for outbound internet access. Destination NAT or port forwarding publishes an internal service.

## Module 5 — Linux networking from the command line (hours 13-15)

Linux exposes networking through kernel interfaces, iproute2, service managers, and distribution-specific configuration layers.

### Daily commands

~~~bash
ip address show
ip link set dev eth0 up
sudo ip address add 192.168.56.10/24 dev eth0
sudo ip route add default via 192.168.56.1
ss -tulpn
resolvectl status
nmcli device status
journalctl -u NetworkManager --no-pager
~~~

### Netplan example on Ubuntu

~~~yaml
network:
  version: 2
  ethernets:
    ens18:
      addresses: [192.168.56.10/24]
      routes:
        - to: default
          via: 192.168.56.1
      nameservers:
        addresses: [1.1.1.1, 8.8.8.8]
~~~

Apply carefully with \`sudo netplan try\` so you can roll back if remote access breaks.

## Module 6 — Linux network services and firewalls (hours 16-18)

A useful administrator can configure services and prove that they are reachable only where intended.

### DNS troubleshooting

~~~bash
dig example.com
dig @1.1.1.1 example.com A
resolvectl query example.com
cat /etc/resolv.conf
~~~

### Listening sockets

~~~bash
ss -lntup
sudo lsof -i -P -n
curl -v http://127.0.0.1:8080
~~~

### nftables starter policy

~~~bash
sudo nft list ruleset
sudo nft add table inet filter
sudo nft add chain inet filter input '{ type filter hook input priority 0; policy drop; }'
sudo nft add rule inet filter input ct state established,related accept
sudo nft add rule inet filter input iif lo accept
sudo nft add rule inet filter input tcp dport 22 accept
~~~

## Module 7 — Windows networking essentials (hours 19-21)

Windows has excellent networking diagnostics through PowerShell. Learn these instead of relying only on graphical settings.

### Core PowerShell commands

~~~powershell
Get-NetAdapter
Get-NetIPConfiguration
Get-NetIPAddress
Get-DnsClientServerAddress
Resolve-DnsName example.com
Test-NetConnection example.com -Port 443
Get-NetTCPConnection | Sort-Object State,LocalPort
~~~

### Reset and cache commands

~~~powershell
ipconfig /all
ipconfig /flushdns
netsh winsock show catalog
netsh interface ipv4 show interfaces
~~~

## Module 8 — Windows services, firewalling, and sharing (hours 22-24)

Windows Defender Firewall profiles matter: Domain, Private, and Public can behave differently. A rule that works in a home lab may fail on a public profile.

### Firewall labs

~~~powershell
Get-NetFirewallProfile
Get-NetFirewallRule -Enabled True | Select-Object -First 20
New-NetFirewallRule -DisplayName "Allow Test Web 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
Remove-NetFirewallRule -DisplayName "Allow Test Web 8080"
~~~

### File sharing checks

~~~powershell
Get-SmbShare
Get-SmbConnection
Test-NetConnection fileserver.example.local -Port 445
~~~

## Module 9 — Packet analysis with tcpdump and Wireshark (hours 25-27)

Packet captures turn guessing into evidence. Capture as close as possible to the source and destination, compare both sides, and filter down from broad to specific.

### Useful tcpdump filters

~~~bash
sudo tcpdump -ni any host 10.0.0.10
sudo tcpdump -ni eth0 tcp port 443
sudo tcpdump -ni eth0 'icmp or arp'
sudo tcpdump -ni eth0 -w lab-capture.pcap
~~~

### What to look for

- DNS query with no response: resolver or network path problem.
- SYN retransmissions: service down, firewall drop, or routing failure.
- TCP reset: host actively rejected or application closed connection.
- TLS alert: connection path works but encryption or certificate negotiation failed.

## Module 10 — Virtual networking (hours 28-30)

Virtualization platforms create software switches and virtual NICs. Understand these modes:

- **NAT network:** VM can reach out; inbound access needs port forwarding.
- **Host-only network:** VM talks to host and other host-only VMs, not the internet by default.
- **Bridged network:** VM appears directly on the physical LAN.
- **Internal network:** isolated VM-to-VM segment.

Draw every lab. Include physical NICs, vNICs, virtual switches, IP subnets, gateways, and firewall boundaries.

## Module 11 — Linux bridges, VLANs, and namespaces (hours 31-33)

A Linux bridge is a software switch. Network namespaces are isolated network stacks. Together, they let you build labs without many VMs.

### Mini lab

~~~bash
sudo ip netns add red
sudo ip netns add blue
sudo ip link add br-lab type bridge
sudo ip link set br-lab up
sudo ip link add veth-red type veth peer name veth-red-br
sudo ip link add veth-blue type veth peer name veth-blue-br
sudo ip link set veth-red netns red
sudo ip link set veth-blue netns blue
sudo ip link set veth-red-br master br-lab
sudo ip link set veth-blue-br master br-lab
sudo ip link set veth-red-br up
sudo ip link set veth-blue-br up
sudo ip netns exec red ip addr add 10.50.0.10/24 dev veth-red
sudo ip netns exec blue ip addr add 10.50.0.20/24 dev veth-blue
sudo ip netns exec red ip link set lo up
sudo ip netns exec blue ip link set lo up
sudo ip netns exec red ip link set veth-red up
sudo ip netns exec blue ip link set veth-blue up
sudo ip netns exec red ping -c 3 10.50.0.20
~~~

## Module 12 — Open vSwitch from zero (hours 34-36)

Open vSwitch is a programmable virtual switch used in virtualization, OpenStack, Kubernetes integrations, and lab environments. It can behave like a normal switch, but it also supports flows, tunnels, mirrors, bonds, and external controllers.

### Core OVS commands

~~~bash
sudo ovs-vsctl show
sudo ovs-vsctl add-br br-lab
sudo ovs-vsctl add-port br-lab eth1
sudo ovs-vsctl list bridge
sudo ovs-vsctl list port
sudo ovs-ofctl show br-lab
sudo ovs-ofctl dump-flows br-lab
~~~

### OVS concepts

- **Bridge:** software switch instance.
- **Port:** logical connection point on a bridge.
- **Interface:** actual device backing a port.
- **Patch port:** virtual cable between OVS bridges.
- **Internal port:** creates a Linux interface owned by OVS.
- **Flow:** OpenFlow-style match and action rule.

### VLAN trunk example

~~~bash
sudo ovs-vsctl add-br br-trunk
sudo ovs-vsctl add-port br-trunk eth1 trunks=10,20,30
sudo ovs-vsctl add-port br-trunk vlan10 tag=10 -- set interface vlan10 type=internal
sudo ip addr add 10.10.10.2/24 dev vlan10
sudo ip link set vlan10 up
~~~

## Module 13 — OpenStack architecture (hours 37-39)

OpenStack is a cloud operating system built from services. Networking usually centers on Neutron.

### Main services

- **Keystone:** identity and tokens.
- **Glance:** image catalog.
- **Nova:** compute instances.
- **Neutron:** networking API and agents.
- **Cinder:** block storage.
- **Horizon:** web dashboard.
- **Placement:** resource inventory and scheduling support.

### Mental model

A user asks OpenStack for a VM attached to a network. Nova schedules the VM. Neutron prepares ports, security groups, DHCP, metadata access, routers, floating IPs, and the virtual switching path on the compute node.

## Module 14 — OpenStack Neutron networks (hours 40-42)

Neutron commonly exposes provider networks and self-service tenant networks.

### Provider network

A provider network maps closely to physical infrastructure. Instances can attach to a network that is directly connected to an external VLAN or flat network.

### Tenant network

A tenant network is usually isolated with VXLAN or another overlay. A Neutron router connects it to an external network, and floating IPs map inbound traffic to instances.

### OpenStack CLI flow

~~~bash
openstack network list
openstack subnet list
openstack router list
openstack security group list
openstack server list
openstack port list --server my-vm
~~~

## Module 15 — Neutron with Open vSwitch (hours 43-45)

In an OVS-based OpenStack deployment, several bridges may appear on network and compute nodes.

### Typical bridges

- **br-int:** integration bridge where VM tap ports connect.
- **br-tun:** tunnel bridge for VXLAN or GRE overlays.
- **br-ex:** external bridge connecting cloud routers or provider networks to the outside network.

### Troubleshooting path

1. Find the VM port in OpenStack: \`openstack port list --server VM_NAME\`.
2. Match Neutron port IDs to tap interfaces on the compute node.
3. Inspect OVS: \`ovs-vsctl show\` and \`ovs-ofctl dump-flows br-int\`.
4. Check Neutron agents: \`openstack network agent list\`.
5. Verify security groups and allowed address pairs.
6. Capture packets at the VM, tap, \`br-int\`, tunnel interface, router namespace, and external bridge.

## Module 16 — Containers and CNIs (hours 46-48)

Containers add another layer of virtual networking. Docker's default bridge uses veth pairs, a Linux bridge, iptables or nftables rules, and embedded DNS. Kubernetes delegates pod networking to CNI plugins.

### Docker checks

~~~bash
docker network ls
docker network inspect bridge
ip link show type veth
sudo iptables -t nat -S 2>/dev/null || sudo nft list ruleset
~~~

### Kubernetes CNI ideas

- Every pod gets an IP address.
- Services provide stable virtual IPs and load balancing.
- NetworkPolicy controls allowed pod-to-pod flows if the CNI supports it.
- Overlay CNIs encapsulate traffic; routed CNIs advertise pod routes.

## Module 17 — Security fundamentals (hours 49-51)

Security is not a product; it is a set of habits and controls.

### Practical controls

- Segment networks by trust and function.
- Deny inbound by default and allow only required ports.
- Prefer SSH keys and disable password logins where possible.
- Patch network-facing services quickly.
- Log authentication, firewall denies, DNS activity, and administrative changes.
- Use VPNs or bastion hosts for administrative access.
- Keep management interfaces off public networks.

## Module 18 — Observability and documentation (hours 52-54)

A network you cannot observe is a network you cannot operate.

### Build a baseline

- Normal latency between key hosts.
- Normal DNS response time.
- Expected open ports.
- Normal bandwidth usage.
- Known routes and gateway addresses.
- Diagrams for physical, logical, and cloud networking.

### Useful evidence bundle

When opening an incident or asking for help, collect:

- Problem statement and exact time window.
- Source, destination, port, protocol, and user impact.
- Recent changes.
- Interface addresses and routes.
- Firewall rules relevant to the flow.
- Packet capture or connection test output.

## Module 19 — Troubleshooting methodology (hours 55-57)

Use a repeatable workflow instead of random commands.

### The five-question workflow

1. What exactly is failing?
2. What changed recently?
3. Does name resolution work?
4. Does routing work in both directions?
5. Is a firewall, security group, ACL, or service binding blocking the flow?

### Layered checklist

- **Layer 1/2:** link up, correct VLAN, MAC learned, no MTU mismatch.
- **Layer 3:** correct IP, prefix, gateway, route, no overlapping subnet.
- **Layer 4:** port open, service listening, firewall permits.
- **Layer 7:** application logs, TLS, authentication, proxy settings.

## Module 20 — Capstone lab (hours 58-60)

Build a small cloud-style network and document it.

### Requirements

- One Linux router VM with two interfaces.
- One Linux server VM on an internal subnet.
- One Windows client VM on another subnet.
- Optional Open vSwitch bridge replacing the default virtual switch.
- Optional OpenStack all-in-one environment with one tenant network and one floating IP.

### Tasks

1. Draw the target design.
2. Assign subnets and gateways.
3. Configure Linux forwarding and firewall rules.
4. Configure Windows DNS and gateway settings.
5. Publish a test web service on Linux.
6. Prove access from Windows.
7. Block one flow with a firewall rule and capture the failure.
8. Restore access and write a troubleshooting report.

## Final zero-to-hero checklist

You are ready for real operational work when you can:

- Explain a packet's path from application to wire and back.
- Subnet IPv4 networks without a calculator for common prefixes.
- Read Linux and Windows routing tables.
- Configure and test DNS, gateways, and firewalls.
- Capture packets and explain what the capture proves.
- Build a Linux bridge and an Open vSwitch bridge.
- Describe OpenStack Neutron provider networks, tenant networks, routers, security groups, and floating IPs.
- Trace a VM packet through an OVS-backed OpenStack compute node.
- Produce diagrams and runbooks another administrator can follow.
`;

function ensureTag(db: Database.Database, name: string): number {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  db.prepare('INSERT OR IGNORE INTO tags (name, slug) VALUES (?, ?)').run(name, slug);
  return (db.prepare('SELECT id FROM tags WHERE slug = ?').get(slug) as { id: number }).id;
}

export function seedNetworkingTutorial(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM tutorials WHERE slug = ?').get(NETWORKING_TUTORIAL_SLUG);
  if (existing) return;

  const category = db.prepare("SELECT id FROM categories WHERE slug = 'networking'").get() as { id: number } | undefined;
  const result = db.prepare(
    `INSERT INTO tutorials
      (title, slug, summary, content, cover_image, category_id, difficulty, distribution,
       author, seo_title, seo_description, status, featured, published_at)
     VALUES (@title, @slug, @summary, @content, @cover_image, @category_id, @difficulty, @distribution,
       @author, @seo_title, @seo_description, @status, @featured, @published_at)`,
  ).run({
    title: 'Zero to Hero Networking Academy: Linux, Windows, OpenStack, and Open vSwitch',
    slug: NETWORKING_TUTORIAL_SLUG,
    summary: 'A definition-first networking academy and 60-hour lab roadmap covering fundamentals, Linux and Windows administration, virtualization, OpenStack Neutron, Open vSwitch, security, observability, troubleshooting, certification preparation, and DevOps readiness.',
    content: NETWORKING_TUTORIAL_CONTENT,
    cover_image: null,
    category_id: category?.id ?? null,
    difficulty: 'Beginner',
    distribution: 'General Linux',
    author: 'botera',
    seo_title: 'Zero to Hero Networking Academy: Linux, Windows, OpenStack, OVS',
    seo_description: 'Study a definition-first networking academy with a 60-hour lab roadmap for Linux, Windows, OpenStack Neutron, Open vSwitch, exams, DevOps, security, and troubleshooting.',
    status: 'published',
    featured: 1,
    published_at: '2026-06-22T00:00:00.000Z',
  });

  const tutorialId = Number(result.lastInsertRowid);
  const link = db.prepare('INSERT OR IGNORE INTO tutorial_tags (tutorial_id, tag_id) VALUES (?, ?)');
  for (const tag of ['Networking', 'Linux', 'Windows', 'OpenStack', 'Open vSwitch', 'Troubleshooting']) {
    link.run(tutorialId, ensureTag(db, tag));
  }
}
