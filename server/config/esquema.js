import { z } from "zod";

export const TIPOS_AGARRE = ["pinza", "banda", "diadema", "gancho"];

// El tamaño mueve el precio; el color no. Por eso el color es una lista
// simple y el tamaño es una variante con precio propio.
// Si algo tiene un solo tamaño, igual lleva una variante ("Única"),
// así el frontend nunca tiene dos caminos posibles.
export const varianteSchema = z.object({
  tamano: z.string().trim().min(1).max(40),
  precio: z.number().nonnegative().finite(),
});

export const productoSchema = z.object({
  id: z.string().trim().min(1).max(64),
  nombre: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(1000).default(""),

  categoria: z.string().trim().min(1).max(60),
  colores: z.array(z.string().trim().min(1).max(40)).max(40).default([]),
  variantes: z.array(varianteSchema).min(1).max(12),

  // Solo aplica a lo que se sujeta al cabello. Una pulsera lo deja vacío.
  tipoAgarre: z.enum(TIPOS_AGARRE).nullable().default(null),

  // Solo URLs https (Cloudinary) o las rutas locales viejas de /imagenes/.
  // Evita que "javascript:" o rutas raras terminen en un src público.
  imagenes: z
    .array(
      z
        .string()
        .trim()
        .max(500)
        .regex(
          /^(https:\/\/|\/imagenes\/)[^\s"'<>]+$/,
          "La imagen debe ser una URL https"
        )
    )
    .max(8)
    .default([]),
  personalizable: z.boolean().default(false),
  disponible: z.boolean().default(true),
});

export const negocioSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  descripcion: z.string().trim().max(2000).default(""),
  // Solo dígitos, con código de país, sin + ni espacios.
  telefonoWhatsapp: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Solo dígitos con código de país"),
  // Se guarda solo el usuario. Si pegan "@usuario" o la URL del perfil,
  // lo limpiamos en vez de rechazarlo.
  instagram: z
    .string()
    .trim()
    .transform((v) =>
      v
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/[/?#].*$/, "")
    )
    .pipe(
      z.string().regex(/^[A-Za-z0-9._]{0,30}$/, "Usuario de Instagram inválido")
    )
    .default(""),
  ubicacion: z.string().trim().max(300).default(""),
  horario: z.string().trim().max(120).default("Lunes a sábado, 9:00 a 18:00"),
  // Texto libre, ej: "Pago móvil · Zelle · Efectivo". Vacío = no se muestra.
  formasPago: z.string().trim().max(200).default(""),
  entregas: z.string().trim().max(200).default(""),
  saludoPedido: z
    .string()
    .trim()
    .max(300)
    .default("Hola, quiero hacer un pedido:"),
});

export const contenidoSchema = z
  .object({
    negocio: negocioSchema,
    categorias: z
      .array(z.string().trim().min(1).max(60))
      .min(1)
      .max(50)
      .refine(
        (lista) => new Set(lista.map((c) => c.toLowerCase())).size === lista.length,
        "Hay categorías repetidas"
      ),
    productos: z.array(productoSchema).max(500).default([]),
    actualizadoEn: z.string().datetime().optional(),
  })
  .superRefine((datos, ctx) => {
    const ids = new Set();

    datos.productos.forEach((producto, i) => {
      if (ids.has(producto.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["productos", i, "id"],
          message: `id duplicado: ${producto.id}`,
        });
      }
      ids.add(producto.id);

      // Un producto con categoría inexistente desaparece del sitio
      // sin que nadie entienda por qué. Mejor que falle al guardar.
      if (!datos.categorias.includes(producto.categoria)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["productos", i, "categoria"],
          message: `la categoría "${producto.categoria}" no existe en la lista`,
        });
      }

      const tamanos = new Set();
      producto.variantes.forEach((variante, j) => {
        if (tamanos.has(variante.tamano)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["productos", i, "variantes", j, "tamano"],
            message: `tamaño repetido: ${variante.tamano}`,
          });
        }
        tamanos.add(variante.tamano);
      });
    });
  });

export function formatearErrores(error) {
  return error.issues.map((issue) => ({
    campo: issue.path.join(".") || "(raíz)",
    mensaje: issue.message,
  }));
}
