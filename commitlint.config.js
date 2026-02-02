module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // Nueva funcionalidad
        'fix', // Corrección de bugs
        'docs', // Cambios en documentación
        'style', // Cambios de formato (no afectan el código)
        'refactor', // Refactoring de código
        'perf', // Mejoras de rendimiento
        'test', // Agregar o corregir tests
        'chore', // Mantenimiento (dependencias, configuración)
        'ci', // Cambios en CI/CD
        'build', // Cambios en el sistema de build
        'revert', // Revertir commits anteriores
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
  },
  // Mensaje de ayuda personalizado
  helpUrl: `
📝 FORMATO DE COMMIT REQUERIDO:

  <tipo>(<alcance>): <descripción>

📌 EJEMPLOS VÁLIDOS:
  feat: agregar autenticación de usuarios
  fix: corregir error en validación de email
  docs: actualizar README con instrucciones
  chore: actualizar dependencias
  refactor: mejorar estructura de carpetas

🎯 TIPOS DISPONIBLES:
  feat     - Nueva funcionalidad
  fix      - Corrección de bugs
  docs     - Cambios en documentación
  style    - Formato (espacios, punto y coma, etc)
  refactor - Refactoring sin cambios funcionales
  perf     - Mejoras de rendimiento
  test     - Agregar o corregir tests
  chore    - Mantenimiento y configuración
  ci       - Cambios en CI/CD
  build    - Cambios en build o dependencias
  revert   - Revertir commits anteriores

⚠️  REGLAS:
  - Usar minúsculas en tipo y descripción
  - No terminar con punto (.)
  - Máximo 100 caracteres
  - La descripción no puede estar vacía

Más info: https://www.conventionalcommits.org/
  `,
};
