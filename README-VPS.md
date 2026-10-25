# FleetMaster Hub — VPS `srv1722607`

Servidor **compartido** con auditcore (producción y staging), ubora360 y censo.
Todo lo de este documento aplica solo a FleetMaster.

## Rutas

| Qué | Dónde |
|---|---|
| Proyecto | `/opt/fleetmasterhub` (clon de `mathewsrick/FleetMaster-Pro`) |
| Compose | `/opt/fleetmasterhub/docker-compose.vps.yml` (versionado en el repo) |
| Dockerfile | `/opt/fleetmasterhub/Dockerfile.vps` (solo existe en el servidor) |
| Variables | `/opt/fleetmasterhub/backend/.env.prod` (no está en git) |
| Volumen de fotos/documentos | `fleetmasterhub_uploads` |
| Volumen viejo (respaldo) | `fleetmasterhub_fleetmaster_uploads` |

`Dockerfile.vps` no está en git porque lleva dos arreglos propios del servidor:
fija la versión de pnpm y ejecuta `./node_modules/.bin/prisma` en el `CMD`.

## Proxy y TLS

- El proxy es el contenedor **`edge-caddy`** (`caddy:2.8-alpine`), unido a la red Docker **`edge`**.
- `edge-caddy` ocupa `0.0.0.0:80` y `0.0.0.0:443`. FleetMaster **no publica puertos**: solo `expose: "3001"` dentro de la red `edge`.
- Caddyfile del servidor: `/opt/auditcore/deploy/Caddyfile`
  - `fleetmasterhub.com` → `reverse_proxy fleetmaster:3001`
  - `www.fleetmasterhub.com` → redirección permanente al dominio principal

## Desplegar

```bash
cd /opt/fleetmasterhub
git pull --ff-only origin main
./deploy.sh
```

`deploy.sh` construye con `Dockerfile.vps` y ejecuta:

```bash
docker compose -f docker-compose.vps.yml up -d --build --remove-orphans
```

## Verificar

```bash
docker inspect -f '{{.State.Health.Status}}' fleetmaster
docker inspect -f '{{json .NetworkSettings.Networks}}' fleetmaster   # debe incluir "edge"
curl -sI https://fleetmasterhub.com | head -1                        # HTTP/2 200
docker logs fleetmaster --tail=100
docker run --rm -v fleetmasterhub_uploads:/v alpine sh -c 'find /v -type f | wc -l'
```

Si el sitio responde 502, casi siempre es que el contenedor no está en la red `edge`:

```bash
docker logs edge-caddy --tail=30
docker exec edge-caddy cat /etc/caddy/Caddyfile | grep -A4 fleetmasterhub.com
```

## No usar en este servidor

- **`redeploy.sh`** ni **`docker-compose.prod.yml`**: el servicio nginx de ese compose publica 80/443 y choca con `edge-caddy` (`Bind for 0.0.0.0:80 failed: port is already allocated`). Además construyen con el `Dockerfile` del repo, no con `Dockerfile.vps`.
- **`docker system prune -a --volumes`**, **`docker volume prune`**, **`docker compose down -v`**: afectan a todos los proyectos del host.
- Recrear el contenedor sin `docker-compose.vps.yml`: se pierde la pertenencia a la red `edge` y el sitio queda en 502.

## Notas

- Si `git pull` falla porque `docker-compose.vps.yml` o `deploy.sh` existen sin seguimiento (una sola vez, al versionarlos):

  ```bash
  cd /opt/fleetmasterhub
  mv docker-compose.vps.yml /root/docker-compose.vps.yml.bak
  mv deploy.sh /root/deploy.sh.bak
  git pull --ff-only origin main
  ```

- Producción depende de la red y del Caddy de un proyecto de **staging** de auditcore. Si bajan ese staging, FleetMaster se cae.
