# MDX Content Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert Blog and About pages from JSX components with hardcoded content to MDX-based content files for easier editing.

**Architecture:** Add MDX support to Vite using `@mdx-js/rollup`, extract static content from Blog.jsx and About.jsx into `frontend/src/content/*.mdx` files, refactor components to import and render MDX content while preserving Mermaid diagram initialization.

**Tech Stack:** Vite, React 19, @mdx-js/rollup, remark-gfm, Mermaid.js

---

## Task 1: Install MDX Dependencies

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install MDX packages**

```bash
cd frontend
npm install --save-dev @mdx-js/rollup remark-gfm
```

Expected: Packages installed successfully, package.json and package-lock.json updated

**Step 2: Verify installation**

```bash
npm list @mdx-js/rollup remark-gfm
```

Expected: Shows installed versions of both packages

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "build: add MDX dependencies (@mdx-js/rollup, remark-gfm)"
```

---

## Task 2: Configure Vite for MDX

**Files:**
- Modify: `frontend/vite.config.js`

**Step 1: Update vite.config.js**

Replace entire file content:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'

export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) },
    react()
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

**Step 2: Verify configuration syntax**

```bash
npm run build -- --mode development
```

Expected: Build succeeds (may have no content to build yet, but config should be valid)

**Step 3: Commit**

```bash
git add vite.config.js
git commit -m "config: add MDX plugin to Vite configuration"
```

---

## Task 3: Create Content Directory

**Files:**
- Create: `frontend/src/content/` (directory)

**Step 1: Create content directory**

```bash
mkdir -p frontend/src/content
```

**Step 2: Verify directory exists**

```bash
ls -la frontend/src/content
```

Expected: Directory exists and is empty

**Step 3: Commit**

```bash
git add frontend/src/content/.gitkeep
touch frontend/src/content/.gitkeep
git add frontend/src/content/.gitkeep
git commit -m "chore: create content directory for MDX files"
```

---

## Task 4: Extract Blog Content to MDX

**Files:**
- Create: `frontend/src/content/blog.mdx`
- Reference: `frontend/src/components/Blog.jsx` (for content to extract)

**Step 1: Create blog.mdx with extracted content**

Create `frontend/src/content/blog.mdx`:

```mdx
# A Production-Ready Color Perception SPA

## Jon Rahoi • March 8, 2026 • DevOps Spring 2026 Midterm Project

<article className="blog-post">

## From Code to Cloud: A semi-Complete DevOps Implementation

### 1. System Overview & Architecture

The Color Perception SPA is a research application designed to study how people
with different native languages classify colors. Users are presented with randomly- generated colors from the RGB color space (16.7 million possible colors), and are asked classify them into one of 11 "parent colors", and can explore agreement patterns in an interactive 3D visualization.

The data gathered will be used to generate language-specific color identification models and will be used to study how people with different native languages classify colors.

#### Technology Stack

- **Frontend:** React 18 w/ Vite for fast builds, React Three Fiber for 3D color space visualization, Axios for API communication
- **Backend:** Node.js 20 with Express, MySQL session store for persistent user sessions
- **Database:** MySQL 8 on AWS RDS with InnoDB storage engine
- **Containerization:** Docker with multi-stage builds (frontend build stage + production backend stage)
- **Cloud Infrastructure:** AWS EC2 (t3.micro) for compute, RDS for database, ECR for container registry
- **CI/CD:** GitHub Actions with semantic-release for automated versioning

#### High-Level Architecture

<div className="mermaid">
{`graph TB
    User[User Browser]
    CF[CloudFront CDN<br/>Future Enhancement]
    ALB[Application Load Balancer<br/>Future Enhancement]
    RC[RC EC2 Instance<br/>t3.micro - 3.92.207.70]
    Prod[Production EC2<br/>Future Enhancement]
    RDS[(RDS MySQL 8.0<br/>db.t3.micro)]
    ECR[Amazon ECR<br/>color-perception-spa]

    User -->|HTTPS :3000| RC
    User -.->|Future| CF
    CF -.->|Future| ALB
    ALB -.->|Future| Prod
    RC -->|TCP 3306| RDS
    Prod -.->|Future| RDS
    RC -->|Pull Images| ECR
    Prod -.->|Future| ECR

    style RC fill:#4a90e2,stroke:#2d5f8d,stroke-width:3px
    style RDS fill:#e24a4a,stroke:#8d2d2d,stroke-width:3px
    style ECR fill:#4ae2a8,stroke:#2d8d5f,stroke-width:3px
    style User fill:#e2d44a,stroke:#8d7c2d,stroke-width:2px
    style CF fill:#666,stroke:#444,stroke-width:1px,stroke-dasharray: 5 5
    style ALB fill:#666,stroke:#444,stroke-width:1px,stroke-dasharray: 5 5
    style Prod fill:#666,stroke:#444,stroke-width:1px,stroke-dasharray: 5 5`}
</div>

### 2. Infrastructure Components

#### AWS Resources

- **EC2 Instance (RC Environment):** t3.micro instance running Docker, serves the containerized application on port 3000
- **RDS MySQL Database:** db.t3.micro instance with automated backups, publicly accessible for development
- **ECR Container Registry:** Stores versioned Docker images with RC tags (e.g., v1.2.0-rc.1)
- **IAM Role (GitHubActionsDeployRole):** OIDC-authenticated role for GitHub Actions with EC2, ECR, and Systems Manager permissions
- **Security Groups:**
  - RC Instance: Allows inbound HTTP (3000), SSH (22)
  - RDS: Allows MySQL (3306) from RC instance and temporary integration test instances
  - Temp EC2: Created dynamically for integration tests, cleaned up after

#### GitHub Repositories

- **Source Repo (devops-spring26-midterm-source):** Application code, semantic-release automation, triggers RC builds
- **Infra Repo (devops-spring26-midterm-infra):** RC build workflow, integration tests, deployment scripts, AWS infrastructure as code

#### Infrastructure Diagram

<div className="mermaid">
{`graph TB
    subgraph "GitHub Actions"
        GHA[GitHub Actions<br/>OIDC Authentication]
    end

    subgraph "AWS Account"
        subgraph "IAM"
            Role[GitHubActionsDeployRole<br/>Trust Policy: GitHub OIDC]
        end

        subgraph "Compute"
            EC2RC[RC EC2 Instance<br/>t3.micro - Ubuntu<br/>Docker + Nginx]
            EC2Temp[Temp EC2<br/>Integration Tests<br/>Auto-cleanup]
        end

        subgraph "Container Registry"
            ECR[Amazon ECR<br/>color-perception-spa<br/>Immutable Tags]
        end

        subgraph "Database"
            RDS[(RDS MySQL 8.0<br/>db.t3.micro<br/>20GB Storage)]
        end

        subgraph "Networking"
            SG1[RC Security Group<br/>Port 3000, 22]
            SG2[Temp Security Group<br/>Ephemeral]
            SGRDS[RDS Security Group<br/>Port 3306]
        end
    end

    GHA -->|AssumeRole via OIDC| Role
    Role -->|Deploy Container| EC2RC
    Role -->|Provision & Cleanup| EC2Temp
    Role -->|Push/Pull Images| ECR
    EC2RC -->|docker pull| ECR
    EC2Temp -->|docker pull| ECR
    EC2RC -->|MySQL Connection| RDS
    EC2Temp -->|Integration Tests| RDS
    SG1 -.->|Controls Access| EC2RC
    SG2 -.->|Controls Access| EC2Temp
    SGRDS -.->|Controls Access| RDS

    style GHA fill:#e2d44a,stroke:#8d7c2d,stroke-width:3px
    style Role fill:#a84ae2,stroke:#5f2d8d,stroke-width:3px
    style EC2RC fill:#4a90e2,stroke:#2d5f8d,stroke-width:3px
    style ECR fill:#4ae2a8,stroke:#2d8d5f,stroke-width:3px
    style RDS fill:#e24a4a,stroke:#8d2d2d,stroke-width:3px
    style EC2Temp fill:#e2a84a,stroke:#8d5f2d,stroke-width:2px`}
</div>

### 3. CI/CD Pipeline

The CI/CD pipeline is split across two repositories with a sophisticated
repository dispatch pattern that separates code versioning from infrastructure deployment.

#### Source Repository Workflows

- **Semantic Release:** Analyzes conventional commits, generates changelog, creates version tags (e.g., v1.2.0-rc.1)
- **Trigger RC Deploy:** Listens for RC tag creation, sends repository dispatch event to infra repo with version payload

#### Infrastructure Repository Workflows

- **RC Build & Test:**
  - Tier 1: ESLint checks for frontend and backend
  - Tier 1: Jest unit tests for backend API logic
  - Docker multi-stage build
  - Tier 2: Smoke tests (health check, API endpoints, frontend render)
  - Push to ECR with version tag
  - Tier 3: Provision temporary EC2 instance
  - Tier 3: Deploy full stack to temp instance
  - Tier 3: Run integration tests (session persistence, color generation, database writes)
  - Tier 3: Cleanup temporary resources
  - Deploy to RC environment
  - Verify deployment health

#### Quality Gates: Three-Tier Testing Strategy

<div className="mermaid">
{`graph LR
    subgraph "Tier 1: Pre-Build Quality"
        Lint[ESLint<br/>Frontend & Backend]
        Unit[Jest Unit Tests<br/>API Routes]
    end

    subgraph "Tier 2: Container Smoke Tests"
        Health[Health Check<br/>/api/health]
        API[API Endpoints<br/>Functional Tests]
        Frontend[Frontend Build<br/>Render Verification]
    end

    subgraph "Tier 3: Integration Tests"
        TempEC2[Provision Temp EC2<br/>Fresh Environment]
        Deploy[Deploy Full Stack<br/>Container + RDS]
        E2E[End-to-End Tests<br/>Session & Data Flow]
        Cleanup[Cleanup Resources<br/>Terminate Instance]
    end

    Lint --> Build[Docker Build<br/>Multi-Stage]
    Unit --> Build
    Build --> Health
    Health --> API
    API --> Frontend
    Frontend --> Push[Push to ECR<br/>Version Tag]
    Push --> TempEC2
    TempEC2 --> Deploy
    Deploy --> E2E
    E2E --> Cleanup
    Cleanup --> RCDeploy[Deploy to RC<br/>Production-like Env]

    style Build fill:#4a90e2,stroke:#2d5f8d,stroke-width:3px
    style Push fill:#4ae2a8,stroke:#2d8d5f,stroke-width:3px
    style RCDeploy fill:#e24a4a,stroke:#8d2d2d,stroke-width:3px
    style TempEC2 fill:#e2a84a,stroke:#8d5f2d,stroke-width:2px
    style Cleanup fill:#a84ae2,stroke:#5f2d8d,stroke-width:2px`}
</div>

#### CI/CD Flow Diagram

<div className="mermaid">
{`sequenceDiagram
    participant Dev as Developer
    participant Source as Source Repo<br/>GitHub Actions
    participant Infra as Infra Repo<br/>GitHub Actions
    participant ECR as AWS ECR
    participant TempEC2 as Temp EC2
    participant RC as RC Environment

    Dev->>Source: git push (conventional commit)
    Source->>Source: Semantic Release Analysis
    Source->>Source: Generate Changelog
    Source->>Source: Create RC Tag (v1.2.0-rc.1)
    Source->>Infra: Repository Dispatch Event
    Note over Infra: Triggered by RC tag
    Infra->>Source: Checkout RC Tag
    Infra->>Infra: ESLint + Jest Tests (Tier 1)
    Infra->>Infra: Docker Multi-Stage Build
    Infra->>Infra: Smoke Tests (Tier 2)
    Infra->>ECR: Push Image (v1.2.0-rc.1)
    Infra->>TempEC2: Provision Fresh Instance
    Infra->>TempEC2: Deploy Container + Configure RDS
    Infra->>TempEC2: Run Integration Tests (Tier 3)
    TempEC2-->>Infra: Tests Pass ✓
    Infra->>TempEC2: Terminate & Cleanup
    Infra->>RC: Pull Image from ECR
    Infra->>RC: Stop Old Container
    Infra->>RC: Start New Container
    Infra->>RC: Health Check Verification
    RC-->>Infra: Deployment Successful ✓

    Note over Dev,RC: Full Pipeline: ~8-12 minutes`}
</div>

### 4. What I Built in GitHub

#### Repository Structure

I created a dual-repository architecture to separate concerns between application
code and infrastructure deployment:

- **Source Repo:** Contains React frontend, Express backend, Dockerfile, semantic-release configuration
- **Infra Repo:** Contains deployment scripts, integration tests, AWS resource configurations, GitHub Actions workflows

#### GitHub Actions Workflows Created

- **release.yml (Source):** Runs semantic-release on every push to main, creates version tags with conventional commit analysis
- **trigger-rc-deploy.yml (Source):** Listens for RC tag creation, triggers infra repo via repository dispatch
- **rc-build.yml (Infra):** Comprehensive build, test, and deploy workflow with three-tier testing
- **integration-tests.yml (Infra):** Standalone integration test suite for manual validation

#### OIDC Setup for AWS

Instead of using static AWS credentials, I implemented OpenID Connect (OIDC) authentication:

- Created an IAM OIDC identity provider for GitHub
- Created GitHubActionsDeployRole with trust policy allowing GitHub Actions to assume the role
- Configured workflows to use aws-actions/configure-aws-credentials with OIDC role assumption
- Benefits: No long-lived credentials, automatic rotation, fine-grained permissions

#### Secrets Management

- **INFRA_REPO_TOKEN:** Personal access token for repository dispatch and cross-repo communication
- **AWS_ACCOUNT_ID:** Used in ECR image URIs
- **DB_HOST, DB_USER, DB_PASSWORD, DB_NAME:** RDS connection details
- **SESSION_SECRET:** Express session signing key

#### Branch Protection Rules

- Main branch protected with required status checks
- All changes must go through pull requests
- Conventional commits enforced for semantic versioning

### 5. What I Built in AWS

#### EC2 Instance (RC Environment)

- **Instance Type:** t3.micro (2 vCPU, 1GB RAM) - cost-effective for RC workloads
- **AMI:** Ubuntu 24.04 LTS with Docker pre-installed
- **Configuration:** Nginx reverse proxy forwarding to Docker container on port 3000
- **Persistent Storage:** 8GB EBS volume for container images and logs
- **Tags:** Environment=RC, Project=ColorPerception, ManagedBy=GitHub-Actions

#### RDS MySQL Database

- **Engine:** MySQL 8.0.35
- **Instance Class:** db.t3.micro (2 vCPU, 1GB RAM)
- **Storage:** 20GB GP2 SSD with auto-scaling up to 100GB
- **Backup:** Automated daily backups with 7-day retention
- **Schema:** Three tables (colors, sessions, responses) with foreign key constraints
- **Network:** Publicly accessible for development (would be private in production)

#### ECR Container Registry

- **Repository Name:** color-perception-spa
- **Image Scanning:** Enabled on push for vulnerability detection
- **Tag Immutability:** Enabled to prevent tag overwrites
- **Lifecycle Policy:** Keep last 10 RC images, delete untagged images after 7 days

#### IAM Roles and Policies

- **GitHubActionsDeployRole:** Allows GitHub Actions to:
  - Push/pull images from ECR
  - Start/stop/terminate EC2 instances
  - Send commands via Systems Manager
  - Create/delete temporary instances for integration tests
- **Trust Policy:** Restricts role assumption to specific GitHub repos and branches

#### Security Groups and Networking

- **RC Instance Security Group:**
  - Inbound: HTTP (3000) from anywhere, SSH (22) from my IP
  - Outbound: All traffic (for ECR pulls, RDS connections)
- **RDS Security Group:**
  - Inbound: MySQL (3306) from RC instance and temp instance security groups
  - Also allows public access for development debugging
- **Temp Instance Security Group:**
  - Created dynamically during integration tests
  - Allows outbound to RDS and ECR
  - Deleted after test completion

### 6. Key Implementation Details

#### Database Migrations

I implemented a safe migration strategy using SQL schema files:

- CREATE TABLE IF NOT EXISTS prevents errors on redeployment
- Foreign key constraints ensure referential integrity
- Indexes on rgb_r, rgb_g, rgb_b for fast color lookups
- InnoDB engine for ACID compliance and row-level locking
- Migration runs automatically on container startup

#### Session Management

Session persistence was critical for tracking user responses across multiple colors:

- Used express-mysql-session to store sessions in RDS instead of memory
- Set app.set('trust proxy', 1) to handle Nginx reverse proxy headers
- Configured secure cookies for production (httpOnly, secure flags)
- 7-day session expiration to allow users to return
- Session ID used as foreign key in responses table

#### Random RGB Color Generation

Unlike traditional systems with predefined color palettes, this app generates
colors from the entire RGB color space:

- Math.random() * 256 for each channel (R, G, B)
- 16,777,216 possible unique colors
- Algorithm attempts to avoid showing duplicate colors to the same user
- Falls back to whatever color was generated after 3 attempts (prevents infinite loops)
- Converts RGB to hex for CSS display (#RRGGBB format)

#### Three-Tier Testing Strategy

- **Tier 1 (Pre-Build):** Fast feedback on code quality before building containers
- **Tier 2 (Smoke Tests):** Validates container works in isolation
- **Tier 3 (Integration):** Tests full system with real AWS resources, catches configuration issues

#### Temporary EC2 Integration Testing

To ensure deployments work in a production-like environment without affecting RC:

- Provision fresh t3.micro instance with same AMI as RC
- Deploy container and configure RDS connection
- Run integration tests (session creation, color storage, API workflows)
- Always cleanup: terminate instance even if tests fail (uses always() in workflow)
- Cost-effective: instance runs for ~5 minutes per build

#### Docker Multi-Stage Build

Optimized for production with a two-stage build:

- **Stage 1:** node:20 full image, builds React with Vite (npm run build)
- **Stage 2:** node:20-slim, copies built frontend + backend, removes dev dependencies
- Final image size: ~200MB vs. ~1GB with single-stage build
- Faster pulls from ECR, lower storage costs

### 7. Challenges & Solutions

#### Challenge: Session Persistence Behind Nginx

**Problem:** Sessions weren't persisting between requests. Users would lose their language selection and color history.

**Solution:** Added app.set('trust proxy', 1) to trust Nginx's X-Forwarded-For headers. This fixed session cookie issues.

#### Challenge: YAML Syntax in GitHub Actions

**Problem:** Workflows failed with cryptic YAML parsing errors, especially with multiline strings in deployment scripts.

**Solution:** Used | for literal block scalars and proper indentation. Validated YAML with online linters before committing.

#### Challenge: Semantic-Release Token Permissions

**Problem:** Semantic-release couldn't create tags with GITHUB_TOKEN - kept getting 403 errors.

**Solution:** Created a Personal Access Token (INFRA_REPO_TOKEN) with repo and workflow scopes. Used persist-credentials: false in checkout.

#### Challenge: Database Migration Safety

**Problem:** Needed migrations to run on every deployment but not fail if tables already existed.

**Solution:** Used CREATE TABLE IF NOT EXISTS and idempotent migration scripts. Tested migration re-runs in integration tests.

#### Challenge: Integration Test Cleanup

**Problem:** Failed integration tests left orphaned EC2 instances running, costing money.

**Solution:** Wrapped cleanup in always() condition in GitHub Actions. Also added tags to instances for manual cleanup scripts.

#### Challenge: Docker Build Context Size

**Problem:** Docker build was slow because it was copying node_modules to build context.

**Solution:** Added .dockerignore file excluding node_modules, .git, and other unnecessary files. Build time dropped from 5min to 2min.

### 8. What I Would Do Next (Production)

The current RC environment is production-ready in terms of code quality and testing,
but lacks the scalability, reliability, and security features needed for a real
production deployment. Here's my roadmap:

#### Production Environment Setup

- Separate production EC2 instance(s) with different security groups
- Private subnets for EC2 and RDS (no public IPs)
- NAT Gateway for outbound internet access from private subnets
- Bastion host or Systems Manager Session Manager for secure SSH access
- Separate RDS instance for production with Multi-AZ deployment

#### Blue-Green Deployment

- Two production environments (blue and green)
- Deploy to inactive environment, test, then switch traffic
- Instant rollback by switching back to previous environment
- Zero-downtime deployments
- Implemented via Application Load Balancer target group switching

#### Auto-Scaling with Application Load Balancer

- Application Load Balancer (ALB) to distribute traffic across multiple EC2 instances
- Auto Scaling Group with min 2, max 10 instances based on CPU/memory metrics
- Health checks at /api/health with automatic instance replacement
- Sticky sessions to maintain user sessions during scale operations
- SSL/TLS termination at ALB with ACM certificate

#### CloudFront CDN

- Global content delivery network for frontend assets
- Cache static assets (JS, CSS, images) at edge locations
- Reduce latency for international users
- DDoS protection via AWS Shield Standard (included with CloudFront)
- Custom domain with HTTPS (e.g., colorperception.rahoi.dev)

#### Route53 DNS

- Custom domain management
- Health checks with failover to backup region
- Weighted routing for gradual rollouts (10% of traffic to new version)
- Geolocation routing for region-specific deployments

#### CloudWatch Monitoring & Alarms

- Application metrics: Request count, latency, error rates
- Infrastructure metrics: CPU, memory, disk usage, network throughput
- Database metrics: Connection count, query latency, replication lag
- Custom metrics: Color classifications per minute, session creation rate
- Alarms with SNS notifications (email/SMS) for:
  - Error rate > 5%
  - Latency P95 > 1000ms
  - Database CPU > 80%
  - Disk usage > 85%
- CloudWatch Logs for centralized log aggregation
- Log insights queries for debugging and analytics

#### Cost Optimization

- Reserved Instances for baseline capacity (40-60% savings vs on-demand)
- Spot Instances for auto-scaling overflow (up to 90% savings)
- RDS reserved instances for 1-year term
- S3 lifecycle policies for old container images (move to Glacier after 90 days)
- CloudWatch Logs retention policies (30 days for debug logs, 1 year for audit logs)
- Compression for CloudFront assets (gzip/brotli)
- Database query optimization (reduce RDS instance size)

#### Disaster Recovery

- RDS automated backups with 30-day retention
- Manual snapshots before major deployments
- Point-in-time recovery within backup window
- Database replication to standby region (cross-region read replica)
- Backup restoration testing (monthly drill)
- Infrastructure as Code (Terraform/CloudFormation) for rapid environment recreation
- Disaster recovery runbook with RTO (2 hours) and RPO (15 minutes) targets

#### Multi-Region Deployment

- Primary region: us-east-1 (Virginia)
- Backup region: us-west-2 (Oregon)
- Route53 health checks with automatic failover
- Database replication for eventual consistency
- Regional CloudFront distributions
- Active-passive configuration initially, move to active-active for true HA

#### Security Enhancements

- AWS WAF (Web Application Firewall) on ALB/CloudFront for SQL injection, XSS protection
- AWS Secrets Manager for database credentials (automatic rotation)
- KMS encryption for RDS at rest and ECR images
- VPC Flow Logs for network monitoring
- GuardDuty for threat detection
- Security Hub for compliance monitoring
- Regular vulnerability scanning with AWS Inspector

#### Advanced CI/CD

- Canary deployments: Deploy to 10% of instances, monitor metrics, roll out gradually
- Automated rollback on alarm triggers (error rate spike)
- Performance testing in staging (load tests with artillery.io or k6)
- Database migration testing with schema comparison
- Approval gate for production deployments (require manual approval from team lead)
- Deployment notifications to Slack/Discord

## Conclusion

This project demonstrates a complete DevOps implementation from local development
to cloud deployment. The three-tier testing strategy ensures high code quality,
while the dual-repository architecture separates concerns between application code
and infrastructure. OIDC authentication eliminates the security risks of static
credentials, and semantic-release automates versioning based on conventional commits.

The current RC environment is fully functional and serves as a solid foundation
for a production rollout. With the enhancements outlined above - particularly
auto-scaling, multi-region deployment, and comprehensive monitoring - this
architecture could easily handle thousands of concurrent users while maintaining
99.9% uptime.

**Current RC Environment:** [http://3.92.207.70:3000](http://3.92.207.70:3000)

</article>
```

**Step 2: Verify file created**

```bash
ls -la frontend/src/content/blog.mdx
wc -l frontend/src/content/blog.mdx
```

Expected: File exists with ~500+ lines of content

**Step 3: Commit**

```bash
git add frontend/src/content/blog.mdx
git commit -m "content: extract blog content to MDX file"
```

---

## Task 5: Refactor Blog Component to Use MDX

**Files:**
- Modify: `frontend/src/components/Blog.jsx`

**Step 1: Update Blog.jsx to import and render MDX**

Replace entire file content:

```javascript
import './Blog.css'
import { useEffect, useRef } from 'react'
import BlogContent from '../content/blog.mdx'

export default function Blog() {
  const mermaidRef = useRef(false)

  useEffect(() => {
    // Initialize and render Mermaid diagrams
    if (window.mermaid && !mermaidRef.current) {
      mermaidRef.current = true
      window.mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        themeVariables: {
          fontSize: '16px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }
      })
      window.mermaid.run()
    }
  }, [])

  return (
    <div className="blog-page">
      <div className="blog-container">
        <BlogContent />
      </div>
    </div>
  )
}
```

**Step 2: Verify syntax**

```bash
cd frontend
npm run lint
```

Expected: No ESLint errors

**Step 3: Commit**

```bash
git add frontend/src/components/Blog.jsx
git commit -m "refactor: convert Blog component to use MDX content"
```

---

## Task 6: Extract About Content to MDX

**Files:**
- Create: `frontend/src/content/about.mdx`
- Reference: `frontend/src/components/About.jsx`

**Step 1: Create about.mdx with extracted content**

Create `frontend/src/content/about.mdx`:

```mdx
# About This Project

## Purpose

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Research Goals

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt
in culpa qui officia deserunt mollit anim id est laborum.

## How It Works

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
veritatis et quasi architecto beatae vitae dicta sunt explicabo.
```

**Step 2: Verify file created**

```bash
ls -la frontend/src/content/about.mdx
cat frontend/src/content/about.mdx
```

Expected: File exists with About page content

**Step 3: Commit**

```bash
git add frontend/src/content/about.mdx
git commit -m "content: extract about content to MDX file"
```

---

## Task 7: Refactor About Component to Use MDX

**Files:**
- Modify: `frontend/src/components/About.jsx`

**Step 1: Update About.jsx to import and render MDX**

Replace entire file content:

```javascript
import './About.css'
import AboutContent from '../content/about.mdx'

export default function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        <AboutContent />
      </div>
    </div>
  )
}
```

**Step 2: Verify syntax**

```bash
cd frontend
npm run lint
```

Expected: No ESLint errors

**Step 3: Commit**

```bash
git add frontend/src/components/About.jsx
git commit -m "refactor: convert About component to use MDX content"
```

---

## Task 8: Test Dev Server and Verify Rendering

**Files:**
- Test: All modified components

**Step 1: Start dev server**

```bash
cd frontend
npm run dev
```

Expected: Server starts on http://localhost:5173 without errors

**Step 2: Test Blog page in browser**

Navigate to http://localhost:5173/blog

Expected:
- Page loads without errors
- All content visible
- Mermaid diagrams render as interactive diagrams (not code blocks)
- Styling preserved

**Step 3: Test About page in browser**

Navigate to http://localhost:5173/about

Expected:
- Page loads without errors
- All content visible
- Styling preserved

**Step 4: Test navigation between pages**

Click between Home, Blog, About, Classify

Expected: All pages load correctly, no console errors

**Step 5: Stop dev server**

Press Ctrl+C in terminal

---

## Task 9: Test Production Build

**Files:**
- Test: Production build

**Step 1: Run production build**

```bash
cd frontend
npm run build
```

Expected: Build completes successfully, no errors

**Step 2: Verify build output**

```bash
ls -la dist/
```

Expected: dist/ directory contains built assets

**Step 3: Preview production build**

```bash
npm run preview
```

Expected: Preview server starts, navigate to blog and about pages to verify they work

**Step 4: Stop preview server**

Press Ctrl+C in terminal

**Step 5: Clean up build artifacts**

```bash
rm -rf dist/
```

---

## Task 10: Final Commit and Push

**Files:**
- All changes

**Step 1: Review all changes**

```bash
git status
git log --oneline -10
```

Expected: See all commits from this implementation

**Step 2: Push to main**

```bash
git push origin main
```

Expected: Push succeeds

**Step 3: Verify semantic-release triggers**

Wait 30 seconds, then check:

```bash
git fetch --tags
git tag --list 'v*-rc.*' --sort=-v:refname | head -1
```

Expected: New RC tag created (e.g., v1.4.8-rc.1)

---

## Testing Checklist

After deployment to RC environment:

- [ ] Navigate to https://rc.rahoi.dev/blog
- [ ] Verify all blog content displays correctly
- [ ] Verify Mermaid diagrams render as interactive diagrams
- [ ] Verify diagram text is readable (neutral theme)
- [ ] Navigate to https://rc.rahoi.dev/about
- [ ] Verify about content displays correctly
- [ ] Test navigation between all pages
- [ ] Check browser console for errors (should be none)
- [ ] Verify styling matches original pages

## Rollback Plan

If MDX rendering fails in production:

1. Revert commits: `git revert HEAD~10..HEAD`
2. Push revert: `git push origin main`
3. Wait for new RC build to deploy
4. Debug MDX issues locally before retrying
