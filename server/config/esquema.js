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

  imagenes: z.array(z.string().trim().max(500)).max(8).default([]),
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
  instagram: z.string().trim().max(100).default(""),
  ubicacion: z.string().trim().max(300).default(""),
  saludoPedido: z
    .string()
    .trim()
    .max(300)
    .default("Hola, quiero hacer un pedido:"),
});

export const contenidoSchema = z
  .object({
    negocio: negocioSchema,
    categorias: z.array(z.string().trim().min(1).max(60)).min(1).max(50),
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
