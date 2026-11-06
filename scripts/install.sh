#!/usr/bin/env bash
# ==============================================================================
# DF71 Zero-Install Wrapper Script
# Installs a global df71 command that executes df71 without local dependencies.
# Usage: curl -fsSL https://raw.githubusercontent.com/ivan-varabyou/df71/main/scripts/install.sh | bash
# ==============================================================================
set -euo pipefail

INSTALL_DIR="${HOME}/.local/bin"
if [ "$(id -u)" -eq 0 ]; then
  INSTALL_DIR="/usr/local/bin"
fi

mkdir -p "${INSTALL_DIR}"
TARGET="${INSTALL_DIR}/df71"

cat <<'EOF' > "${TARGET}"
#!/usr/bin/env bash
# DF71 Dark Factory Launcher
exec npx --yes df71@latest "$@"
EOF

chmod +x "${TARGET}"

echo "✅ [df71] successfully installed to ${TARGET}"
if ! echo "${PATH}" | grep -q "${INSTALL_DIR}"; then
  echo "👉 Add ${INSTALL_DIR} to your PATH: export PATH=\"${INSTALL_DIR}:\$PATH\""
fi
echo "Run: df71 --help"
