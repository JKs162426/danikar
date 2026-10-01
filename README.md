# Detalles DanKar

Sitio web para tienda de accesorios artesanales.
Desarrollado para un cliente real en producción.

## Características

- Catálogo público con filtros por categoría
- Carrito de pedido: varios productos en un solo mensaje de WhatsApp (se guarda en el navegador)
- Panel de administración protegido con JWT
- Gestión de categorías: crear, renombrar, ordenar y eliminar (moviendo sus productos)
- Subida de imágenes a Cloudinary con validación del contenido real del archivo
- Contenido persistente en MongoDB, validado con Zod

## Stack

- **Frontend:** React, React Router
- **Backend:** Node.js, Express, Zod
- **Auth:** JWT + bcrypt, cookie httpOnly
- **Deploy:** Render (backend) + Vercel (frontend)

## Variables de entorno

Ver `.env.example` en la raíz.

## Tests

```bash
CI=true npm test
```

## Desarrollado por

[Jesús Figueroa](https://github.com/JKs162426)
