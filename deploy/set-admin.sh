#!/usr/bin/env bash
# Sets the admin e-mail and password on the server. The password is typed here and only its
# bcrypt hash is stored in /opt/portfolio/.env. Usage: bash /opt/portfolio/app/deploy/set-admin.sh
set -euo pipefail
ENV_FILE=/opt/portfolio/.env
cd "$(dirname "$0")"

read -rp "E-mail для входа в админку: " email
read -rsp "Пароль (от 12 символов): " password; echo
read -rsp "Ещё раз: " again; echo
[[ "$password" == "$again" ]] || { echo "Пароли не совпали"; exit 1; }
[[ ${#password} -ge 12 ]] || { echo "Нужно не меньше 12 символов"; exit 1; }

# Passed through the environment, not argv, so it never shows up in the process list.
hash=$(ADMIN_PW="$password" docker compose --env-file "$ENV_FILE" run --rm --no-deps -T -e ADMIN_PW api \
  node -e "console.log(require('bcryptjs').hashSync(process.env.ADMIN_PW, 12))")
sed -i '/^ADMIN_EMAIL=/d;/^ADMIN_PASSWORD_HASH=/d' "$ENV_FILE"
printf "ADMIN_EMAIL=%s\nADMIN_PASSWORD_HASH='%s'\n" "$email" "$hash" >> "$ENV_FILE"
docker compose --env-file "$ENV_FILE" up -d api
echo "Готово: вход — $email"
