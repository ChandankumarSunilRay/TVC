#!/usr/bin/env bash
set -Eeuo pipefail

# Install this reviewed script once as /usr/local/sbin/deploy-elearning, root:root 0755.
[[ $EUID -eq 0 ]] || { echo 'Run through Systems Manager as root'; exit 1; }
release=${1:?Release ID required}
bucket=${2:?Deployment bucket required}
region=${3:?AWS region required}
[[ $release =~ ^[a-f0-9]{40}-[0-9]+-[0-9]+$ ]] || exit 1
[[ $bucket =~ ^[a-z0-9][a-z0-9.-]+$ ]] || exit 1
[[ $region =~ ^[a-z0-9-]+$ ]] || exit 1

base=/opt/elearning
target="$base/releases/$release"
exec 9>/var/lock/elearning-deploy.lock
flock -n 9 || { echo 'Another deployment is running'; exit 1; }
test -f "$base/shared/server.env"
test ! -e "$target"
# readlink -f can return the path itself when current does not exist. Once
# current is created, that value would turn a first-release rollback into a loop.
previous=''
if [[ -L "$base/current" ]]; then
  resolved=$(readlink -e "$base/current" || true)
  if [[ -n $resolved && $resolved == "$base/releases/"* && -d "$resolved/server" ]]; then
    previous=$resolved
  fi
elif [[ -e "$base/current" ]]; then
  echo 'current must be a release symlink; refusing to replace a real directory'
  exit 1
fi
switched=false
rollback() {
  result=$?
  trap - ERR
  if [[ $switched == true ]]; then
    if [[ -n $previous && -d $previous ]]; then
      ln -sfnT "$previous" "$base/current.next"
      mv -Tf "$base/current.next" "$base/current"
      systemctl restart elearning || true
      echo 'Restored previous release; inspect service logs and verify its health.'
    else
      systemctl stop elearning || true
      echo 'First deployment failed; service stopped. No previous release exists.'
    fi
  fi
  exit "$result"
}
trap rollback ERR

mkdir -p "$target"
aws s3 cp "s3://$bucket/releases/$release.tar.gz" "$target/release.tar.gz" --region "$region" --only-show-errors
tar -xzf "$target/release.tar.gz" -C "$target" --no-same-owner
test -f "$target/frontend/dist/index.html"
test -f "$target/server/index.js"
ln -s "$base/shared/server.env" "$target/server/.env"
mkdir -p "$base/shared/uploads"
ln -s "$base/shared/uploads" "$target/server/uploads"
chown -hR elearning:elearning "$target"
runuser -u elearning -- bash -c 'cd "$1/server" && npm ci --omit=dev --no-audit --no-fund' bash "$target"
ln -sfnT "$target" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"
switched=true
systemctl restart elearning
for attempt in $(seq 1 30); do
  if systemctl is-active --quiet elearning && curl --fail --silent --max-time 3 http://127.0.0.1:5000/ >/dev/null; then
    echo "Release $release is healthy"
    exit 0
  fi
  sleep 2
done
echo 'New release failed its database readiness check'
false
