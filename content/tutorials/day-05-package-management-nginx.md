==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 4.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 5: Package Management & Your First Web Server (Nginx)

URL SLUG:
linux-to-devops-day-5-package-management-nginx

SUMMARY:
Day 5 of the Linux-to-DevOps roadmap. Install and update software the right way
with apt, then put it all together to stand up your first real web server with
Nginx — serve a custom page, add a virtual host, test the config and read the
logs. About one hour, hands-on, with other-distro and Windows notes.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, apt, package-management, nginx, web-server, systemd, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
Ubuntu

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-5.svg

SEO TITLE:
Linux to DevOps — Day 5: apt & Your First Nginx Web Server (Beginner)

SEO DESCRIPTION:
Day 5 of the Linux-to-DevOps roadmap: install software with apt and stand up your
first Nginx web server — serve a page, add a virtual host, read logs. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 5** of the **Linux to DevOps Roadmap** — and to the moment the
series starts producing something real. So far you've learned to operate a Linux
system: files, text, permissions, processes and services. Today you'll **install
software properly** with a package manager, and then use everything from Days 1–4
to **stand up your first web server** and serve a page that a browser can load.

This is a genuine milestone. By the end of the hour you'll have done the core
thing servers exist to do — run a service that responds to requests — using the
exact tools and patterns professionals use in production.

> [!NOTE]
> About an hour with the lab. Do this on your practice VM or a cloud server (the
> web server part is most satisfying on a cloud box with a public IP). You'll use
> `sudo` throughout. Keep your `~/devops-lab` notes handy.

## Today's mission

- Understand what a **package manager** and a **repository** are.
- Install, update, search and remove software with **apt** (and know the
  equivalents on other distros).
- Keep a server patched and secure.
- Install **Nginx** and manage it as a service (Day 4 skills in action).
- Serve your **own page**, then add a second site with a **virtual host**.
- **Test** an Nginx config safely and read its **logs**.

## Part 1 — What is a package manager?

On Windows you often download an installer from a website. On Linux you almost
never do that — and that's a feature, not a limitation. Instead, software comes
from **repositories**: trusted, curated servers maintained by your distribution.
A **package manager** downloads software from those repositories, installs it
along with everything it depends on, and lets you update or remove it cleanly
later.

Why this matters for DevOps:

- **Trust & security** — packages are signed and come from vetted sources, not
  random websites.
- **Dependencies handled for you** — install one thing and the manager pulls in
  whatever else it needs.
- **Repeatable** — the same `apt install` command sets up the same software on
  every server, which is the seed of automation.

On Debian and Ubuntu the package manager is **apt** (working with `.deb`
packages). That's what we'll use.

## Part 2 — apt: the essentials

Two commands you'll run constantly, and they are **not** the same thing:

```bash
sudo apt update      # refresh the list of available packages (does NOT install)
sudo apt upgrade     # actually install newer versions of what you have
```

> [!IMPORTANT]
> `apt update` only **refreshes the catalogue** of what's available; `apt
> upgrade` **installs** the updates. Always run `update` before `install` or
> `upgrade`, otherwise apt may look for a package version it doesn't know about
> yet. The habit to memorise: **`sudo apt update && sudo apt upgrade`**.

Installing, inspecting and removing software:

```bash
sudo apt install htop tree curl      # install one or more packages
apt search nginx                     # find packages by keyword
apt show nginx                       # details about a package
apt list --installed | wc -l         # how many packages are installed
sudo apt remove htop                 # remove a package (keeps its config files)
sudo apt purge htop                  # remove a package AND its config files
sudo apt autoremove                  # clean up dependencies nothing needs anymore
```

Under apt sits the lower-level tool **dpkg**, handy for inspecting `.deb`
packages:

```bash
dpkg -l | grep nginx        # is it installed, and which version?
dpkg -L nginx               # list every file the nginx package installed
dpkg -S /usr/sbin/nginx     # which package does this file belong to?
```

### Other distributions (so you're never lost)

The *ideas* are identical everywhere; only the command changes. Keep this table
for the day you meet a non-Ubuntu box:

| Distro family | Install | Update everything | Search |
|---------------|---------|-------------------|--------|
| Debian / Ubuntu | `apt install X` | `apt update && apt upgrade` | `apt search X` |
| Fedora / RHEL / Rocky | `dnf install X` | `dnf upgrade` | `dnf search X` |
| Arch | `pacman -S X` | `pacman -Syu` | `pacman -Ss X` |
| openSUSE | `zypper install X` | `zypper update` | `zypper search X` |

## Part 3 — Keeping a server patched

Security updates are the cheapest, highest-impact thing you can do for a server.
On a fresh box, the very first command an engineer runs is:

```bash
sudo apt update && sudo apt upgrade -y
```

For unattended security patches on Ubuntu, the `unattended-upgrades` package can
apply them automatically:

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades   # enable automatic security updates
```

> [!TIP]
> Updating is safe and routine, but on a **production** server schedule it for a
> maintenance window and know how to reboot if a kernel update requires it
> (`sudo reboot`). For your lab, just run it whenever.

## Part 4 — Install your first web server: Nginx

**Nginx** ("engine-x") is one of the most popular web servers in the world — it
serves static files, and acts as a reverse proxy in front of applications (you'll
do that later in the roadmap). Install it:

```bash
sudo apt update
sudo apt install -y nginx
```

Now use your Day 4 skills to run it as a service:

```bash
sudo systemctl enable --now nginx     # start now AND on every boot
systemctl status nginx                # should be "active (running)" — press q
```

Verify it's actually serving, right from the command line:

```bash
curl -I http://localhost              # expect: HTTP/1.1 200 OK, Server: nginx
```

If you're on a **cloud server**, open a browser to `http://YOUR_SERVER_IP` and
you'll see the default "Welcome to nginx!" page. If it doesn't load, the firewall
is probably blocking port 80 — allow it (we'll cover firewalls properly on Day 7):

```bash
sudo ufw allow 'Nginx HTTP'   # only if ufw is active
sudo ufw status
```

> [!NOTE]
> Cloud providers also have their own network firewall ("security group"). If the
> page still won't load, make sure **port 80** is allowed there too. "It works
> with `curl localhost` on the server but not from my browser" almost always
> means a firewall is blocking the port.

## Part 5 — Serve your own page

Nginx serves files from a **document root**. The default on Ubuntu is
`/var/www/html`. Replace the welcome page with your own:

```bash
echo "<h1>Hello from botera — my first server!</h1>" | sudo tee /var/www/html/index.html
curl http://localhost
```

Refresh your browser — your page is live. You are now officially running a web
server. Let's make it more like the real world.

## Part 6 — Add a real site with a virtual host

Real servers host one or more sites, each described by a **server block** (Nginx's
term for a virtual host). Ubuntu organises these with two folders:

- `/etc/nginx/sites-available/` — all the site configs you've written.
- `/etc/nginx/sites-enabled/` — symlinks to the ones that are actually switched on.

Create a document root and a page for a new site:

```bash
sudo mkdir -p /var/www/mysite
echo "<h1>mysite is alive</h1>" | sudo tee /var/www/mysite/index.html
```

Write the server block:

```nginx
# /etc/nginx/sites-available/mysite
server {
    listen 80;
    server_name mysite.local;          # the hostname this site answers to
    root /var/www/mysite;              # where the files live
    index index.html;

    location / {
        try_files $uri $uri/ =404;     # serve the file, or return 404
    }
}
```

Enable it by symlinking into `sites-enabled`, then **test the config before
reloading** — this step saves you from outages:

```bash
sudo ln -s /etc/nginx/sites-available/mysite /etc/nginx/sites-enabled/
sudo nginx -t                          # validates the configuration
sudo systemctl reload nginx            # apply changes with zero downtime
```

> [!IMPORTANT]
> **Always run `sudo nginx -t` before reloading.** It checks your configuration
> for syntax errors. If you `reload` (or `restart`) with a broken config, Nginx
> can fail to start and take your sites offline. `nginx -t` then `reload` is a
> reflex every professional has — make it yours.

Because `mysite.local` isn't real DNS, test it by faking the hostname locally:

```bash
curl -H "Host: mysite.local" http://localhost
# -> <h1>mysite is alive</h1>
```

(On a real deployment you'd point a domain's DNS at the server instead — that's
Day 6's territory, and exactly how botera.md itself is served.)

## Part 7 — Read the logs

When something's wrong with a site, the logs tell you why. Nginx writes two:

```bash
sudo tail -f /var/log/nginx/access.log    # every request that comes in
sudo tail -f /var/log/nginx/error.log     # problems: bad config, missing files, permission denied
```

Open your site in a browser or run `curl` and watch the access log light up in
real time. And because Nginx runs under systemd, you can also use Day 4's tool:

```bash
journalctl -u nginx --since "10 min ago"
```

Reading access and error logs is a daily DevOps habit — it's how you spot errors,
attacks, and which pages people actually visit.

## Hands-on lab: install, serve, host, verify

```bash
# 1. Update and install
sudo apt update && sudo apt install -y nginx curl

# 2. Run it as a service and confirm
sudo systemctl enable --now nginx
curl -I http://localhost              # HTTP/1.1 200 OK

# 3. Replace the default page
echo "<h1>botera lab — homepage</h1>" | sudo tee /var/www/html/index.html
curl http://localhost

# 4. Create a second site (virtual host)
sudo mkdir -p /var/www/lab2
echo "<h1>second site works</h1>" | sudo tee /var/www/lab2/index.html
sudo tee /etc/nginx/sites-available/lab2 > /dev/null <<'EOF'
server {
    listen 80;
    server_name lab2.local;
    root /var/www/lab2;
    index index.html;
    location / { try_files $uri $uri/ =404; }
}
EOF

# 5. Enable, test, reload
sudo ln -s /etc/nginx/sites-available/lab2 /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 6. Verify both the default site and the virtual host
curl http://localhost
curl -H "Host: lab2.local" http://localhost

# 7. Watch the access log while you curl again (Ctrl+C to stop)
sudo tail -f /var/log/nginx/access.log

# 8. Clean up the second site when done
sudo rm /etc/nginx/sites-enabled/lab2 /etc/nginx/sites-available/lab2
sudo rm -r /var/www/lab2
sudo nginx -t && sudo systemctl reload nginx
```

If step 6 returns both pages — the default homepage and "second site works" via
the `Host` header — **you've hosted multiple sites on one server**, the same
pattern that powers shared hosting and multi-app servers everywhere.

## For Windows people

Windows installs software with package managers too — **winget** (built in) or
**Chocolatey** — and its web server is **IIS**.

```powershell
# Package management (winget is built into Windows 10/11)
winget search nginx
winget install nginx
winget upgrade --all          # like apt upgrade

# Web server: enable IIS (PowerShell as Administrator)
Enable-WindowsOptionalFeature -Online -FeatureName IIS-WebServerRole
# Then browse to http://localhost — IIS serves from C:\inetpub\wwwroot
```

> [!NOTE]
> Concept map: **apt** ≈ **winget/choco**; a **repository** ≈ a winget/choco
> **source**; **Nginx** ≈ **IIS**; the **document root** `/var/www/html` ≈
> `C:\inetpub\wwwroot`. Same roles, different tools. In real DevOps, Linux + Nginx
> is by far the most common combination for web workloads.

## Common mistakes to avoid

- **`apt upgrade` without `apt update` first** — apt won't know about the newest
  versions. Always update first.
- **Reloading Nginx without `nginx -t`** — a typo in a config can take every site
  offline. Test, then reload.
- **Forgetting to reload after editing config** — your change does nothing until
  `systemctl reload nginx`.
- **Editing the wrong document root** — confirm with the `root` line in the server
  block and `curl` the result.
- **Port 80 blocked** — if `curl localhost` works on the box but the browser
  doesn't, it's the firewall (server `ufw` and/or the cloud security group).
- **`apt remove` vs `apt purge`** — `remove` leaves config files behind; use
  `purge` for a clean removal.

## Recap — what you learned today

- Software comes from trusted **repositories** via a **package manager**.
- **apt**: `update` (refresh catalogue) then `upgrade`/`install`; `remove`/`purge`
  to uninstall; `dpkg` to inspect. Other distros use `dnf`/`pacman`/`zypper`.
- Keep servers patched (`apt update && apt upgrade`); consider automatic security
  updates.
- Install **Nginx**, run it as a **service** (`enable --now`), verify with `curl`.
- Serve your own page from the **document root**, and host extra sites with
  **server blocks** in `sites-available` / `sites-enabled`.
- **`nginx -t` before every reload**; read `access.log` and `error.log`.

## Homework (15–20 minutes)

1. Install `tree` and `htop` with one `apt install`, then `apt show tree`.
2. Run `apt update && apt upgrade` and note how many packages were upgraded.
3. Change the default Nginx page to your own HTML, including an `<h2>` and a list.
4. Create a virtual host `blog.local` serving `/var/www/blog`, enable it, run
   `nginx -t`, reload, and verify with `curl -H "Host: blog.local" localhost`.
5. Break the config on purpose (delete a `}`), run `nginx -t`, read the error,
   then fix it. (This builds the habit that saves you in production.)
6. `tail -f` the access log while you reload your browser a few times.

## Common questions

**apt vs apt-get — which should I use?**
Use `apt` for interactive work (nicer output, progress bars). `apt-get` is the
older, script-stable interface you'll see in automation and Dockerfiles. They
overlap heavily; both are fine.

**Where does Nginx keep its config?**
Main file: `/etc/nginx/nginx.conf`. Per-site server blocks live in
`/etc/nginx/sites-available/` and are switched on via symlinks in
`/etc/nginx/sites-enabled/`.

**reload vs restart for Nginx?**
`reload` re-reads the config without dropping active connections — prefer it for
config changes. `restart` fully stops and starts the service (brief downtime);
use it when `reload` isn't enough.

**Do I need Apache instead of Nginx?**
Either can serve web content. Nginx is lighter and the de facto choice for modern
deployments and reverse proxying, which is why we use it. The concepts transfer.

## What's next — Day 6

On **Day 6** we connect your server to the world: **networking fundamentals** —
IP addresses, ports, DNS (how `botera.md` becomes an IP), and the tools to
inspect them (`ip`, `ss`, `ping`, `dig`, `curl`). Then we go deep on **SSH**: key
-based login, config, and copying files with `scp`/`rsync` — the secure way you'll
reach every server from now on.

Phenomenal milestone today — you installed software and ran a real web server.
Rebuild the virtual-host lab from memory, then take a screenshot of your page;
you earned it.
