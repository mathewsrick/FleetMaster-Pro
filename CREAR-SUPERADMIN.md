# 🔐 Crear SuperAdmin - Guía Rápida

## 📝 Descripción

Script interactivo para crear un usuario SuperAdmin en FleetMaster Pro. El script:

- ✅ Solicita los datos necesarios de forma interactiva
- ✅ Valida el formato de los datos (email, password, etc)
- ✅ Verifica que no exista un usuario duplicado
- ✅ Crea el SuperAdmin con plan Enterprise sin expiración
- ✅ Funciona tanto en Docker como en modo local

## 🚀 Uso

### En Producción (Docker)

```bash
cd ~/fleetmasterhub
./create-superadmin.sh
```

### En Desarrollo (Local)

```bash
cd /path/to/FleetMaster-Pro
./create-superadmin.sh
```

## 📋 Datos Solicitados

El script te pedirá:

1. **👤 Username**
   - Sin espacios
   - Solo letras, números, guiones y guiones bajos
   - Ejemplo: `admin`, `superadmin`, `master_admin`

2. **📧 Email**
   - Formato válido de email
   - Ejemplo: `admin@fleetmasterhub.com`

3. **🔒 Password**
   - Mínimo 8 caracteres
   - Se pedirá dos veces para confirmar
   - No se muestra en pantalla (input oculto)

## ✅ Ejemplo de Uso

```bash
$ ./create-superadmin.sh

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║          🔐 Generador de SuperAdmin                     ║
║             FleetMaster Pro v2.0                        ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Verificando prerequisitos...
✓ Prerequisitos OK

Ingresa los datos del SuperAdmin:

👤 Username (sin espacios):
admin

📧 Email:
admin@fleetmasterhub.com

🔒 Password (mínimo 8 caracteres):
********

🔒 Confirma el password:
********

╔══════════════════════════════════════════════════════════╗
║ Confirma los datos del SuperAdmin:                      ║
╚══════════════════════════════════════════════════════════╝

Username: admin
Email:    admin@fleetmasterhub.com
Password: ********

¿Los datos son correctos? (y/n):
y

Creando SuperAdmin...
Ejecutando en contenedor Docker...
✅ SuperAdmin creado exitosamente
ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Username: admin
Email: admin@fleetmasterhub.com
Role: SUPERADMIN

╔══════════════════════════════════════════════════════════╗
║                                                          ║
║              ✅ SUPERADMIN CREADO                       ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Credenciales de acceso:
  Username: admin
  Email:    admin@fleetmasterhub.com
  Password: ********

⚠️  Guarda estas credenciales en un lugar seguro
🌐 Accede a: https://fleetmasterhub.com/#/login
```

## 🔍 Verificación

Después de crear el SuperAdmin, verifica que funcione:

1. Abre: `https://fleetmasterhub.com/#/login`
2. Ingresa las credenciales creadas
3. Deberías ver el dashboard con acceso completo

## 🐛 Troubleshooting

### Error: "Ya existe un usuario con ese username o email"

**Solución:** Usa un username o email diferente, o elimina el usuario existente desde la base de datos.

```bash
# Ver usuarios existentes
docker exec -it fleetmaster sh
cd /app/backend
npx prisma studio
```

### Error: "Docker no está corriendo"

**Solución:** Inicia Docker o los contenedores:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Error: "Error de conexión a la base de datos"

**Solución:** Verifica que `DATABASE_URL` esté configurado correctamente en `backend/.env.prod`:

```bash
cat backend/.env.prod | grep DATABASE_URL
```

### Script no ejecutable

**Solución:** Dale permisos de ejecución:

```bash
chmod +x create-superadmin.sh
```

## 🔄 Alternativa: Usar variables de entorno

Si prefieres no usar el script interactivo, puedes crear el SuperAdmin usando el método original con variables de entorno:

```bash
# 1. Editar .env.prod
nano backend/.env.prod

# 2. Agregar:
CREATE_SUPERADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordSegura123!
ADMIN_EMAIL=admin@fleetmasterhub.com

# 3. Reiniciar contenedor
docker-compose -f docker-compose.prod.yml restart fleetmaster

# 4. Esperar 10 segundos para que se cree

# 5. IMPORTANTE: Comentar las variables y reiniciar
nano backend/.env.prod  # Comentar CREATE_SUPERADMIN=true
docker-compose -f docker-compose.prod.yml restart
```

## ⚠️ Seguridad

- 🔒 El script NO guarda las credenciales en ningún lado
- 🔒 El password se hashea con bcrypt antes de guardarse
- 🔒 El password no se muestra en pantalla al ingresarlo
- 🔒 Guarda las credenciales en un gestor de contraseñas seguro

## 📝 Notas

- El SuperAdmin creado tiene plan **Enterprise** sin expiración
- El usuario está confirmado automáticamente (no necesita confirmar email)
- Puede acceder al panel de SuperAdmin en `/superadmin`
- Tiene acceso completo a todas las funcionalidades del sistema

## 🤝 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker logs fleetmaster --tail=50`
2. Verifica la configuración: `cat backend/.env.prod`
3. Consulta la documentación completa en `RESUMEN-FINAL.md`

---

**Script:** `create-superadmin.sh`  
**Versión:** 2.0  
**Última actualización:** Febrero 2026
