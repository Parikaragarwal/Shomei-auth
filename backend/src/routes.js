import * as controllers from './controllers/index.js';
import { verifyAccessToken } from './ultils/token.service.js';
import { handleError } from './ultils/errorHandler.js';
import "dotenv/config"

export async function showAuthorizePageHandler(req,res) {
    try {
        const client = await controllers.showAuthorizePage(req.params.id,req,res);
        return res.render("authorize", { client });
    } catch (err) {
        return handleError(res, err);
    }
}

export async function confirmAuthorizeHandler(req,res) {
    try {
        const { client_id, code_challenge, code_challenge_method } = req.body;
        const result = await controllers.confirmAuthorize(client_id, req, code_challenge, code_challenge_method);
        const cleanUri = result.redirect_uri.trim();
        const redirectUrl = new URL(cleanUri);
        redirectUrl.searchParams.append("shortcode", result.shortcode);
        return res.redirect(redirectUrl.toString());
    } catch (err) {
        return handleError(res, err);
    }
}

export async function denyAuthorizeHandler(req,res) {
    return res.status(403).json({ message: "Authorization denied" });
}

export async function userSignupHandler(req, res) {
    const { name, email, password } = req.body;
    try {
        await controllers.userSignupController(name, email, password);
        return res.status(201).json({ message: "User signup successful" });
    } catch (err) {
        return handleError(res, err);
    }
}

export async function loginHandler(req, res) {
    const { email, password } = req.body;
    try {
        const session_id = await controllers.loginController(email, password);
        res.cookie("session_id", session_id, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.status(200).json({ message: "Login successful" });
    } catch (err) {
        return handleError(res, err);
    }
}

export async function clientSignupHandler(req, res) {
    try {
        const { name, base_url, redirect_uri } = req.body;
        const sessionId = req.cookies.session_id;
        const { client_id, client_secret } = await controllers.clientSignupController(name, base_url, redirect_uri, sessionId);
        return res.status(201).json({ client_id, client_secret });
    } catch (err) {
        return handleError(res, err);
    }
}

export async function getUserSessionsHandler(req, res) {
    try {
        const sessionId = req.cookies.session_id;
        const sessions = await controllers.getUserActiveSessions(sessionId);
        return res.status(200).json(sessions);
    } catch (err) {
        return handleError(res, err, 401);
    }
}

export async function revokeAppAccessHandler(req, res) {
    try {
        const sessionId = req.cookies.session_id;
        const { clientId } = req.params;
        await controllers.revokeAppAccess(sessionId, clientId);
        return res.status(200).json({ message: "Access revoked" });
    } catch (err) {
        return handleError(res, err);
    }
}

export async function getUserClientsHandler(req, res) {
    try {
        const sessionId = req.cookies.session_id;
        const clients = await controllers.getUserOwnedClients(sessionId);
        return res.status(200).json(clients);
    } catch (err) {
        return handleError(res, err, 401);
    }
}

export async function getClientUsersHandler(req, res) {
    try {
        const sessionId = req.cookies.session_id;
        const { clientId } = req.params;
        const users = await controllers.getClientActiveUsers(sessionId, clientId);
        return res.status(200).json(users);
    } catch (err) {
        return handleError(res, err, 403);
    }
}

export async function getPublicClientInfoHandler(req, res) {
    try {
        const { clientId } = req.params;
        const client = await controllers.getPublicClientInfo(clientId);
        return res.status(200).json(client);
    } catch (err) {
        return handleError(res, err, 404);
    }
}

export async function resendOTP(req,res){
    const {email} = req.body;
    try {
        await controllers.resendOTP(email);
        return res.status(200).json({ message: "OTP resent successfully" });
    } catch (error) {
        return handleError(res, error);
    }
}

export async function verifyOTP(req,res) {
    const {email,otp} = req.body;
    try {
        await controllers.verifyOTP(email,otp);
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        return handleError(res, error);
    }
}

export async function tokenExchangeHandler(req, res) {
    try {
        const { shortcode, clientId, clientSecret, code_verifier } = req.body;
        const { access_token, refresh_token } = await controllers.tokenExchangeController(shortcode, clientId, clientSecret, code_verifier);
        return res.status(200).json({ access_token, refresh_token });
    } catch (err) {
        return handleError(res, err);
    }
}

export function publicKeysHandler(req, res) {
    return res.status(200).json({
        public_key: process.env.PUBLIC_KEY.replace(/\\n/g, "\n")
    });
}

export async function logoutHandler(req, res) {
    try {
        const userSessionId = req.cookies.session_id;
        if (userSessionId) {
            await controllers.logoutController(userSessionId);
        }
        res.clearCookie("session_id", {
            httpOnly: true,
            sameSite: "strict",
            path: "/"
        }); 
        return res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        return handleError(res, error);
    }
}

export async function logoutAllHandler(req, res) {
    try {
        const userSessionId = req.cookies.session_id;
        if (!userSessionId) {
            return res.status(400).json({ message: "User not authenticated" });
        }
        await controllers.logoutAllController(userSessionId);
        res.clearCookie("session_id", {
            httpOnly: true,
            sameSite: "strict",
            path: "/"
        });
        return res.status(200).json({ message: "Logout from all sessions successful" });
    } catch (error) {
        return handleError(res, error);
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
    return res.status(200).json({ keys: [jwk] });
}

export async function userInfoHandler(req, res) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
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
        return handleError(res, err, 401);
    }
}

export async function forgotPasswordHandler(req, res) {
    const { email } = req.body;
    try {
        await controllers.forgotPasswordController(email);
        return res.status(200).json({ message: "If that email exists, a reset code has been sent." });
    } catch (err) {
        return handleError(res, err);
    }
}

export async function resetPasswordHandler(req, res) {
    const { email, otp, newPassword } = req.body;
    try {
        await controllers.resetPasswordController(email, otp, newPassword);
        return res.status(200).json({ message: "Password has been successfully reset." });
    } catch (err) {
        return handleError(res, err);
    }
}