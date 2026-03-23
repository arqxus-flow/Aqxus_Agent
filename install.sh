#!/bin/sh
set -e

REPO="arqxus-flow/Aqxus_Agent"
BINARY="orbi"
INSTALL_DIR="${ORBI_INSTALL_DIR:-/usr/local/bin}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

info() { printf "${CYAN}%s${NC}\n" "$1"; }
success() { printf "${GREEN}%s${NC}\n" "$1"; }
error() { printf "${RED}%s${NC}\n" "$1" >&2; exit 1; }

# Detect OS
detect_os() {
  case "$(uname -s)" in
    Darwin*) echo "darwin" ;;
    Linux*)  echo "linux" ;;
    MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
    *) error "Unsupported OS: $(uname -s)" ;;
  esac
}

# Detect architecture
detect_arch() {
  case "$(uname -m)" in
    x86_64|amd64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *) error "Unsupported architecture: $(uname -m)" ;;
  esac
}

# Get latest version from GitHub
get_latest_version() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/'
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/'
  else
    error "curl or wget is required"
  fi
}

# Download file
download() {
  local url="$1" dest="$2"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$url" -o "$dest"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$dest" "$url"
  fi
}

main() {
  local os arch version asset_name ext url tmpdir

  os=$(detect_os)
  arch=$(detect_arch)
  version="${ORBI_VERSION:-$(get_latest_version)}"

  if [ -z "$version" ]; then
    error "Could not determine latest version"
  fi

  info "Installing Orbi CLI ${version}..."
  info "  OS: ${os}, Arch: ${arch}"

  # Determine asset name
  if [ "$os" = "linux" ]; then
    ext="tar.gz"
  else
    ext="zip"
  fi
  asset_name="${BINARY}-${os}-${arch}.${ext}"
  url="https://github.com/${REPO}/releases/download/${version}/${asset_name}"

  info "  Downloading: ${url}"

  # Download to temp
  tmpdir=$(mktemp -d)
  trap 'rm -rf "$tmpdir"' EXIT

  download "$url" "${tmpdir}/${asset_name}"

  # Extract
  info "  Extracting..."
  if [ "$ext" = "tar.gz" ]; then
    tar -xzf "${tmpdir}/${asset_name}" -C "$tmpdir"
  else
    if command -v unzip >/dev/null 2>&1; then
      unzip -qo "${tmpdir}/${asset_name}" -d "$tmpdir"
    else
      error "unzip is required to extract .zip files"
    fi
  fi

  # Find binary
  local binary_path=""
  if [ -f "${tmpdir}/${BINARY}" ]; then
    binary_path="${tmpdir}/${BINARY}"
  elif [ -f "${tmpdir}/bin/${BINARY}" ]; then
    binary_path="${tmpdir}/bin/${BINARY}"
  else
    # Search for it
    binary_path=$(find "$tmpdir" -name "$BINARY" -type f | head -1)
  fi

  if [ -z "$binary_path" ] || [ ! -f "$binary_path" ]; then
    error "Binary not found in archive"
  fi

  # Install
  chmod +x "$binary_path"

  if [ -w "$INSTALL_DIR" ]; then
    mv "$binary_path" "${INSTALL_DIR}/${BINARY}"
  else
    info "  Need sudo to install to ${INSTALL_DIR}"
    sudo mv "$binary_path" "${INSTALL_DIR}/${BINARY}"
  fi

  success ""
  success "Orbi CLI ${version} installed successfully!"
  success "  Location: ${INSTALL_DIR}/${BINARY}"
  success ""
  success "Run 'orbi' to get started."
}

main
