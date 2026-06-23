---
title: "Terraform — Provisioning Real Resources"
slug: "terraform-provisioning-real-resources"
track: "iac-terraform"
trackName: "Infrastructure as Code (Terraform)"
module: "Terraform in Practice"
order: 1405
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [terraform, providers, data-sources, dependencies, cloud, provisioning]
cover: "/covers/curriculum/iac-terraform.svg"
estMinutes: 65
status: "published"
summary: "Turn HCL into running infrastructure: provider authentication, data sources to read existing infrastructure, implicit and explicit dependencies, the resource graph, a realistic multi-resource build, and lifecycle controls — provisioning real cloud resources safely."
seoTitle: "Terraform 5: Provisioning Real Resources (auth, data sources, graph)"
seoDescription: "Terraform in practice: provider auth, data sources, implicit/explicit dependencies, the resource graph, multi-resource builds, and lifecycle/meta-arguments. Lab + assessment."
---

Now we connect Terraform to **real platforms**. Provisioning real infrastructure adds concerns
the local labs didn't: **authenticating** to a provider safely, **reading existing
infrastructure** with data sources, expressing **dependencies** between resources so they build
in the right order, and using **lifecycle** controls to protect critical resources. This lesson
covers provider auth, data sources, the **dependency graph**, a realistic multi-resource
build, and meta-arguments — the practical skills to provision cloud infrastructure without
footguns. (Labs stay cloud-free via the `docker` provider so you can run them for real.)

## Learning objectives

By the end of this lesson you will be able to:

- **Authenticate** to a provider securely (no hardcoded credentials).
- Read existing infrastructure with **data sources**.
- Express **implicit** and **explicit** (`depends_on`) dependencies.
- Reason about the **resource graph** and build order.
- Use **lifecycle** meta-arguments to protect/control resources.

## Part 1 — Provider authentication

Never hardcode credentials in `.tf` files (they'd be committed to Git). Providers read
credentials from the **environment** or standard credential chains:

```hcl
provider "aws" {
  region = var.region
  # NO access keys here! Credentials come from:
  #   - environment vars (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_PROFILE)
  #   - ~/.aws/credentials profile
  #   - an IAM role (EC2/ECS/IRSA) or OIDC in CI  ← best: no long-lived keys
}
```

```bash
export AWS_PROFILE=myprofile           # or AWS_ACCESS_KEY_ID/SECRET (short-lived ideally)
# In CI: OIDC federation -> temporary credentials (recall the CI/CD artifact lesson)
```

> [!IMPORTANT]
> **Credentials never belong in `.tf` files or state-committed `.tfvars`.** Providers
> authenticate from the **environment** (env vars, profiles) or, best, an **assumed role/OIDC**
> that issues short-lived credentials — so there's no long-lived secret to leak. In CI, use the
> provider's OIDC federation. Hardcoding a cloud key in HCL is a critical finding: it lands in
> Git history and is effectively public. Same least-privilege/secret-hygiene rules as the
> security and CI/CD tracks.

## Part 2 — Data sources: read what already exists

A **`data`** source **reads** existing infrastructure (not managed by this config) so you can
reference it — the read-only counterpart to `resource`:

```hcl
# Look up the latest Ubuntu AMI instead of hardcoding an ID
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]
  filter { name = "name"  values = ["ubuntu/images/*-24.04-amd64-server-*"] }
}

# Reference an existing VPC/network you didn't create here
data "aws_vpc" "main" {
  tags = { Name = "main" }
}

resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id        # use the looked-up value
  instance_type = "t3.micro"
}
```

Data sources let your config **adapt** (always use the latest AMI) and **integrate** with
infrastructure owned elsewhere (a shared VPC, an existing DNS zone) without hardcoding IDs.
Reference them as **`data.<type>.<name>.<attr>`**.

## Part 3 — Dependencies and the resource graph

Terraform builds a **dependency graph** and provisions resources in the correct order,
**parallelizing** independent ones. Most dependencies are **implicit** — created automatically
when one resource references another:

```hcl
resource "docker_network" "app" { name = "appnet" }

resource "docker_container" "db" {
  name    = "db"
  image   = docker_image.postgres.image_id
  networks_advanced { name = docker_network.app.name }   # implicit dep on the network
}
```

Because `db` references `docker_network.app.name`, Terraform knows to create the **network
first**. Use **explicit** `depends_on` only when a dependency exists but isn't expressed through
a reference (e.g. an IAM policy that must exist before an app uses it implicitly):

```hcl
resource "docker_container" "app" {
  # ...
  depends_on = [docker_container.db]   # force ordering without a direct reference
}
```

```bash
terraform graph | dot -Tsvg > graph.svg   # visualize the dependency graph (needs graphviz)
```

> [!TIP]
> Prefer **implicit dependencies** (reference another resource's attribute) over `depends_on` —
> they're automatic, accurate, and let Terraform parallelize correctly. Reach for explicit
> **`depends_on`** only for "hidden" dependencies Terraform can't infer from references.
> Overusing `depends_on` serializes your graph and slows applies. Let the references express
> the ordering; the graph does the rest.

## Part 4 — A realistic multi-resource build

Real configs wire several resources together. Here's a runnable multi-container app via the
**docker** provider (everything you learned in the Docker track, now declared as code):

```hcl
terraform {
  required_providers { docker = { source = "kreuzwerker/docker", version = "~> 3.0" } }
}
provider "docker" {}

resource "docker_network" "app" { name = "tf-appnet" }

resource "docker_image" "redis" { name = "redis:7" }
resource "docker_container" "cache" {
  name  = "tf-cache"
  image = docker_image.redis.image_id
  networks_advanced { name = docker_network.app.name }
}

resource "docker_image" "web" { name = "nginx:1.27-alpine" }
resource "docker_container" "web" {
  name  = "tf-web"
  image = docker_image.web.image_id
  networks_advanced { name = docker_network.app.name }   # finds "cache" by name on this net
  ports { internal = 80  external = 8088 }
}

output "url" { value = "http://localhost:8088" }
```

Terraform creates the network and images first, then the containers (graph order), and tears
them down in reverse on `destroy` — declaratively managing the whole stack.

## Part 5 — Lifecycle meta-arguments

**Lifecycle** blocks control how Terraform treats a resource during changes — crucial for
protecting production:

```hcl
resource "aws_db_instance" "main" {
  # ...
  lifecycle {
    prevent_destroy       = true    # REFUSE to destroy (guard rails for databases!)
    create_before_destroy = true    # make the new one before deleting the old (avoid downtime)
    ignore_changes        = [tags]  # don't fight external changes to these attributes
  }
}
```

- **`prevent_destroy`** — Terraform errors rather than destroy this resource (protect DBs,
  state buckets).
- **`create_before_destroy`** — for replacements, create the replacement first → no downtime
  gap.
- **`ignore_changes`** — ignore drift on specified attributes (e.g. tags managed by another
  system).

Other meta-arguments: **`count`/`for_each`** (Lesson 1403), **`provider`** (alias for multi-
region), **`depends_on`**.

> [!IMPORTANT]
> Put **`prevent_destroy = true`** on stateful, irreplaceable resources — databases, the state
> bucket, anything whose deletion means data loss. It turns an accidental `terraform destroy`
> or a forced-replacement plan into a hard error you must consciously override. Combine with
> **always reading the plan** (Lesson 1401): the two together are your defense against the most
> expensive Terraform mistake — destroying production data with one command.

## Hands-on lab

```bash
# Real provisioning via the docker provider (needs Docker; no cloud account).
mkdir tf-docker-lab && cd tf-docker-lab
cat > main.tf <<'EOF'
terraform { required_providers { docker = { source = "kreuzwerker/docker", version = "~> 3.0" } } }
provider "docker" {}

resource "docker_network" "app" { name = "tf-appnet" }
resource "docker_image" "web"   { name = "nginx:1.27-alpine" }
resource "docker_container" "web" {
  name  = "tf-web"
  image = docker_image.web.image_id
  networks_advanced { name = docker_network.app.name }   # implicit dep -> network first
  ports { internal = 80  external = 8088 }
}
output "url" { value = "http://localhost:8088" }
EOF

terraform init
terraform plan                       # graph: network + image, then container
terraform apply -auto-approve
curl -s localhost:8088 | head -1     # real running container, declared as code
docker ps | grep tf-web

# 1. Inspect the dependency graph
terraform graph | head -20           # (pipe to `dot -Tsvg` if graphviz installed)

# 2. Data source concept: read an existing image's attributes (read-only)
#    data "docker_image" "existing" { name = "nginx:1.27-alpine" }  ->  data.docker_image.existing.id

# 3. Lifecycle: protect the network from destroy, then see destroy blocked
cat >> main.tf <<'EOF'
# add to docker_network.app:  lifecycle { prevent_destroy = true }
EOF
sed -i 's/name = "tf-appnet" }/name = "tf-appnet"\n  lifecycle { prevent_destroy = true } }/' main.tf
terraform plan
terraform destroy -auto-approve || echo ">> destroy BLOCKED by prevent_destroy on the network"

# 4. Remove the guard and clean up
sed -i '/prevent_destroy/d' main.tf
terraform destroy -auto-approve
```

## Exercises

1. Explain three secure ways a provider can get credentials and why none belong in `.tf`.
2. Use a data source to look up an existing resource's attribute and reference it.
3. Build a config where one resource implicitly depends on another; show the build order.
4. Add an explicit `depends_on` and explain when it's necessary vs an anti-pattern.
5. Provision a real multi-resource stack (docker provider) and reach it; then destroy it.
6. Add `prevent_destroy` to a critical resource and demonstrate destroy being blocked.

## Troubleshooting

- **Auth errors** — no/expired credentials. *Fix:* set env/profile/role; OIDC in CI; check
  region.
- **Hardcoded keys in HCL** — leak. *Fix:* remove; use env/role; rotate; scrub history.
- **Wrong build order / race** — missing dependency. *Fix:* reference the attribute (implicit)
  or `depends_on`.
- **Slow applies** — over-use of `depends_on` serializes the graph. *Fix:* rely on references;
  remove unnecessary `depends_on`.
- **Accidental destroy of a DB** — no guard. *Fix:* `prevent_destroy`; always read the plan;
  backups.
- **Replacement causes downtime** — destroy-then-create. *Fix:* `create_before_destroy`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Where should provider credentials come from, and where must they NOT be?
2. What is a data source, and how does it differ from a resource?
3. How is an implicit dependency created?
4. When do you need explicit `depends_on`, and what's the downside of overusing it?
5. How does Terraform decide build order and parallelism?
6. What does `prevent_destroy` do?
7. What does `create_before_destroy` prevent?
8. What does `ignore_changes` do?
9. **Practical:** provision and reach a real multi-resource stack, then destroy it.
10. **Practical:** show `prevent_destroy` blocking a destroy.

## Solutions & validation

1. From the **environment/profile/assumed role/OIDC** (short-lived); **never** in `.tf` or
   committed tfvars.
2. A **read-only** lookup of existing infrastructure; `resource` **manages** (creates) it.
3. By **referencing another resource's attribute** (Terraform infers the edge).
4. For dependencies not expressed via references; overusing it **serializes** the graph
   (slower).
5. From the **dependency graph**; independent resources run in **parallel**.
6. Makes Terraform **refuse to destroy** the resource (errors instead).
7. The **downtime gap** during replacement — new is created before old is destroyed.
8. Ignores **drift** on listed attributes (don't fight externally-managed changes).
9. **Validation:** `curl localhost:8088` hits the TF-managed container (see lab).
10. **Validation:** `destroy` errors due to `prevent_destroy` on the network.

> [!TIP]
> Provisioning real infrastructure safely comes down to: **credentials from the environment/
> roles (never HCL)**, **data sources** to integrate with what exists, **implicit
> dependencies** to get correct parallel ordering, and **lifecycle guards** (`prevent_destroy`,
> `create_before_destroy`) plus **always reading the plan** to protect production. The docker-
> provider lab uses the exact same workflow you'd use for AWS/Azure/GCP — only the resource
> types change.

## What's next

Next: **Lesson 1406 — Terraform Workflows & Collaboration.** Running Terraform as a team:
remote state and workspaces, the plan/apply approval workflow in CI (Atlantis/TF Cloud),
managing multiple environments, policy-as-code (Sentinel/OPA), and keeping infrastructure
changes reviewed and auditable.
