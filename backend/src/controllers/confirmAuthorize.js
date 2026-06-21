import authorizeController from "./authorize.js";

export default async function confirmAuthorize(client_id,req, code_challenge, code_challenge_method) {
    return await authorizeController(client_id,req, code_challenge, code_challenge_method);
}