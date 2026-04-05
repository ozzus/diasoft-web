#!/bin/sh
set -eu

contracts_root="${CONTRACTS_WORKDIR:-.ci-contracts}"
if [ -n "${PLATFORM_CONTRACT_PATH:-}" ] && [ -f "${PLATFORM_CONTRACT_PATH}" ]; then
  echo "Using platform contract: ${PLATFORM_CONTRACT_PATH}"
  export PLATFORM_CONTRACT_PATH
  exit 0
fi

fetch_contracts_package() {
  project_id="$1"
  version="$2"
  package_name="$3"

  if [ -z "$project_id" ] || [ -z "$version" ]; then
    return 1
  fi

  if [ -z "${CI_API_V4_URL:-}" ] || [ -z "${CI_JOB_TOKEN:-}" ]; then
    echo "CI_API_V4_URL and CI_JOB_TOKEN are required to download contracts" >&2
    exit 1
  fi

  mkdir -p "$contracts_root"
  archive_path="$contracts_root/$package_name.tar.gz"
  extract_dir="$contracts_root/$package_name"

  curl --fail --show-error --silent \
    --header "JOB-TOKEN: $CI_JOB_TOKEN" \
    --output "$archive_path" \
    "${CI_API_V4_URL}/projects/${project_id}/packages/generic/${package_name}/${version}/${package_name}.tar.gz"

  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"
  tar -xzf "$archive_path" -C "$extract_dir"
}

platform_contract_path="../diasoft-gateway/api/openapi/openapi.yaml"

if fetch_contracts_package "${GATEWAY_CONTRACTS_PROJECT_ID:-}" "${GATEWAY_CONTRACTS_VERSION:-}" "gateway-contracts"; then
  platform_contract_path="$contracts_root/gateway-contracts/gateway-contracts/api/openapi/openapi.yaml"
fi

export PLATFORM_CONTRACT_PATH="$platform_contract_path"

echo "Using platform contract: $PLATFORM_CONTRACT_PATH"
