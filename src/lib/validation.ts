import { z } from "zod";

const texto = (etiqueta: string, max = 120) =>
  z
    .string()
    .trim()
    .min(1, `Ingresa ${etiqueta}.`)
    .max(max, `${etiqueta} es demasiado largo.`);

export const registroSchema = z.object({
  role: z.enum(["comerciante", "transportista"], {
    message: "Elige un tipo de cuenta válido.",
  }),
  full_name: texto("tu nombre completo"),
  doc_number: z
    .string()
    .trim()
    .regex(/^(\d{8}|\d{11})$/, "Ingresa un DNI de 8 dígitos o un RUC de 11 dígitos."),
  business_name: texto("el nombre del negocio"),
  business_type: texto("el giro del negocio"),
  email: z.string().trim().email("Ingresa un correo válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Ingresa un correo válido."),
  password: z.string().min(1, "Ingresa tu contraseña."),
});

export type RegistroInput = z.infer<typeof registroSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type FormState = {
  error?: string;
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  values?: Record<string, string>;
};