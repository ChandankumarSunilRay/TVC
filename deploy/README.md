# GitHub Actions to EC2

This pipeline deploys the repository containing this document, whose root has
`frontend/`, `server/`, and `.github/`. Push this repository to GitHub, not the
parent folder containing the older application. Deployment is not active until
the AWS resources and GitHub variables below are configured.

Pull requests to `main` run backend tests, frontend lint, and the frontend build.
Pushes to `main` run the same checks and deploy the resulting artifact. Manual
runs deploy only when the selected branch is `main`. Deployment jobs are
serialized. Secrets and existing uploaded files are not included in artifacts.

## 1. Prepare an Ubuntu EC2 instance

Install Node.js 22 (with `node` available at `/usr/bin/node`), npm, Nginx,
AWS CLI v2, curl, and the SSM Agent. Verify these commands before proceeding:

```bash
node --version
npm --version
aws --version
nginx -v
sudo systemctl status amazon-ssm-agent
```

Some Ubuntu SSM installations use the snap service name instead. Confirm the
instance appears online in Systems Manager before attempting a deployment.
SSM needs outbound HTTPS access to the appropriate AWS endpoints. No inbound
SSH connection from GitHub Actions is required.

Expose ports 80 and 443 to visitors in the EC2 security group. Do not expose
port 5000 or the database port publicly. Restrict any administrative SSH access.

Create the application account and persistent directories:

```bash
sudo useradd --system --create-home --home-dir /var/lib/elearning --shell /usr/sbin/nologin elearning
sudo install -d -m 755 /opt/elearning /opt/elearning/releases
sudo install -d -m 750 -o root -g elearning /opt/elearning/shared
sudo install -d -m 750 -o elearning -g elearning /opt/elearning/shared/uploads
sudo install -m 640 -o root -g elearning /dev/null /opt/elearning/shared/server.env
sudoedit /opt/elearning/shared/server.env
```

Create these values in `server.env` using dotenv syntax; supply actual secrets
only on the server. Use test payments while testing staging:

```dotenv
PORT=5000
DB=mongodb+srv://REPLACE_WITH_DATABASE_CONNECTION
Jwt_Sec=REPLACE_WITH_RANDOM_SECRET
Gmail=REPLACE_WITH_SENDER_EMAIL
Password=REPLACE_WITH_EMAIL_APP_PASSWORD
frontendurl=https://REPLACE_WITH_DOMAIN
RAZORPAY_MODE=test
Razorpay_Key=rzp_test_REPLACE
Razorpay_Secret=REPLACE
AWS_REGION=ap-south-1
AWS_S3_BUCKET=REPLACE_WITH_PRIVATE_MEDIA_BUCKET
```

Keep the media bucket private. Grant the EC2 instance role access to its media
prefixes as described in `AWS_VIDEO_SETUP.md`. Give the instance role
`AmazonSSMManagedInstanceCore`, plus `s3:GetObject` on
`arn:aws:s3:::DEPLOY_BUCKET/releases/*` for the separate private deployment bucket.
Use the instance role rather than putting AWS access keys in the environment.

From a reviewed checkout on the instance, install the deployment files once:

```bash
sudo install -m 755 -o root -g root deploy/deploy-elearning.sh /usr/local/sbin/deploy-elearning
sudo install -m 644 deploy/elearning.service /etc/systemd/system/elearning.service
sudo systemctl daemon-reload
sudo systemctl enable elearning
sudo install -m 644 deploy/nginx.conf /etc/nginx/sites-available/elearning
sudoedit /etc/nginx/sites-available/elearning
sudo ln -s /etc/nginx/sites-available/elearning /etc/nginx/sites-enabled/elearning
sudo nginx -t
sudo systemctl reload nginx
```

Replace `example.com` in the Nginx configuration. Disable an existing default
site if it conflicts. Set up DNS and HTTPS (for example using Certbot for Nginx)
before public use. Node is started by the first successful deployment. Nginx
serves React routes and proxies `/api/` and legacy image requests to Node.

If you have legacy local images, copy them into `shared/uploads` with ownership
`elearning:elearning`. Existing local videos need migration to private S3 before
playback; the migration scripts referenced by package.json are currently missing.
This pipeline deliberately does not run database or media migrations.

## 2. Create the GitHub AWS role

Create an IAM OpenID Connect provider with URL
`https://token.actions.githubusercontent.com` and audience `sts.amazonaws.com`.
Create a deployment role with this trust policy, substituting your account,
GitHub owner, and repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"},
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {"StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
      "token.actions.githubusercontent.com:sub": "repo:OWNER/REPOSITORY:environment:production"
    }}
  }]
}
```

Give that role this deployment policy, substituting all uppercase placeholders:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:PutObject",
      "Resource": "arn:aws:s3:::DEPLOY_BUCKET/releases/*"
    },
    {
      "Effect": "Allow",
      "Action": "ssm:SendCommand",
      "Resource": [
        "arn:aws:ssm:REGION::document/AWS-RunShellScript",
        "arn:aws:ec2:REGION:ACCOUNT_ID:instance/INSTANCE_ID"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "ssm:GetCommandInvocation",
      "Resource": "*"
    }
  ]
}
```

Sending shell commands through SSM grants deployment authority on that instance.
Protect `main`, review workflow changes, and restrict the GitHub environment to
`main`. Configure bucket encryption and block public access; if using a customer
KMS key, add the matching KMS permissions for both roles. A bucket lifecycle
policy can expire old deployment archives independently of private media.

## 3. Configure GitHub

In repository Settings → Environments, create `production`. Restrict deployment
branches to `main`. Leave required reviewers disabled if deployment should be
fully automatic. Environment features depend on repository visibility and plan.

Add these environment variables (Settings → Environments → production):

| Variable | Example |
| --- | --- |
| `AWS_REGION` | `ap-south-1` |
| `AWS_DEPLOY_ROLE_ARN` | `arn:aws:iam::123456789012:role/github-elearning-deploy` |
| `DEPLOY_BUCKET` | Your private deployment artifact bucket |
| `EC2_INSTANCE_ID` | `i-0123456789abcdef0` |

No permanent AWS key or SSH private key is needed in GitHub. The frontend uses
same-origin `/api` requests through Nginx. Do not supply localhost as the
production API URL. Commit both package lockfiles so `npm ci` is reproducible.

## 4. First release and checks

Commit the workflow and deployment files and push `main`. Watch the repository's
Actions tab. The deploy job uploads the tested archive, sends an SSM command,
and waits for its final result. For deployment errors, inspect the command in
Systems Manager and `journalctl -u elearning` on EC2.

The script installs dependencies as the unprivileged app user, switches a
symlink atomically, restarts the service, and checks the backend's database
readiness endpoint for up to about a minute. Failure restores the previous
release and restarts it; first-release failure stops the service. Old release
directories are retained. Periodically remove unneeded releases after verifying
the current and rollback versions. The first setup and changes to the reviewed
deployment script, systemd unit, or Nginx configuration require separate server
installation; application pushes deploy automatically.

A single EC2 service restart can cause brief downtime. This is not a rolling or
zero-downtime deployment. Database readiness does not verify email, S3, Razorpay,
public HTTPS, or browser flows. Verify those on staging before real payments.
If an Actions run is cancelled after sending SSM, the command may continue:
inspect its final status before retrying. Database schema changes must remain
compatible with the previous release for application rollback to be safe.

References: [GitHub OIDC with AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws),
[AWS Run Command setup](https://docs.aws.amazon.com/systems-manager/latest/userguide/run-command-setting-up.html).
