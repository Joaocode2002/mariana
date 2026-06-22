import handler from "../dist/server/server.js";

export default async function (request) {
  return handler.fetch(request, {}, {});
}
