import { FastifyPluginAsync, FastifyPluginOptions } from "fastify";
import { FastifyInstance } from "fastify/types/instance.js";
import { query } from "../../services/database.js";
import {
  UserIdSchema,
  UserIdType,
  UserPostSchema,
  UserPostType,
  UserPutSchema,
  UserPutType,
  UserSchema,
} from "../../types/schemas/user/userSchema.js";
import bcrypt from "bcryptjs";
import {
  FavoritePostSchema,
  FavoriteSchema,
  FavoritePostType,
} from "../../types/schemas/favorite/favoriteSchema.js";
import { Type } from "@sinclair/typebox";
import {
  PropertyGetQuerySchema,
  PropertyIdSchema,
} from "../../types/schemas/property/propertySchema.js";
import { RecomendacionPostSchema, RecomendacionPostType, RecomendacionSchema } from "../../types/schemas/recomendacion/recomendacionSchema.js";

const usersRoutes: FastifyPluginAsync = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
): Promise<void> => {
  fastify.post("/register", {
    schema: {
      description: "Registrar un usuario",
      summary: "Registrar un usuario",
      tags: ["users"],
      body: UserPostSchema,
      response: {
        201: {
          description: "Usuario registrado",
          type: "object",
          properties: UserSchema.properties,
        },
        404: {
          description: "Error al registrar al usuario",
        },
      },
    },
    handler: async function (request, reply) {
      const personaPost = request.body as UserPostType;
      const name = personaPost.name;
      const lastname = personaPost.lastname;
      const email = personaPost.email;
      const role = personaPost.role;
      const hashedPassword = await bcrypt.hash(personaPost.password, 10);

      try {
        const res = await query(
          `INSERT INTO users
                    (name, lastname, email, password, role)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id;`,
          [name, lastname, email, hashedPassword, role]
        );

        if (res.rowCount === 0) {
          reply.code(404).send({ message: "Failed to insert user" });
          return;
        }

        const id = res.rows[0].id;
        reply.code(201).send({
          id,
          name,
          lastname,
          email,
          role,
        });
      } catch (error) {
        console.error("Error al registrar al usuario:", error);
        reply.code(500).send({
          message: "Error al registrar al usuario en la base de datos",
        });
      }
    },
  });

  fastify.get("/:id", {
    schema: {
      description: "Obtener un usuario",
      summary: "Obtener un usuario",
      tags: ["users"],
      params: UserIdSchema,
      response: {
        200: {
          type: "object",
          properties: UserSchema.properties,
        },
        404: {
          description: "Usuario no encontrado",
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function name(request, reply) {
      const { id } = request.params as { id: string };
      const res = await query(`select id,
                    name,
                    lastname,
                    email,
                    role,
                    registration_date
                from users where id = ${id}`);
      if (res.rows.length === 0) {
        reply.code(404).send({ message: "Usuario no encontrado" });
        return;
      }
      const user = res.rows[0];
      return user;
    },
  });

  fastify.put("/:id", {
    schema: {
      description: "Actualizar un usuario",
      summary: "Actualizar un usuario",
      tags: ["users"],
      body: UserPutSchema,
      params: UserIdSchema,
      response: {
        200: {
          type: "object",
          properties: UserSchema.properties,
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function (request, reply) {
      const { id } = request.params as { id: string };

      const { name, lastname, email, role, password } =
        request.body as UserPutType;
      const fields = [];
      const values = [];
      if (name) {
        fields.push("name");
        values.push(name);
      }
      if (lastname) {
        fields.push("lastname");
        values.push(lastname);
      }
      if (email) {
        fields.push("email");
        values.push(email);
      }
      if (role) {
        fields.push("role");
        values.push(role);
      }
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        fields.push("password");
        values.push(hashedPassword);
      }
      if (fields.length === 0) {
        reply.code(400).send({ message: "No hay campos a actualizar" });
        return;
      }
      const setFields = fields
        .map((field, index) => `${field} = $${index + 1}`)
        .join(", ");
      try {
        const res = await query(
          `UPDATE users SET ${setFields} WHERE id = ${id} RETURNING id, name, lastname, email, role`,
          values
        );
        if (res.rows.length === 0) {
          reply.code(404).send({ message: "Usuario no encontrado" });
          return;
        }
        return res.rows[0];
      } catch (error) {
        console.error("Error al actualizar al usuario:", error);
        reply.code(500).send({
          message: "Error al actualizar al usuario en la base de datos",
        });
      }
    },
  });

  fastify.delete("/:id", {
    schema: {
      description: "Eliminar un usuario",
      summary: "Eliminar un usuario",
      tags: ["users"],
      params: UserIdSchema,
      response: {
        204: {
          description: "Usuario eliminado",
        },
        404: {
          description: "Usuario no encontrado",
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function (request, reply) {
      const { id } = request.params as { id: string };
      const res = await query(`DELETE FROM users WHERE id = ${id}`);
      if (res.rowCount === 0) {
        reply.code(404).send({ message: "Usuario no encontrado" });
        return;
      }
      reply.code(204).send({ message: "Usuario eliminado" });
    },
  });

  fastify.get("/:id/favorites", {
    schema: {
      description: "Obtener favoritos",
      summary: "Obtener los favoritos de un usuario específico",
      tags: ["favorites"],
      params: UserIdSchema,
      response: {
        200: {
          description: "Listado de favoritos",
          type: "array",
          items: PropertyGetQuerySchema,
        },
        501: {
          description: "Favoritos del usuario no encontrados",
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
       FROM favorites f
       JOIN properties p ON f.property_id = p.id
       WHERE f.user_id = $1`,
        [id]
      );
      if (res.rows.length === 0) {
        reply
          .status(501)
          .send({ message: "Favoritos del usuario no encontrados" });
        return;
      }
      reply.code(200).send(res.rows);
    },
  });

  fastify.get("/:id/favorites/:property_id", {
    schema: {
      description: "Obtener un favorito",
      summary: "Obtener un favorito de un usuario específico",
      tags: ["favorites"],
      params: Type.Intersect([UserIdSchema, PropertyIdSchema]),
      response: {
        200: {
          description: "Un favorito",
          type: "object",
          properties: PropertyGetQuerySchema.properties,
        },
        404: {
          description: "Favorito del usuario no encontrado",
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function (request, reply) {
      const { id, property_id } = request.params as {
        id: string;
        property_id: string;
      };
      const res = await query(
        `SELECT p.*
       FROM favorites f
       JOIN properties p ON f.property_id = p.id
       WHERE f.user_id = $1 AND f.property_id = $2`,
        [id, property_id]
      );
      if (res.rows.length === 0) {
        reply
          .status(404)
          .send({ message: "Favorito del usuario no encontrado" });
        return;
      }

      const favorite = res.rows[0];
      return favorite;
    },
  });

  fastify.post("/:id/favorites", {
    schema: {
      description: "Crear un favorito",
      summary: "Crear un favorito para un usuario",
      tags: ["favorites"],
      body: FavoritePostSchema,
      response: {
        201: {
          description: "Favorito creado",
          type: "object",
          properties: FavoriteSchema.properties,
        },
        501: {
          description: "Error al crear el favorito",
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function (request, reply) {
      const favoritePost = request.body as FavoritePostType;
      const userId = favoritePost.user_id;
      const propertyId = favoritePost.property_id;
      const res = await query(
        `INSERT INTO favorites
                (user_id, property_id)
                VALUES ($1, $2)
                RETURNING id_favorite;`,
        [userId, propertyId]
      );
      if (res.rows.length === 0) {
        reply.status(501).send({ message: "Error al crear el favorito" });
        return;
      }
      reply.code(201).send({ message: "Favorito creado" });
      reply.code(201).send(res.rows[0]);
    },
  });

  fastify.delete("/:id/favorites/:property_id", {
    schema: {
      description: "Eliminar un favorito",
      summary: "Eliminar un favorito de un usuario",
      tags: ["favorites"],
      params: Type.Intersect([UserIdSchema, PropertyIdSchema]),
      response: {
        204: {
          description: "Favorito eliminado",
        },
        501: {
          description: "Favorito no encontrado",
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function (request, reply) {
      const { id, property_id } = request.params as {
        id: string;
        property_id: string;
      };
      const res = await query(
        `DELETE FROM favorites WHERE user_id= $1 and property_id = $2`,
        [id, property_id]
      );
      if (res.rowCount === 0) {
        reply.status(501).send({ message: "Favorito no encontrado" });
        return;
      }
      reply.code(204).send({ message: "Favorito eliminado" });
    },
  });

  fastify.get("/:id/recomendaciones/recomendacion", {
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
          .status(404)
          .send({ message: "Recomendaciones del usuario no encontrados" });
        return;
      }
      reply.code(200).send(res.rows);
    },
  });

  fastify.post("/:id/recomendaciones/recomendacion", {
    schema: {
      description: "Crear una recomendacion",
      summary: "Crear una recomendacion",
      tags: ["recomendaciones"],
      body: RecomendacionPostSchema,
      params: UserIdSchema,
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
      const params = request.params as UserIdType;
      const id = params.id;
      const userEmail = recomendacionPost.email_recomendado;
      const propertyId = recomendacionPost.property_id;
      const res = await query(
        `INSERT INTO recomendada
                (user_id, user_email, property_id)
                VALUES ($1, $2, $3)
                RETURNING id_recomendacion;`,
        [id, userEmail, propertyId]
      );
      if (res.rows.length === 0) {
        reply.status(401).send({ message: "Error al crear la recomendacion" });
        return;
      }
      reply.code(201).send({ message: "Recomendacion creada" });
      reply.code(201).send(res.rows[0]);
    },
  });

  fastify.delete("/:id/recomendaciones/recomendacion/:property_id", {
    schema: {
      description: "Eliminar una recomendacion",
      summary: "Eliminar una recomendacion de un usuario",
      tags: ["recomendaciones"],
      params: Type.Intersect([UserIdSchema, PropertyIdSchema]),
      response: {
        204: {
          description: "Recomendacion eliminada",
        },
        404: {
          description: "Recomendacion no encontrada",
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
      },
    },
    onRequest: fastify.verifySelfOrAdmin,
    handler: async function (request, reply) {
      const { id, property_id } = request.params as {
        id: string;
        property_id: string;
      };
      const res = await query(
        `DELETE FROM recomendada WHERE user_id= $1 and property_id = $2`,
        [id, property_id]
      );
      if (res.rowCount === 0) {
        reply.status(404).send({ message: "Recomendacion no encontrada" });
        return;
      }
      reply.code(204).send({ message: "Recomendacion eliminada" });
    },
  });
};

export default usersRoutes;
