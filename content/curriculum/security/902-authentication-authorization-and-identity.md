---
title: "Security — Authentication, Authorization & Identity"
slug: "security-authentication-authorization-and-identity"
track: "security"
trackName: "Security & Defensive Operations"
module: "Security Foundations"
order: 902
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Security"
tags: [security, authentication, authorization, mfa, identity, rbac, oauth]
cover: "/covers/curriculum/security.svg"
estMinutes: 55
status: "published"
summary: "Identity is the new perimeter. Master authentication vs authorization, password hashing (bcrypt/argon2) vs encryption, MFA and the factor types, sessions/tokens/JWT, SSO with OAuth/OIDC/SAML at a high level, and access-control models RBAC and ABAC."
seoTitle: "Security 2: Authentication, Authorization, MFA & Identity"
seoDescription: "AuthN vs AuthZ, password hashing (bcrypt/argon2), MFA factors, sessions vs tokens/JWT, SSO (OAuth/OIDC/SAML), and RBAC/ABAC access control. Lab and assessment."
---

In modern infrastructure, **identity is the perimeter** — most breaches start with a
stolen or weak credential, not a kicked-in firewall. This lesson separates the two ideas
people constantly conflate — **authentication** (proving *who* you are) and
**authorization** (deciding *what* you may do) — then covers how to store credentials
safely (**hashing**, not encryption), **multi-factor authentication**, how sessions and
**tokens** keep you logged in, **SSO** (OAuth/OIDC/SAML), and the access-control models
**RBAC** and **ABAC**.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **authentication** from **authorization**.
- Explain why passwords are **hashed** (bcrypt/argon2), not encrypted, and the role of
  **salt**.
- Describe the **factor types** and why **MFA** matters.
- Compare **session cookies** vs **tokens/JWT**.
- Explain **SSO** (OAuth2/OIDC vs SAML) and **RBAC vs ABAC** at a high level.

## Part 1 — AuthN vs AuthZ

- **Authentication (AuthN)** — *who are you?* You prove identity (password + MFA, a
  certificate, a token).
- **Authorization (AuthZ)** — *what are you allowed to do?* The system checks your
  permissions for each action.

They run in that order and are **separate**: a valid login (authenticated) does **not**
mean you may delete another user's data (authorization). A huge class of bugs — **broken
access control** (OWASP #1) — is authorization done wrong even when authentication is
fine: e.g. changing `?id=123` to `?id=124` and seeing someone else's record (IDOR).

## Part 2 — Storing credentials: hash, don't encrypt

You must verify passwords **without ever being able to recover them**. So you don't
encrypt (reversible) — you **hash** with a slow, salted password hash:

```text
register:  store  salt + hash = argon2id(password, salt, cost)
login:     recompute hash from the entered password + stored salt; compare
```

- **Hashing is one-way** — you can verify a guess but not reverse the stored value.
- **Salt** — a unique random value per password, stored alongside the hash. Defeats
  precomputed **rainbow tables** and ensures two identical passwords hash differently.
- Use a **purpose-built, slow** algorithm: **argon2id** (preferred), **bcrypt**, or
  **scrypt** — tunable "work factor" so brute force is expensive. **Never** MD5/SHA-1/
  plain SHA-256 for passwords (too fast).
- **Pepper** (optional) — a secret added from outside the database, so a DB-only leak
  isn't enough.

> [!IMPORTANT]
> **Encryption is reversible; password storage must not be.** Encrypt and an attacker who
> steals the key gets every password. **Hash with argon2id/bcrypt + a unique salt**, tune
> the cost so each guess is slow, and you verify logins while making a stolen database
> hugely expensive to crack. If you ever see passwords that can be "decrypted," that's a
> critical finding.

## Part 3 — Multi-factor authentication (MFA)

Factors are categories of proof — combine **different** categories:

| Factor type | Examples |
|---|---|
| **Something you know** | password, PIN, security question |
| **Something you have** | phone (TOTP app), hardware key (FIDO2/YubiKey), smart card |
| **Something you are** | fingerprint, face, iris (biometric) |
| *(context)* | location, device — used for risk-based/adaptive auth |

**MFA = two or more factors of *different* types.** Two passwords is **not** MFA. Strength
order, roughly: **phishing-resistant hardware keys (FIDO2/WebAuthn) > TOTP authenticator
app > push approval > SMS** (SMS is phishable/SIM-swappable — better than nothing, not
ideal). MFA stops the overwhelming majority of credential-stuffing and phishing takeovers.

> [!TIP]
> Prioritize **phishing-resistant MFA** (FIDO2/WebAuthn security keys or passkeys) for
> admins and high-value accounts — they cryptographically bind to the real site, so a
> phishing page can't relay the login. Where that's not possible, a **TOTP app** beats
> SMS. Enforcing MFA is the single highest-ROI control against account takeover.

## Part 4 — Sessions and tokens

After login, the server must remember you across requests (HTTP is stateless):

- **Session cookies (stateful)** — server stores session state; the client holds an opaque
  session ID in a cookie. Easy to **revoke** (delete server-side). Cookie flags matter:
  **`HttpOnly`** (no JS access), **`Secure`** (HTTPS only), **`SameSite`** (CSRF defense).
- **Tokens / JWT (stateless)** — a signed token (e.g. JWT) carries claims (user, roles,
  expiry); the server verifies the **signature** without a lookup. Scales well, but
  **hard to revoke** before expiry — keep access tokens **short-lived** and pair with a
  **refresh token**. Never put secrets in a JWT payload (it's only base64, not encrypted).

```text
Cookie session:  [SessionID] -> server store -> user   (revocable, stateful)
JWT:             [header.payload.signature]  self-contained, verified by signature
```

## Part 5 — SSO and access-control models

**Single Sign-On (SSO)** lets one identity provider (IdP) authenticate you to many apps:

- **OAuth 2.0** — *authorization* framework (delegated access; "let app X read my calendar").
- **OIDC (OpenID Connect)** — *authentication* layer on top of OAuth2 (adds an **ID
  token**); the modern choice for "log in with…" .
- **SAML** — XML-based SSO, common in enterprise/B2B and legacy apps.

**Access-control models** decide AuthZ:

- **RBAC (Role-Based)** — permissions attach to **roles**; users get roles (admin, editor,
  viewer). Simple, auditable, the common default.
- **ABAC (Attribute-Based)** — decisions from **attributes/policy** (user dept + resource
  tag + time + location). Flexible, fine-grained, more complex.
- Others: **MAC** (mandatory, label-based — high-security/military), **DAC**
  (discretionary — owners grant access, e.g. file permissions).

## Hands-on lab

```bash
# 1. See a SLOW, salted password hash (bcrypt) — note salt + cost are embedded
htpasswd -bnBC 12 "" 'CorrectHorse' | tr -d ':\n'; echo
#   $2y$12$...salt+hash...   (run twice: same password -> DIFFERENT hash, thanks to salt)

# 2. Compare: a FAST general hash (do NOT use for passwords)
echo -n 'CorrectHorse' | sha256sum     # instant, unsalted -> rainbow-table fodder

# 3. Inspect a JWT (header.payload are just base64 — NOT encrypted)
TOKEN='eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.sig'
echo "$TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null; echo
#   -> {"sub":"123","role":"admin"}   (so never trust an UNVERIFIED token's claims)

# 4. Set up a TOTP secret mentally: an authenticator app + server share a secret,
#    both compute a 6-digit code from secret + current 30s time window.
```

```text
5. Design exercise — for the lab app from Lesson 901:
   - Choose a password hash and justify it.
   - Decide MFA policy (which accounts, which factor).
   - Choose session vs token and list the cookie flags / token TTLs.
   - Define 3 RBAC roles and what each can do.
   - Find one likely BROKEN ACCESS CONTROL bug (IDOR) and how to fix it.
```

## Exercises

1. Explain AuthN vs AuthZ with one example each, and name the OWASP-#1 class of AuthZ bug.
2. Why hash instead of encrypt passwords? What does salt prevent?
3. Why is bcrypt/argon2 preferred over SHA-256 for passwords?
4. Define MFA precisely and rank SMS, TOTP, and FIDO2 by strength with reasons.
5. Compare session cookies and JWTs on revocation and statefulness; list three cookie
   security flags.
6. Describe RBAC vs ABAC and when you'd pick each.

## Troubleshooting

- **Passwords stored encrypted/plaintext** — critical. *Fix:* argon2id/bcrypt + per-user
  salt; migrate on next login.
- **"We have MFA" = two passwords** — same factor. *Fix:* require **different** factor
  types.
- **JWT can't be revoked after firing someone** — stateless. *Fix:* short TTL + refresh
  tokens + a deny-list/rotation.
- **Trusting JWT claims without verifying signature** — forgeable. *Fix:* always verify
  signature/issuer/expiry server-side.
- **IDOR (changing an id reveals others' data)** — broken access control. *Fix:* check
  ownership/permission on **every** object access, server-side.
- **SMS MFA phished/SIM-swapped** — *Fix:* prefer FIDO2/TOTP for sensitive accounts.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Define authentication and authorization and which comes first.
2. Why must passwords be hashed, not encrypted?
3. What is salt and what attack does it defeat?
4. Name a slow password-hashing algorithm and why slowness helps.
5. What makes something multi-factor? Give a valid pair.
6. Session cookies vs JWT: which is easier to revoke, and why?
7. Name three security-relevant cookie flags.
8. OAuth2 vs OIDC vs SAML — one line each.
9. **Practical:** show that the same password yields two different bcrypt hashes.
10. **Practical:** decode a JWT payload and explain why you still can't trust it.

## Solutions & validation

1. AuthN = prove identity; AuthZ = what you may do; **AuthN first**.
2. Hashing is **one-way** — a DB leak doesn't reveal passwords; encryption is reversible
   with the key.
3. Salt = unique per-password random value; defeats **rainbow tables** / identical-hash
   leakage.
4. **argon2id/bcrypt/scrypt** — slow, tunable cost makes brute force expensive.
5. Two or more factors of **different types**; e.g. password + TOTP/security key.
6. **Session cookies** (stateful, server-side) revoke instantly; JWTs persist until expiry.
7. `HttpOnly`, `Secure`, `SameSite`.
8. OAuth2 = delegated **authorization**; OIDC = **authentication** on OAuth2 (ID token);
   SAML = XML enterprise SSO.
9. **Validation:** run the `htpasswd -bnBC` command twice — different output (salt).
10. **Validation:** base64-decoded payload is readable but unsigned-trust = forgeable;
    must verify the signature.

> [!TIP]
> Two habits prevent most identity breaches: **store credentials with argon2id/bcrypt +
> salt** and **enforce phishing-resistant MFA on every privileged account**. Then get
> **authorization** right — check permissions on every object, every request, server-side —
> because broken access control, not weak crypto, is where modern apps actually fall.

## What's next

Next: **Lesson 903 — Cryptography Basics.** What actually protects data in transit and at
rest: symmetric vs asymmetric encryption, hashing and HMAC, digital signatures, TLS and
certificates/PKI, and the practical rule every engineer must follow — **don't roll your
own crypto.**
