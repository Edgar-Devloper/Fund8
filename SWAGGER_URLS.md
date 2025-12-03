# URLs de Swagger para diferentes entornos

## URLs Confirmadas y Funcionales

### Produccion
- **Swagger:** https://defily-backend-version2-production.up.railway.app/docs ✅
- **API Base:** https://defily-backend-version2-production.up.railway.app/api

### Migration (Encontrada en Bruno collections)
- **Swagger:** https://defily-backend-version2-migration.up.railway.app/docs ✅
- **API Base:** https://defily-backend-version2-migration.up.railway.app/api
- **Nota:** Este entorno puede tener los endpoints nuevos que buscas

## URLs Probables para Beta/Develop

Si los entornos beta o develop existen en Railway, las URLs podrian ser:

### Opcion 1: Nombres de rama
- **Beta:** https://defily-backend-version2-beta.up.railway.app/docs
- **Develop:** https://defily-backend-version2-develop.up.railway.app/docs
- **Staging:** https://defily-backend-version2-staging.up.railway.app/docs

### Opcion 2: Nombres alternativos
- **Dev:** https://defily-backend-version2-dev.up.railway.app/docs
- **Development:** https://defily-backend-version2-development.up.railway.app/docs
- **Test:** https://defily-backend-version2-test.up.railway.app/docs

### Opcion 3: Con prefijo de rama
- **Beta:** https://beta-defily-backend-version2.up.railway.app/docs
- **Develop:** https://develop-defily-backend-version2.up.railway.app/docs

## Como encontrar las URLs correctas

1. **Revisar Railway Dashboard:**
   - Entra a https://railway.app
   - Busca el proyecto "defily-backend-version2"
   - Revisa los servicios/entornos desplegados
   - Cada servicio tiene su propia URL

2. **Revisar variables de entorno:**
   - En Railway, cada servicio tiene variables de entorno
   - Busca variables como `RAILWAY_ENVIRONMENT` o `NODE_ENV`
   - Las URLs se generan automaticamente basadas en el nombre del servicio

3. **Revisar el repositorio del backend:**
   - Busca archivos como `railway.json` o configuraciones de deployment
   - Revisa los workflows de CI/CD (GitHub Actions, etc.)
   - Pueden tener las URLs de los diferentes entornos

4. **Preguntar al equipo:**
   - El equipo de backend deberia tener documentadas las URLs
   - O pueden darte acceso al dashboard de Railway

## Nota

Swagger esta configurado en la ruta `/docs` del backend.
Si conoces la URL base del backend (sin `/api`), agrega `/docs` al final.

Ejemplo:
- Backend URL: `https://defily-backend-version2-production.up.railway.app`
- Swagger URL: `https://defily-backend-version2-production.up.railway.app/docs`

