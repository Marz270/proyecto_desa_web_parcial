import {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyPluginOptions,
} from "fastify";
import { BlacklistPostSchema, BlacklistPostType } from "../../types/schemas/user/userSchema.js";
import bcrypt from "bcryptjs";
import { query } from "../../services/database.js";

const BlacklistRoute: FastifyPluginAsync = async (
  fastify: FastifyInstance,
  opts: FastifyPluginOptions
): Promise<void> => {
  fastify.post("/blacklist", {
    schema: {
      description: "Verificar si una contraseña esta en la blacklist",
      summary: "Verificar si una contraseña esta en la blacklist",
      tags: ["blacklist"],
      body: BlacklistPostSchema,
    },
    handler: async function (request, reply) {
      const postbody = request.body as BlacklistPostType;
      const pass = postbody.password;
      const hashedPassword = await bcrypt.hash(pass, 10);

      try {
        const res = await query(
          `select password from blacklist`
        );

        const blacklist = res.rows;

        blacklist.forEach(async password => {
            if(!await bcrypt.compare(password, hashedPassword)){
                reply.status(200).send({ message: "La contraseña es valida"});
                return
            }
            reply.status(403).send({message: blacklist, hashedPassword});
        });
      } catch (error) {
        console.error("Error al acceder a la base de datos:", error);
        reply.code(500).send({
          message: "Error al encontrar la contraseña en la base de datos",
        });
      }
    },
  });
};

export default BlacklistRoute;
