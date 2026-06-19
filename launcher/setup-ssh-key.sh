#!/bin/bash
# =============================================================
#  ONE-TIME SETUP: Copy your SSH key to VPS so no password
#  needed when double-clicking the launcher
#  Run once: bash setup-ssh-key.sh
# =============================================================

VPS_IP="178.83.59.53"
VPS_USER="Administrator"

echo "Setting up passwordless SSH to VPS..."
echo "You will be asked for your VPS password ONE TIME only."
echo ""

# Generate SSH key if not exists
if [ ! -f ~/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N "" -q
  echo "SSH key generated."
fi

# Copy key to VPS
ssh-copy-id -i ~/.ssh/id_rsa.pub ${VPS_USER}@${VPS_IP}

echo ""
echo "Setup complete! You can now double-click launch-engine.sh without password."
