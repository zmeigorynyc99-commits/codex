---
title: "Security — Cryptography Basics"
slug: "security-cryptography-basics"
track: "security"
trackName: "Security & Defensive Operations"
module: "Security Foundations"
order: 903
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Security"
tags: [security, cryptography, encryption, tls, pki, hashing, signatures]
cover: "/covers/curriculum/security.svg"
estMinutes: 60
status: "published"
summary: "The crypto every engineer needs (without the math): symmetric vs asymmetric encryption, hashing and HMAC, digital signatures, how TLS and certificates/PKI actually establish a secure channel, and the golden rule — use vetted libraries, never roll your own crypto."
seoTitle: "Security 3: Cryptography Basics — Symmetric, Asymmetric, TLS, PKI"
seoDescription: "Practical crypto: symmetric (AES) vs asymmetric (RSA/ECC), hashing/HMAC, digital signatures, TLS handshake, certificates and PKI/CAs. Hands-on lab and assessment."
---

Cryptography is how we deliver **confidentiality** and **integrity** in practice — but you
don't need to be a mathematician to use it correctly. This lesson builds the working
model: **symmetric** vs **asymmetric** encryption and what each is good for, **hashing**
and **HMAC**, **digital signatures**, and how **TLS** combines all of them with
**certificates/PKI** to give you the padlock in your browser. The most important takeaway
is also the simplest: **use established libraries; never roll your own crypto.**

## Learning objectives

By the end of this lesson you will be able to:

- Explain **symmetric** (AES) vs **asymmetric** (RSA/ECC) encryption and their roles.
- Distinguish **encryption**, **hashing**, and **HMAC** by purpose.
- Describe **digital signatures** (sign with private, verify with public).
- Outline the **TLS handshake** and what **certificates** and a **CA/PKI** provide.
- Apply crypto **hygiene**: vetted libraries, strong algorithms, key management.

## Part 1 — Symmetric encryption

**One shared secret key** encrypts and decrypts. Fast — used for bulk data:

```text
plaintext --[ AES + key + IV ]--> ciphertext --[ AES + same key + IV ]--> plaintext
```

- Standard algorithm: **AES** (128/256-bit), in an **authenticated** mode like
  **AES-GCM** (gives confidentiality **and** integrity/tamper-detection).
- Needs an **IV/nonce** (unique per message) — never reuse a nonce with the same key.
- The hard part is **key distribution**: how do both sides get the shared key securely?
  That's what asymmetric crypto solves.

## Part 2 — Asymmetric (public-key) encryption

A **key pair**: a **public** key (shared freely) and a **private** key (kept secret).
What one encrypts, only the other can decrypt:

- **Encrypt with the public key → only the private key decrypts** (confidentiality:
  anyone can send *you* a secret).
- **Sign with the private key → anyone verifies with the public key** (authenticity/
  integrity: proof *you* sent it).

Algorithms: **RSA**, **ECC** (elliptic curve — smaller keys, modern), and **Diffie-Hellman/
ECDH** for **key exchange**. Asymmetric is **slow**, so it's used to exchange a symmetric
key, then bulk data uses fast symmetric crypto — the **hybrid** model TLS uses.

> [!IMPORTANT]
> **Public key encrypts / private key decrypts** for confidentiality; **private key signs
> / public key verifies** for authenticity. Asymmetric crypto solves **key distribution**
> and **identity**, but it's slow — so real systems are **hybrid**: use asymmetric to
> agree on a session key, then symmetric (AES-GCM) for the actual data.

## Part 3 — Hashing and HMAC

- **Hash** (SHA-256, SHA-3) — one-way fixed-size fingerprint of data. Used for
  **integrity** (did it change?), deduplication, and (with a slow algorithm + salt)
  password storage. Properties: deterministic, fast, collision-resistant, avalanche
  (tiny change → totally different hash). A plain hash gives **no authenticity** — anyone
  can recompute it.
- **HMAC** — a hash **keyed** with a secret (`HMAC-SHA256`). Proves **integrity *and*
  authenticity** (only someone with the key could produce it). Used for API signing,
  cookies, webhooks.

```text
hash(data)            -> integrity only      (anyone can recompute)
HMAC(key, data)       -> integrity + authenticity (need the key)
```

## Part 4 — Digital signatures

Combine hashing + asymmetric crypto to prove **who** sent something and that it's
**unaltered** — with **non-repudiation** (the signer can't credibly deny it):

```text
sign:    signature = encrypt_with_PRIVATE( hash(message) )
verify:  hash(message)  ==  decrypt_with_PUBLIC( signature )  ?
```

Signatures underpin **certificates**, **code signing**, **software updates**, JWTs, and
Git commit signing. HMAC also gives integrity+authenticity but is **symmetric** (shared
key, no non-repudiation); signatures are **asymmetric** (anyone can verify, only the holder
can sign).

## Part 5 — TLS, certificates and PKI

**TLS** (the `S` in HTTPS) secures data in transit by combining everything above. A
simplified handshake:

```text
1. Client → "hello", supported ciphers
2. Server → certificate (public key, signed by a CA) + chosen cipher
3. Client verifies the cert chains to a trusted CA and matches the hostname
4. Key exchange (ECDHE) → both derive the same SYMMETRIC session key
5. Bulk traffic encrypted with that session key (AES-GCM)  — fast + secret
```

- A **certificate** binds a **public key** to an **identity** (domain name) and is
  **signed by a Certificate Authority (CA)**.
- **PKI** (Public Key Infrastructure) = the system of CAs, **chains of trust** (root →
  intermediate → leaf), revocation (CRL/OCSP), and the **trust store** of root CAs your OS/
  browser ships with.
- **ECDHE** key exchange gives **forward secrecy**: a future key compromise can't decrypt
  past sessions.

> [!TIP]
> Use **TLS 1.2+ (prefer 1.3)** everywhere, get free certs via **Let's Encrypt/ACME**, and
> automate renewal so you never serve an expired cert. Internally, a **private CA** (or
> tools like step-ca/Vault) issues certs for service-to-service mTLS. Validate the **whole
> chain and the hostname** — a valid signature on the wrong domain is still an attack.

## Hands-on lab

```bash
# 1. Symmetric encrypt/decrypt a file with AES (OpenSSL)
echo "top secret" > msg.txt
openssl enc -aes-256-cbc -pbkdf2 -salt -in msg.txt -out msg.enc      # prompts passphrase
openssl enc -aes-256-cbc -pbkdf2 -d -in msg.enc -out msg.dec         # decrypt
diff msg.txt msg.dec && echo "round-trip OK"

# 2. Asymmetric keypair + sign/verify
openssl genpkey -algorithm RSA -out priv.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in priv.pem -pubout -out pub.pem
openssl dgst -sha256 -sign priv.pem -out msg.sig msg.txt            # sign with PRIVATE
openssl dgst -sha256 -verify pub.pem -signature msg.sig msg.txt     # verify with PUBLIC
#   -> "Verified OK"   (tamper with msg.txt and it fails)

# 3. Hash vs HMAC
echo -n "data" | openssl dgst -sha256                               # plain hash
echo -n "data" | openssl dgst -sha256 -hmac "shared-secret-key"     # keyed HMAC

# 4. Inspect a real certificate and its chain
echo | openssl s_client -connect example.com:443 -servername example.com 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

```text
5. Reasoning: for each, pick the right primitive —
   - "store a password"            -> ____ (slow salted hash: argon2/bcrypt)
   - "verify a download wasn't corrupted" -> ____ (hash)
   - "secret API request not forged" -> ____ (HMAC)
   - "prove this update came from us" -> ____ (signature)
   - "encrypt 1 GB of backups"       -> ____ (symmetric AES-GCM)
   - "send you a secret with no prior shared key" -> ____ (asymmetric / hybrid)
```

## Exercises

1. Explain when to use symmetric vs asymmetric encryption, and why TLS uses both.
2. Differentiate hash, HMAC, and digital signature by what each guarantees.
3. Why must an AES nonce/IV be unique per message? What breaks if you reuse it?
4. Walk through how your browser decides to trust `https://example.com`.
5. What is forward secrecy and which part of the handshake provides it?
6. Map each lab item (#5) to a primitive and justify.

## Troubleshooting

- **Rolled your own cipher** — almost always broken. *Fix:* use vetted libs (libsodium,
  the platform's crypto), standard algorithms.
- **Reused IV/nonce with same key** — leaks plaintext. *Fix:* random/unique nonce per
  message; use AES-GCM correctly.
- **Used a plain hash for passwords** — too fast, no salt. *Fix:* argon2id/bcrypt + salt.
- **Trusting a cert with a valid signature but wrong hostname/expired** — *Fix:* verify
  chain **and** hostname **and** validity dates.
- **Old protocols (SSLv3/TLS1.0)/weak ciphers** — *Fix:* TLS 1.2+ (prefer 1.3), strong
  cipher suites.
- **Private key in a repo / world-readable** — game over. *Fix:* protect keys (perms,
  HSM/KMS), rotate if exposed.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Symmetric vs asymmetric: which is faster, and what is each used for?
2. In asymmetric crypto, which key encrypts for confidentiality, and which signs?
3. What does a plain hash guarantee, and what does it NOT?
4. How does HMAC add to a plain hash?
5. How is a digital signature created and verified?
6. What does a certificate bind, and who vouches for it?
7. Outline the TLS handshake in three steps.
8. State the golden rule of applied cryptography.
9. **Practical:** sign a file and verify it with OpenSSL.
10. **Practical:** read a live site's certificate issuer and expiry.

## Solutions & validation

1. **Symmetric** is faster (bulk data, AES); **asymmetric** handles key exchange/identity;
   TLS uses both (**hybrid**).
2. Encrypt with the **public** key (confidentiality); sign with the **private** key.
3. Integrity (change detection) — **not** authenticity (anyone can recompute it).
4. HMAC keys the hash with a **secret** → integrity **and** authenticity.
5. `sign = private-key over hash(message)`; verify with the **public key** against the
   recomputed hash.
6. A **public key to an identity/hostname**, signed by a **CA**.
7. Hello/ciphers → server cert + key exchange (ECDHE) → derive shared **session key**,
   then AES-GCM.
8. **Don't roll your own crypto** — use vetted libraries and standard algorithms.
9. **Validation:** `openssl dgst -sha256 -verify pub.pem -signature msg.sig msg.txt` →
   "Verified OK".
10. **Validation:** `openssl s_client … | openssl x509 -noout -issuer -dates`.

> [!TIP]
> You don't implement crypto — you **compose** it: hash for integrity, HMAC/signature for
> authenticity, symmetric for bulk secrecy, asymmetric for key exchange and identity, all
> wrapped by **TLS + PKI**. Pick **strong, standard** algorithms from **trusted
> libraries**, manage keys carefully, and let TLS do the heavy lifting.

## What's next

Next: **Lesson 904 — Network Security & Firewalls.** Defending the wire: firewalls
(stateful, host vs network), network segmentation and zero trust, IDS/IPS, VPNs, common
network attacks (MITM, spoofing, DDoS), and hands-on host firewalling with `ufw`/
`nftables`.
