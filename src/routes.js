import * as controllers from './controllers/index.js';
import { verifyAccessToken } from './ultils/token.service.js';
import "dotenv/config"


export async function showAuthorizePageHandler(req,res) {
    try {
    const client =
    await controllers.showAuthorizePage(req.params.id,req);

    return res.render(
        "authorize",
        { client }
    );
   } catch (err) {
    console.error(
        "Error showing authorize page:",
        err
    );
    return res.status(400).json({
        message: err.message
    });
}
}

export async function confirmAuthorizeHandler(req,res) {
    try {
    const result =
    await controllers.confirmAuthorize(req.body.client_id,req);
    return res.redirect(
        `${result.redirect_uri}?shortcode=${result.shortcode}`
    );

    } catch (err) {
    console.error(
        "Error confirming authorization:",
        err
    );
    return res.status(400).json({
        message: err.message
    });
 }
}

export async function denyAuthorizeHandler(req,res) {
    return res.status(403).json({
        message: "Authorization denied"
    });
}


export async function userSignupHandler(req, res) {
    const { name, email, password } = req.body;

    try {
        await controllers.userSignupController(name, email, password);

        return res.status(201).json({
            message: "User signup successful"
        });

    } catch (err) {
        console.error("Error in user signup:", err);

        return res.status(400).json({
            message: err.message
        });
    }
}

export async function loginHandler(req, res) {
    const { email, password } = req.body;

    try {
        const session_id = await controllers.loginController(email, password);

    res.cookie("session_id", session_id, {
      httpOnly: true,
      sameSite: "none",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Login successful"
    });

    }catch (err) {
    console.error("Error in login:", err);

    return res.status(400).json({
     message: err.message
    });
    }
}

export async function clientSignupHandler(req, res) {
    try {
        const { name, base_url, redirect_uri } = req.body;

        const { client_id, client_secret } =
            await controllers.clientSignupController(
                name,
                base_url,
                redirect_uri
            );

    return res.status(201).render(
    "client-created",
    {
        client_id,
        client_secret
    }
);
    } catch (err) {
        console.error("Error in client signup:", err);

        return res.status(400).json({
            message: err.message
        });
    }
}

// export async function authorizeHandler(req, res) {
//     try {
//         const clientId = req.clientId;

//         const { redirect_uri, shortcode } =
//             await controllers.authorizeController(clientId, req);

//         return res.redirect(
//             302,
//             `${redirect_uri}?shortcode=${shortcode}`
//         );

//     } catch (error) {
//         console.error("Error in authorization:", error);

//         return res.status(400).json({
//             message: error.message
//         });
//     }
// }

export async function tokenExchangeHandler(req, res) {
    try {
        const { shortcode, clientId, clientSecret } = req.body;

        const { access_token } =
            await controllers.tokenExchangeController(
                shortcode,
                clientId,
                clientSecret
            );

        return res.status(200).json({
            access_token
        });

    } catch (err) {
        console.error("Error in token exchange:", err);

        return res.status(400).json({
            message: err.message
        });
    }
}

export function publicKeysHandler(req, res) {
    return res.status(200).json({
        public_key: process.env.PUBLIC_KEY.replace(/\\n/g, "\n")
    });
}

export async function logoutHandler(req, res) {
    res.clearCookie("session_id", {
        httpOnly: true,
        sameSite: "strict",
        path: "/"
    }); 
    return res.status(200).json({
        message: "Logout successful"
    });
}

export async function logoutAllHandler(req, res) {
    try {
        const userSessionId = req.cookies.session_id;

        if (!userSessionId) {
            return res.status(400).json({
                message: "User not authenticated"
            });
        }

        await controllers.logoutAllController(userSessionId);

        res.clearCookie("session_id", {
            httpOnly: true,
            sameSite: "strict",
            path: "/"
        });

        return res.status(200).json({
            message: "Logout from all sessions successful"
        });

    } catch (error) {
        console.error("Error in logout all:", error);

        return res.status(400).json({
            message: error.message
        });
    }
}

export async function openidConfigurationHandler(req, res) {
    const issuer = `http://${req.headers.host}`;

    const config = {
        issuer: issuer,
        authorization_endpoint: `${issuer}/authorize/{client_id}`,
        token_endpoint: `${issuer}/token-exchange`,
        jwks_uri: `${issuer}/public-keys`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        userinfo_endpoint: `${issuer}/userinfo`,
        id_token_signing_alg_values_supported: ["RS256"]
    };

    return res.status(200).json(config);
}

export async function jwksHandler(req, res) {
    const jwk = {
        kty: "RSA",
        use: "sig",
        alg: "RS256",
        kid: "1",
        n: process.env.PUBLIC_KEY.replace(/\\n/g, "\n"),
        e: "AQAB"
    };

    return res.status(200).json({
        keys: [jwk]
    });
}

export async function userInfoHandler(req, res) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const payload = verifyAccessToken(token);

        const userInfo = {
            sub: payload.sub,
            email: payload.email,
            name: payload.name
        };

        return res.status(200).json(userInfo);

    } catch (err) {
        console.error("Error in user info:", err);

        return res.status(401).json({
            message: "Unauthorized"
        });
    }
}