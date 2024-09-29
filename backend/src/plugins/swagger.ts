import swagger, {SwaggerOptions} from '@fastify/swagger';
import fp from 'fastify-plugin'
import swaggerUI from '@fastify/swagger-ui';

const options : SwaggerOptions = {
    openapi: {
        openapi: '3.0.0',
        info: {
            title: 'Project API',
            description: 'Project API Documentation',
            version: '0.1.0'
        },
        servers: [
            {
                url: 'http://localhost/backend',
                description: 'Development server'
            }
        ],
        tags: [
            {name: 'auth', description: 'Auth description'},
            {name: 'users', description: 'User CRUD operations'},
            {name: 'properties', description: 'Property description'},
            {name: 'search_criteria', description: 'Search Criteria description'},
            {name: 'favorites', description: 'Favorites description'},
            {name: 'admin', description: 'Admin description'},
            {name: 'compare', description: 'Comparison description'},
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                }
            }
        },
        security: [
            {
              bearerAuth: [],
            },
        ],
        externalDocs: {
            url: 'https://swagger.io',
            description: 'Find more info here'
        }
    }
}

export default fp<SwaggerOptions>(async (fastify) => {
    fastify.register(swagger, options);
    await fastify.register(swaggerUI, {routePrefix: 'docs',
        uiConfig: {
            docExpansion: 'full',
            deepLinking: false
        },
        uiHooks: {
            onRequest: function (request, reply, next) { next() },
            preHandler: function (request, reply, next) { next() }
        },
        staticCSP: true,
        transformStaticCSP: (header) => header,
        transformSpecification: (swaggerObject, request, reply) => { return swaggerObject },
        transformSpecificationClone: true})
})


