#!/usr/bin/env bash
dir="$(cd "$(dirname "$0")" && pwd)"
missing=()
found=0
while read -r name; do
  [ -z "$name" ] && continue
  if [ -n "${!name:-}" ]; then found=$((found + 1)); else missing+=("$name"); fi
done < "$dir/required-secrets.txt"

if [ "$found" -eq 0 ]; then
  echo "::warning::No hay secretos de firma. El APK se firmará con la clave de depuración."
  exit 0
fi
if [ "${#missing[@]}" -gt 0 ]; then
  echo "::error::Faltan secretos de GitHub: ${missing[*]}. Ver keytool/README.md"
  exit 1
fi
echo "Secretos de firma completos."
