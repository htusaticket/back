# 🚀 Guía de Desarrollo - ZAZ Créditos

Esta guía te ayudará a configurar el entorno de desarrollo y trabajar eficientemente con el proyecto.

## 🏁 Configuración Inicial

### 1. Prerrequisitos

```bash
# Verificar versiones
node --version    # >= 20.0.0
npm --version     # >= 10.0.0
docker --version  # >= 24.0.0
git --version     # >= 2.30.0
```

### 2. Clonar y Configurar

```bash
# Clonar repositorio
git clone [URL_DEL_REPO]
cd zazcreditos-back

# Instalar dependencias
npm ci

# Configurar variables de entorno
cp .env-example .env
# Editar .env con tus valores locales

# Configurar Git hooks
npm run prepare
```

### 3. Base de Datos Local

```bash
# Opción 1: Docker (Recomendado)
docker-compose up -d db redis

# Opción 2: PostgreSQL local
# Asegúrate de tener PostgreSQL 16+ instalado
createdb zazcreditos

# Generar cliente y ejecutar migraciones
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Verificar Configuración

```bash
# Verificar tipos
npm run typecheck

# Verificar linting
npm run lint:check

# Ejecutar tests
npm test

# Iniciar aplicación
npm run dev
```

## 🛠️ Flujo de Trabajo

### Desarrollo Diario

#### Iniciar Sesión de Trabajo

```bash
# Actualizar repositorio
git pull origin main

# Instalar nuevas dependencias (si las hay)
npm ci

# Iniciar servicios
docker-compose up -d

# Iniciar aplicación en modo desarrollo
npm run dev
```

#### Durante el Desarrollo

```bash
# Verificar cambios continuamente
npm run typecheck  # Verificar tipos
npm run lint       # Fix automático de linting
npm run format     # Formatear código

# Ejecutar tests específicos
npm test -- --watch
npm test -- src/users/users.service.spec.ts
```

#### Antes de Commit

```bash
# Los hooks se ejecutan automáticamente, pero puedes ejecutar manualmente:
npm run pre-commit  # lint-staged
npm run pre-push    # typecheck + tests
```

### Creación de Features

#### 1. Crear Branch

```bash
git checkout -b feature/nueva-funcionalidad
# o
git checkout -b fix/corregir-bug
```

#### 2. Estructura de Archivos

```
src/
├── application/
│   ├── [feature]/
│   │   ├── dto/
│   │   │   ├── create-[entity].dto.ts
│   │   │   ├── update-[entity].dto.ts
│   │   │   └── [entity]-response.dto.ts
│   │   └── use-cases/
│   │       ├── create-[entity].use-case.ts
│   │       ├── update-[entity].use-case.ts
│   │       └── find-[entity].use-case.ts
├── core/
│   ├── entities/
│   │   └── [entity].entity.ts
│   └── interfaces/
│       └── [entity].repository.ts
└── infrastructure/
    ├── http/controllers/
    │   └── [entity].controller.ts
    └── persistence/repositories/
        └── [entity].repository.ts
```

#### 3. Convenciones de Código

##### Naming

- **Archivos**: kebab-case (`user-profile.service.ts`)
- **Clases**: PascalCase (`UserProfileService`)
- **Variables**: camelCase (`userProfile`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Base de datos**: snake_case (`user_profiles`)

##### Imports

```typescript
// 1. Node modules
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

// 2. Internal modules (usando path mapping)
import { UserEntity } from '@/core/entities/user.entity';
import { CreateUserDto } from '@/application/users/dto/create-user.dto';

// 3. Relative imports
import { UserRepository } from './user.repository';
```

##### DTOs y Validación

```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  firstName?: string;
}
```

##### Controladores

```typescript
@Controller('users')
@ApiTags('users')
export class UsersController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @ApiOperation({ summary: 'Crear nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.createUserUseCase.execute(createUserDto);
  }
}
```

## 🧪 Testing

### Estructura de Tests

```
src/
├── [module]/
│   ├── [service].spec.ts      # Unit tests
│   ├── [controller].spec.ts   # Unit tests
│   └── [integration].spec.ts  # Integration tests
└── test/
    ├── e2e/
    │   └── [feature].e2e-spec.ts
    └── helpers/
        ├── test-database.ts
        └── test-fixtures.ts
```

### Tipos de Tests

#### Unit Tests

```typescript
describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const mockRepo = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [UserService, { provide: UserRepository, useValue: mockRepo }],
    }).compile();

    service = module.get<UserService>(UserService);
    mockRepository = module.get(UserRepository);
  });

  it('should create user successfully', async () => {
    const userData = { email: 'test@test.com', password: 'password123' };
    mockRepository.create.mockResolvedValue({ id: '1', ...userData });

    const result = await service.create(userData);

    expect(result.id).toBe('1');
    expect(mockRepository.create).toHaveBeenCalledWith(userData);
  });
});
```

#### Integration Tests

```typescript
describe('Users Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    prisma = module.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user via API', async () => {
    const userData = {
      email: 'test@test.com',
      password: 'password123',
    };

    const response = await request(app.getHttpServer()).post('/users').send(userData).expect(201);

    expect(response.body.email).toBe(userData.email);
  });
});
```

### Comandos de Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Tests con coverage
npm run test:cov

# E2E tests
npm run test:e2e

# Test específico
npm test -- users.service.spec.ts

# Tests con debug
npm run test:debug
```

## 🗄️ Base de Datos

### Migraciones

#### Crear Nueva Migración

```bash
# Modificar schema.prisma
# Luego ejecutar:
npx prisma migrate dev --name add_user_profile_table
```

#### Aplicar Migraciones

```bash
# Desarrollo
npm run db:migrate

# Producción
npm run db:migrate:deploy
```

#### Reset Base de Datos

```bash
# ⚠️ Elimina todos los datos
npm run db:migrate:reset
npm run db:seed
```

### Seeds

#### Modificar Seeds

Editar `prisma/seed.ts` y ejecutar:

```bash
npm run db:seed
```

#### Crear Factory para Tests

```typescript
// test/helpers/user.factory.ts
import { faker } from '@faker-js/faker';
import { CreateUserDto } from '@/application/users/dto/create-user.dto';

export const createUserFactory = (overrides?: Partial<CreateUserDto>): CreateUserDto => ({
  email: faker.internet.email(),
  password: faker.internet.password({ length: 12 }),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  ...overrides,
});
```

## 🐛 Debugging

### VSCode Configuration

Crear `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug NestJS",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/main.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "envFile": "${workspaceFolder}/.env",
      "console": "integratedTerminal"
    }
  ]
}
```

### Debugging con Docker

```bash
# Ejecutar con debug habilitado
docker-compose -f docker-compose.debug.yml up

# Conectar debugger al puerto 9229
```

### Logs de Desarrollo

```typescript
import { Logger } from '@nestjs/common';

export class UserService {
  private readonly logger = new Logger(UserService.name);

  async createUser(data: CreateUserDto) {
    this.logger.debug('Creating user', { email: data.email });

    try {
      const user = await this.repository.create(data);
      this.logger.log('User created successfully', { userId: user.id });
      return user;
    } catch (error) {
      this.logger.error('Failed to create user', error.stack, { email: data.email });
      throw error;
    }
  }
}
```

## 🚀 Deployment

### Build Local

```bash
npm run build
npm run start:prod
```

### Docker Build

```bash
# Desarrollo
docker-compose up --build

# Producción
docker-compose -f docker-compose.prod.yml up --build
```

### Verificar Build

```bash
# Verificar que la aplicación inicia correctamente
curl http://localhost:5000/health

# Verificar logs
docker-compose logs -f app
```

## 📋 Checklist de PR

Antes de crear un Pull Request, verifica:

- [ ] ✅ Código pasa `npm run typecheck`
- [ ] ✅ Código pasa `npm run lint:check`
- [ ] ✅ Código está formateado `npm run format:check`
- [ ] ✅ Tests pasan `npm test`
- [ ] ✅ Build funciona `npm run build`
- [ ] ✅ Migraciones están incluidas (si aplica)
- [ ] ✅ Documentación actualizada (si aplica)
- [ ] ✅ Variables de entorno documentadas (si aplica)
- [ ] ✅ Commits siguen conventional commits
- [ ] ✅ Branch está actualizado con main

## 🆘 Problemas Comunes

### Error: "Cannot find module"

```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: Prisma Client desactualizado

```bash
npm run db:generate
```

### Error: Puerto en uso

```bash
# Encontrar proceso usando puerto 5000
lsof -i :5000
# Matar proceso
kill -9 [PID]

# O cambiar puerto en .env
PORT=5001
```

### Error: Base de datos no conecta

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps

# Verificar logs de la base de datos
docker-compose logs db

# Reiniciar servicios
docker-compose restart db
```

---

¡Happy coding! 🎉
