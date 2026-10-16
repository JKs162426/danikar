// config.js exige estas variables al cargarse; en los tests van falsas.
process.env.JWT_SECRET ??= "x".repeat(40);
process.env.ADMIN_PASSWORD_HASH ??= "$2a$12$hashdepruebahashdepruebahashdepruebahashdepruebaha";
process.env.MONGODB_URI ??= "mongodb://localhost:1/nada";
