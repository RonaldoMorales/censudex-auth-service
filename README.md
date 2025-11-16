# Censudex Auth Service

Microservicio de autenticación para el sistema Censudex. Maneja la autenticación de usuarios mediante JWT (JSON Web Tokens) y gestiona sesiones activas con una lista de bloqueo (blocklist).

## Arquitectura

Microservicio independiente que se comunica con el Clients Service para validar credenciales y genera tokens JWT para autenticación y autorización.

### Patrón de Diseño

- **Microservices Pattern**: Servicio independiente enfocado únicamente en autenticación
- **Stateless Authentication**: Uso de JWT para autenticación sin estado
- **Blocklist Pattern**: Gestión de tokens invalidados para logout seguro

### Comunicación

- **HTTP REST**: Expone endpoints HTTP para login, validación y logout
- **Cliente HTTP**: Se comunica con Clients Service para validar usuarios

## Requisitos

- Node.js 16 o superior
- npm (gestor de paquetes de Node.js)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/RonaldoMorales/censudex-auth-service.git
cd censudex-auth-service
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
PORT=3002
JWT_SECRET=tu_secreto_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=24h
CLIENTS_SERVICE_URL=http://localhost:3001/api/clients
NODE_ENV=development
```

## Ejecución

### Modo desarrollo

```bash
npm run dev
```

### Modo producción

```bash
npm start
```

El servidor estará disponible en `http://localhost:3002`

## Endpoints Disponibles

### 1. Iniciar Sesión

**POST** `/api/auth/login`

Autentica un usuario y genera un token JWT.

**Request:**
```json
{
  "identifier": "admin@censudex.cl",
  "password": "Admin123!"
}
```

**Response (200):**
```json
{
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-del-usuario",
    "username": "admin",
    "email": "admin@censudex.cl",
    "role": "admin"
  }
}
```

**Errores:**
- `401`: Credenciales inválidas
- `403`: Usuario inactivo

### 2. Validar Token

**GET** `/api/auth/validate-token`

Valida si un token JWT es válido y no ha sido invalidado.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "valid": true,
  "user": {
    "id": "uuid-del-usuario",
    "role": "admin",
    "username": "admin"
  }
}
```

**Errores:**
- `401`: Token inválido, expirado o bloqueado

### 3. Cerrar Sesión

**POST** `/api/auth/logout`

Invalida un token activo agregándolo a la blocklist.

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200):**
```json
{
  "message": "Sesion cerrada exitosamente"
}
```

### 4. Health Check

**GET** `/health`

Verifica el estado del servicio.

**Response (200):**
```json
{
  "status": "OK",
  "service": "Auth Service"
}
```

## Estructura del Proyecto

```
censudex-auth-service/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── routes/
│   │   └── authRoutes.js
│   ├── utils/
│   │   └── tokenBlocklist.js
│   ├── validators/
│   │   └── authValidator.js
│   └── server.js
├── .env
├── .gitignore
├── package.json
└── README.md
```

## Funcionamiento

### 1. Login

1. Usuario envía credenciales (email/username + password)
2. Auth Service consulta al Clients Service
3. Valida que el usuario existe y está activo
4. Compara la contraseña con bcrypt
5. Si es válida, genera un JWT con:
   - ID del usuario
   - Rol (client/admin)
   - Username
   - Fecha de expiración (24h por defecto)
6. Retorna el token al cliente

### 2. Validación de Token

1. API Gateway envía token en el header
2. Auth Service verifica:
   - Firma del token (usando JWT_SECRET)
   - Fecha de expiración
   - Si está en la blocklist
3. Si es válido, retorna información del usuario
4. Si no, retorna error 401

### 3. Logout

1. Usuario envía token a invalidar
2. Auth Service agrega el token a la blocklist
3. El token ya no será válido en futuras validaciones

## Seguridad

### JWT Secret

El `JWT_SECRET` debe ser una cadena aleatoria y segura. Ejemplo de generación:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Blocklist

La blocklist se mantiene en memoria (Set).

### Validación de Contraseñas

Las contraseñas se validan mediante bcrypt, nunca se almacenan en texto plano.

## Integración con otros servicios

### Clients Service

Auth Service se comunica con Clients Service para:
- Obtener información del usuario por email/username
- Validar que el usuario existe y está activo
- Obtener la contraseña hasheada para comparación

### API Gateway

La API Gateway consume el endpoint `/validate-token` para:
- Verificar tokens en cada petición protegida
- Obtener información del usuario autenticado
- Rechazar peticiones no autorizadas

## Desarrollo

### Scripts disponibles

```bash
npm run dev     # Ejecuta con nodemon (auto-reload)
npm start       # Ejecuta en modo producción
```

### Agregar nuevas validaciones

Las validaciones se manejan con `express-validator` en `src/validators/authValidator.js`.

## Troubleshooting

### Error: "Credenciales inválidas"

- Verifica que el usuario existe en Clients Service
- Verifica que la contraseña es correcta
- Verifica que el usuario está activo (isActive = true)

### Error: "Token inválido"

- Verifica que el token no ha expirado
- Verifica que el JWT_SECRET es el mismo que se usó para generar el token
- Verifica que el token no está en la blocklist (logout)

### Error: Connection refused

Verifica que Clients Service está corriendo en el puerto correcto:
```bash
# Debe estar corriendo en puerto 3001
curl http://localhost:3001/api/clients
```

### Error: Module not found

Instala las dependencias:
```bash
npm install
```

## Tecnologías Utilizadas

- **Express**: Framework web para Node.js
- **jsonwebtoken**: Generación y validación de JWT
- **bcrypt**: Comparación de contraseñas hasheadas
- **axios**: Cliente HTTP para comunicación con Clients Service
- **express-validator**: Validación de datos de entrada
- **dotenv**: Gestión de variables de entorno

## Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| PORT | Puerto del servicio | 3002 |
| JWT_SECRET | Secreto para firmar JWT | - (requerido) |
| JWT_EXPIRES_IN | Tiempo de expiración del token | 24h |
| CLIENTS_SERVICE_URL | URL del Clients Service | http://localhost:3001/api/clients |
| NODE_ENV | Entorno de ejecución | development |

## Autor

- Ronaldo Morales

## Licencia

Este proyecto es parte del curso de Arquitectura de Sistemas - Universidad Católica del Norte
