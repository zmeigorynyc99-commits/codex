# Lesson 7: Networking foundations, OSI model, TCP/IP model, packets, frames, ports, and protocols

- **Current level:** beginner
- **Estimated study time:** 4-6 hours
- **Estimated practical-lab time:** 2-3 hours

## Learning objectives
After this lesson you will be able to explain layered networking, ethernet, ip, tcp, udp, ports, clients, servers, and protocols, verify your environment, run safe commands, read command output, document findings in `botera.md`, and apply a structured troubleshooting process. You will also improve the continuous Botera learning website project used throughout the course.

## Prerequisites
- **Previous lessons required:** Lessons 1 through 6.
- **Required software:** a computer with a terminal; Docker Desktop or Docker Engine for running the course website; a text editor such as VS Code or nano. Verify Docker with `docker --version` and verify a shell with `echo $SHELL`.
- **Required permissions:** normal user access; some optional Linux administration commands require `sudo`. Always verify with `sudo -l` before assuming access.
- **Hardware/resources:** 2 CPU cores, 4 GB RAM, and 5 GB free disk are enough for these beginner labs. Check disk with `df -h` and memory with `free -h` on Linux.
- **Accounts:** no cloud account is required yet. GitHub is introduced in Lesson 10.

## Detailed theory
### System
**What it means:** system is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses system to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Server
**What it means:** server is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses server to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Client
**What it means:** client is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses client to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Terminal
**What it means:** terminal is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses terminal to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Shell
**What it means:** shell is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses shell to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Command
**What it means:** command is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses command to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Argument
**What it means:** argument is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses argument to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Option/Flag
**What it means:** option/flag is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses option/flag to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Standard Output
**What it means:** standard output is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses standard output to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Standard Error
**What it means:** standard error is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses standard error to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Exit Code
**What it means:** exit code is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses exit code to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Configuration File
**What it means:** configuration file is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses configuration file to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Log File
**What it means:** log file is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses log file to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Least Privilege
**What it means:** least privilege is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses least privilege to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.
### Environment
**What it means:** environment is a basic building block engineers use to describe computing work. **Why it exists:** it gives teams a shared word for diagnosing and automating systems. **Problem solved:** without this concept, engineers guess instead of measuring. **How it works:** it connects user intent, operating-system behavior, network communication, and application configuration. **When/where used:** real companies use it during deployments, incidents, audits, and design reviews. **Advantages:** repeatable communication and safer operations. **Disadvantages/limitations:** the term alone is not enough; you must confirm facts with commands and logs. **Connection:** this lesson uses environment to build toward Linux, networking, Git, containers, CI/CD, and cloud infrastructure.

In this lesson the central topic is **Layered networking, Ethernet, IP, TCP, UDP, ports, clients, servers, and protocols**. We start from first principles: engineers operate systems for users. DevOps focuses on reliable software delivery, automation, feedback, and collaboration. Network engineering focuses on moving data safely and predictably between devices and services. Senior engineers combine both disciplines: they understand servers, applications, packets, security, change control, observability, and business risk.

## Explanation of every utility and command
### `ip addr show`
- **Utility:** `ip` is the program being executed.
- **Arguments/options:** the remaining words narrow what the utility should inspect or change.
- **Why used:** it provides observable evidence instead of assumptions.
- **Output:** names, paths, addresses, statuses, or errors may differ on your system.
- **Professional use:** engineers run this during verification, troubleshooting, documentation, or automation.
- **Common diagnoses:** wrong directory, missing package, stopped service, bad permission, unavailable network path, or incorrect Git state.
### `ip route show`
- **Utility:** `ip` is the program being executed.
- **Arguments/options:** the remaining words narrow what the utility should inspect or change.
- **Why used:** it provides observable evidence instead of assumptions.
- **Output:** names, paths, addresses, statuses, or errors may differ on your system.
- **Professional use:** engineers run this during verification, troubleshooting, documentation, or automation.
- **Common diagnoses:** wrong directory, missing package, stopped service, bad permission, unavailable network path, or incorrect Git state.
### `ss -tulpen`
- **Utility:** `ss` is the program being executed.
- **Arguments/options:** the remaining words narrow what the utility should inspect or change.
- **Why used:** it provides observable evidence instead of assumptions.
- **Output:** names, paths, addresses, statuses, or errors may differ on your system.
- **Professional use:** engineers run this during verification, troubleshooting, documentation, or automation.
- **Common diagnoses:** wrong directory, missing package, stopped service, bad permission, unavailable network path, or incorrect Git state.
### `curl -I`
- **Utility:** `curl` is the program being executed.
- **Arguments/options:** the remaining words narrow what the utility should inspect or change.
- **Why used:** it provides observable evidence instead of assumptions.
- **Output:** names, paths, addresses, statuses, or errors may differ on your system.
- **Professional use:** engineers run this during verification, troubleshooting, documentation, or automation.
- **Common diagnoses:** wrong directory, missing package, stopped service, bad permission, unavailable network path, or incorrect Git state.
### `nc -vz`
- **Utility:** `nc` is the program being executed.
- **Arguments/options:** the remaining words narrow what the utility should inspect or change.
- **Why used:** it provides observable evidence instead of assumptions.
- **Output:** names, paths, addresses, statuses, or errors may differ on your system.
- **Professional use:** engineers run this during verification, troubleshooting, documentation, or automation.
- **Common diagnoses:** wrong directory, missing package, stopped service, bad permission, unavailable network path, or incorrect Git state.

## Expected output
```text
$ pwd
/home/student/botera-course
$ whoami
student
$ uname -a
Linux lab 6.8.0-xx-generic x86_64 GNU/Linux
```
Line by line: `pwd` prints the current directory; `whoami` prints the effective username; `uname -a` prints kernel and architecture details. Values such as usernames, interface names, container IDs, IP addresses, and paths may differ between systems.

## Real-world company scenario
**Scenario:** An application listens on the wrong port and users report connection refused.
A professional engineer does not immediately change random settings. They confirm the problem, collect evidence, check recent changes, form one hypothesis, test it, apply the smallest safe fix, verify recovery, and document the result in the ticket and runbook. For this lesson, the likely evidence includes command output, logs, configuration files, ownership records, and network reachability tests.

## Simple practical example
Create a lesson note:
```bash
mkdir -p ~/botera-course/lesson-07
cd ~/botera-course/lesson-07
printf '# Lesson 7 notes\nStatus: started\n' > botera.md
cat botera.md
```
Expected output shows the heading and status. `mkdir -p` creates parent directories safely, `cd` changes location, `printf` writes predictable text, and `cat` displays the file for verification.

## Realistic sample project
The continuous project is the **Botera DevOps and Network Engineering Course Website**. In this lesson, add or update `botera.md` with a short operational note for lesson 7. The website reads course Markdown from the repository, so documentation becomes part of the product. In real teams, this pattern becomes a runbook or internal developer portal.

## Guided practical lab
**Lab scenario:** You are onboarding to a company and must prove you can perform lesson 7 tasks safely.
**Goal:** create a clean lab workspace, capture evidence, verify output, and clean up.
**Required environment:** Linux, macOS, WSL, or the provided Docker course container.
**Directory structure:** `labs/lesson-07/README.md` plus your local `~/botera-course/lesson-07` workspace.
**Files to create:** `botera.md` and `evidence.txt`.
```bash
mkdir -p ~/botera-course/lesson-07
cd ~/botera-course/lesson-07
printf 'lesson=7\nstatus=lab-started\n' > evidence.txt
printf '# Botera lesson 7 lab\n\nEvidence recorded.\n' > botera.md
cat evidence.txt
cat botera.md
```
**Expected output:** the two files print exactly the text you wrote.
**Verification:** run `test -f botera.md && test -f evidence.txt && echo OK`.
**Cleanup:** `cd ~ && rm -rf ~/botera-course/lesson-07` if you want to remove the lab.
**What happened internally:** the shell asked the kernel to create directories and files, then read file contents back from the filesystem.

## Independent exercise
**Scenario:** A teammate needs repeatable notes for lesson 7.
**Goal:** create `~/botera-course/exercise-07/botera.md` with a heading, date, three facts learned, and one open question.
**Requirements:** use the terminal only; verify the file exists; do not use `sudo`; do not delete other directories.
**Expected result:** a readable Markdown note.
**Verification criteria:** `test -s ~/botera-course/exercise-07/botera.md && echo complete`.

## Complete exercise solution
```bash
mkdir -p ~/botera-course/exercise-07
cd ~/botera-course/exercise-07
cat > botera.md <<'EOF'
# Lesson 7 independent exercise

Date: $(date +%F)

## Three facts learned
1. Commands should be verified with output.
2. Documentation belongs with engineering work.
3. Safe labs avoid unnecessary root access.

## Open question
What should I practice next?
EOF
test -s botera.md && echo complete
```
The selected solution is recommended because it is simple, repeatable, and avoids privileged operations. An alternative is using a graphical editor, but terminal practice is more valuable for DevOps work.

## Troubleshooting exercise
**Symptoms:** `cat botera.md` returns `No such file or directory`.
**Diagnostic process:** confirm with `pwd`; collect information with `ls -la`; check recent changes such as a wrong `cd`; hypothesize that the file was created in another directory; test with `find ~/botera-course -name botera.md`; apply the fix by changing to the correct directory or recreating the file; verify with `cat`; document the result.
**Questions:** What directory are you in? Does the file exist? Was the filename spelled exactly the same?
**Complete solution:** run `pwd`, then `find ~/botera-course -name botera.md -print`, then `cd` into the directory shown or recreate the file. **Root cause:** path confusion. **Prevention:** always run `pwd` before editing important files and use tab completion.

## Common mistakes
- Running commands from the wrong directory: causes missing-file errors; identify with `pwd`; fix with `cd`; prevent by checking location.
- Copying prompts such as `$`: causes `command not found`; identify by reading the error; fix by copying only the command; prevent by understanding shell prompts.
- Using `sudo` unnecessarily: can create root-owned files; identify with `ls -l`; fix ownership carefully; prevent by applying least privilege.
- Ignoring output: hides failures; identify by checking exit codes with `echo $?`; fix the first error before continuing.

## Security considerations
Use least privilege. Do not commit passwords, tokens, SSH private keys, cloud credentials, VPN profiles, or customer data. Treat logs as sensitive because they may contain hostnames, IPs, usernames, or request data. Avoid destructive commands such as `rm -rf /`. In production, test changes in lower environments, use peer review, and keep rollback plans.

## Professional best practices
- **Learning:** small local labs and visible output.
- **Development:** repeatable scripts and documentation.
- **Testing:** automated checks before merge.
- **Staging:** production-like validation.
- **Production:** change windows, monitoring, backups, approvals, and rollback.
Simple learning shortcuts are acceptable only when risk is low; production needs security, observability, auditability, and reliability.

## Knowledge check
### Questions
1. What problem does DevOps solve?
2. Why do engineers verify output?
3. What is least privilege?
4. Why are logs useful?
5. What is a command argument?
6. What is a shell?
7. Why document commands?
8. What is an environment?
9. Why avoid real secrets in Git?
10. What is a rollback?
11. Interpret `No such file or directory`.
12. Interpret permission denied.
13. Interpret connection refused.
14. Which command shows current directory?
15. Which command displays a file?
16. A service fails after a change; what is your first step?
17. Users report slowness; what evidence do you collect?
18. DNS is wrong; what do you compare?
### Answers
1. It improves software delivery through collaboration, automation, and feedback. 2. Output proves reality. 3. Grant only required access. 4. Logs preserve event evidence. 5. A value passed to a command. 6. A command interpreter. 7. To make work repeatable. 8. A place where software runs. 9. Git history is durable and widely copied. 10. A planned return to a known-good state. 11. Wrong path or absent file. 12. Insufficient access or ownership. 13. Nothing is listening or a firewall rejected it. 14. `pwd`. 15. `cat`. 16. Confirm and collect evidence. 17. CPU, memory, disk, network, logs, recent changes. 18. Expected records, actual resolver output, and authoritative data.

## Homework
Research one term from this lesson, run each listed command twice, create `homework/lesson-07-notes.md`, intentionally cause and fix one safe error, and add one improvement idea for the Botera project. Completion criteria: your note contains command output, one troubleshooting story, and verification steps. Verify with `test -s homework/lesson-07-notes.md`.

## Interview preparation
**Questions:** Explain DevOps to a beginner; describe a safe troubleshooting process; explain why production changes need review. **Practical task:** create a directory, write a Markdown note, verify it, and explain each command. **Scenario:** a deployment fails; collect logs, recent commits, service status, and rollback options. **Terminology:** command, shell, log, environment, least privilege, rollback. **Common incorrect answers:** 'restart everything first' is wrong because it destroys evidence; 'use root for convenience' is wrong because it increases blast radius.

## Lesson summary
You learned layered networking, ethernet, ip, tcp, udp, ports, clients, servers, and protocols, practiced commands including `ip addr show`, `ip route show`, `ss -tulpen`, `curl -I`, `nc -vz`, created files, verified output, studied common errors, and connected beginner practice to production best practices.

## Connection to the next lesson
This lesson prepares you for **IPv4 addressing, subnet masks, CIDR, private networks, public networks, and subnetting** by giving you vocabulary, safe command habits, and documentation discipline that the next topic depends on.
