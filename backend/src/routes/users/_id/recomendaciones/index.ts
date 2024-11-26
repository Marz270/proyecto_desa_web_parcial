/* TUVE PROBLEMAS DE QUE NO ME DETECTABA ESTA RUTA, POR TIEMPO LO DEJE EN USERS DIRECTAMENTE PERO DEBERÍA IR ACA */


import { FastifyInstance, FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import { UserIdSchema } from "../../../../types/schemas/user/userSchema.js";
import { PropertyGetQuerySchema } from "../../../../types/schemas/property/propertySchema.js";
import { query } from "../../../../services/database.js";
import { RecomendacionPostType, RecomendacionSchema } from "../../../../types/schemas/recomendacion/recomendacionSchema.js";



const userRecommendations: FastifyPluginAsync = async (
    fastify: FastifyInstance,
    opts: FastifyPluginOptions
  ): Promise<void> => {
    fastify.get("/recomendacion", {
        schema: {
          description: "Obtener las recomendaciones",
          summary: "Obtener las recomendaciones de un usuario específico",
          tags: ["recomendaciones"],
          params: UserIdSchema,
          response: {
            200: {
              description: "Listado de recomendaciones",
              type: "array",
              items: PropertyGetQuerySchema,
            },
            501: {
              description: "Recomendaciones del usuario no encontrados",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
        onRequest: fastify.verifySelfOrAdmin,
        handler: async function (request, reply) {
          const { id } = request.params as { id: string };
          const res = await query(
            `SELECT p.*
           FROM recomendada f
           JOIN properties p ON f.property_id = p.id
           WHERE f.user_id = $1`,
            [id]
          );
          if (res.rows.length === 0) {
            reply
              .status(501)
              .send({ message: "Recomendaciones del usuario no encontrados" });
            return;
          }
          reply.code(200).send(res.rows);
        },
      });

      fastify.post("/recomendacion", {
        schema: {
          description: "Crear una recomendacion",
          summary: "Crear una recomendacion",
          tags: ["recomendaciones"],
          body: RecomendacionSchema,
          response: {
            201: {
              description: "Recomendacion creada",
              type: "object",
              properties: RecomendacionSchema.properties,
            },
            501: {
              description: "Error al crear la recomendacion",
              type: "object",
              properties: {
                message: { type: "string" },
              },
            },
          },
        },
        onRequest: fastify.verifySelfOrAdmin,
        handler: async function (request, reply) {
          const recomendacionPost = request.body as RecomendacionPostType;

          const propertyId = recomendacionPost.property_id;
          const res = await query(
            `INSERT INTO recomendada
                    (user_id, property_id)
                    VALUES ($1, $2)
                    RETURNING id_recomendacion;`,
            [propertyId]
          );
          if (res.rows.length === 0) {
            reply.status(501).send({ message: "Error al crear la recomendacion" });
            return;
          }
          reply.code(201).send({ message: "Recomendacion creada" });
          reply.code(201).send(res.rows[0]);
        },
      });
    
  }

export default userRecommendations;