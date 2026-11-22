import { describe, expect, it } from "vitest";
import { loginSchema, registroSchema } from "@/lib/validation";

const valido = {
  role: "comerciante",
  full_name: "Ana Pérez",
  doc_number: "20123456789",
  business_name: "Frutas Ana",
  business_type: "Frutas",
  email: "ana@correo.com",
  password: "12345678",
};

describe("registroSchema", () => {
  it("acepta datos válidos con RUC o DNI", () => {
    expect(registroSchema.safeParse(valido).success).toBe(true);
    expect(registroSchema.safeParse({ ...valido, doc_number: "12345678" }).success).toBe(true);
  });

  it("acepta transportista", () => {
    expect(registroSchema.safeParse({ ...valido, role: "transportista" }).success).toBe(true);
  });

  it("rechaza el rol admin", () => {
    expect(registroSchema.safeParse({ ...valido, role: "admin" }).success).toBe(false);
  });

  it("rechaza documentos con longitud o formato inválido", () => {
    for (const doc of ["1234567", "123456789", "1234567890", "123456789012", "1234567a"]) {
      expect(registroSchema.safeParse({ ...valido, doc_number: doc }).success).toBe(false);
    }
  });

  it("rechaza correo inválido y contraseña corta", () => {
    expect(registroSchema.safeParse({ ...valido, email: "no-correo" }).success).toBe(false);
    expect(registroSchema.safeParse({ ...valido, password: "1234567" }).success).toBe(false);
  });

  it("rechaza nombre, negocio o giro vacíos", () => {
    for (const campo of ["full_name", "business_name", "business_type"]) {
      expect(registroSchema.safeParse({ ...valido, [campo]: "  " }).success).toBe(false);
    }
  });
});

describe("loginSchema", () => {
  it("valida correo y contraseña", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "a", password: "x" }).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});