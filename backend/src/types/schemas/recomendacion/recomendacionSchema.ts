import { Static, Type } from "@sinclair/typebox";

export const RecomendacionSchema = Type.Object({
    id_recomendacion: Type.Number(),
    email_recomendado: Type.String(),
    property_id: Type.Number(),
})

export const RecomendacionPostSchema = Type.Object({
    email_recomendado: Type.String(),
    property_id: Type.Number(),
})

export const RecomendacionIdSchema = Type.Object({
    id_recomendacion: Type.Number()
})

export type RecomendacionType = Static<typeof RecomendacionSchema>;
export type RecomendacionPostType = Static<typeof RecomendacionPostSchema>;
export type RecomendacionIdType = Static<typeof RecomendacionIdSchema>;