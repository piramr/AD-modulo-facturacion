const path = require('path');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { loadFilesSync } = require('@graphql-tools/load-files');
const { mergeTypeDefs, mergeResolvers } = require('@graphql-tools/merge');

// Busca y fusiona todos los archivos .graphql dentro de /types
const typesArray = loadFilesSync(path.join(__dirname, './types/**/*.graphql'));
const typeDefs = mergeTypeDefs(typesArray);

// Busca y fusiona todos los archivos .resolver.js dentro de /resolvers
const resolversArray = loadFilesSync(path.join(__dirname, './resolvers/**/*.resolver.js'));
const resolvers = mergeResolvers(resolversArray);

// Compila esquema ejecutable GraphQL
const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

module.exports = schema;