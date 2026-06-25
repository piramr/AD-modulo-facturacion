import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default {
  // 1. Introspección
  introspection: {
    type: 'url',
    url: 'http://localhost:3000/graphql',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },

  // 2. Configuración del Sitio Web
  website: {
    template: 'carbon-multi-page',
    output: path.join(__dirname, './public/docs'),

    options: {
      appTitle: 'API de Facturación y Clientes',
      siteRoot: '/docs', // Formato de ruta root-relative correcto para SvelteKit

      // Tus páginas custom usando el formato oficial de Magidoc
      pages: [
        {
          title: 'Inicio',
          content: `
# API de Facturación v1.0.0

Documentación oficial de la API. Antes de comenzar a realizar pruebas, necesitas configurar tu entorno de desarrollo.

---

### Autenticación de Pruebas
Para consumir los endpoints protegidos, puedes generar un JSON Web Token (JWT) temporal haciendo una petición \`GET\` al servicio de identidad:

* **Endpoint de Token:** \`https://ad-modulo-facturacion.onrender.com/auth/test-token\`
* **Ejemplo de uso:**
\`\`\`bash
curl -X GET https://ad-modulo-facturacion.onrender.com/auth/test-token \\
  -H "Content-Type: application/json"
\`\`\`

---

### Entorno de Pruebas
Si prefieres armar tus consultas visualmente y probar los resolvers en tiempo real, puedes acceder al entorno interactivo de Apollo Server:

[Abrir Apollo Server Sandbox](https://ad-modulo-facturacion.onrender.com/graphql)

*_Nota: Recuerda añadir el token generado en las cabeceras de Apollo Sandbox como \`{"Authorization": "Bearer TU_TOKEN"}\`._*
          `,
        },
        {
          title: 'Servidores',
          content: `
# Servidores Disponibles

A continuación se detalla el entorno disponible para interactuar con la API:

| Entorno | URL del Endpoint | Descripción |
| :--- | :--- | :--- |
| **Producción / Staging** | \`https://ad-modulo-facturacion.onrender.com/graphql\` | Servidor en la nube alojado en Render |
          `,
        }
      ],
    },
  },
}