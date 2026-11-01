#!/usr/bin/env bash
set -euo pipefail

command -v keytool >/dev/null || { echo "Falta keytool. En Termux: pkg install openjdk-17"; exit 1; }

OUT="keeplink.keystore"
[ -e "$OUT" ] && { echo "Ya existe $OUT. No se sobrescribe."; exit 1; }

read -rp "Alias de la clave [keeplink]: " ALIAS
ALIAS=${ALIAS:-keeplink}
read -rp "Nombre del titular [KeepLink]: " CN
CN=${CN:-KeepLink}
read -rsp "Contraseña (mínimo 6 caracteres): " PASS; echo
read -rsp "Repite la contraseña: " PASS2; echo

[ "$PASS" = "$PASS2" ] || { echo "Las contraseñas no coinciden."; exit 1; }
[ ${#PASS} -ge 6 ] || { echo "La contraseña es demasiado corta."; exit 1; }

keytool -genkeypair -storetype PKCS12 -keystore "$OUT" -alias "$ALIAS" \
  -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$PASS" -keypass "$PASS" -dname "CN=$CN"

base64 -w 0 "$OUT" > keystore.b64

echo
echo "Listo. Crea estos 4 secretos en GitHub (Settings > Secrets and variables > Actions):"
echo "  KEYSTORE_BASE64    -> contenido del archivo keystore.b64"
echo "  KEYSTORE_PASSWORD  -> la contraseña que acabas de escribir"
echo "  KEY_PASSWORD       -> la misma contraseña"
echo "  KEY_ALIAS          -> $ALIAS"
echo
echo "Guarda $OUT en un lugar seguro y borra keystore.b64 cuando termines. No los subas al repositorio."
