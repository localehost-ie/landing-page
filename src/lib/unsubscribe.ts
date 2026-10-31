
import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
} from "node:crypto";

const getSecret = () => {
    const secret = import.meta.env.UNSUBSCRIBE_SECRET;

    if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
        throw new Error("Invalid UNSUBSCRIBE_SECRET");
    }

    return Buffer.from(secret, "hex");
};

export function createUnsubscribeToken(email: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv(
        "aes-256-gcm",
        getSecret(),
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify({ email }), "utf8"),
        cipher.final(),
    ]);

    const tag = cipher.getAuthTag();

    return [
        iv.toString("base64url"),
        tag.toString("base64url"),
        encrypted.toString("base64url"),
    ].join(".");
}

export function readUnsubscribeToken(token: string) {
    const parts = token.split(".");

    if (parts.length !== 3) {
        throw new Error("Invalid unsubscribe token");
    }

    const [iv, tag, encrypted] = parts;

    const decipher = createDecipheriv(
        "aes-256-gcm",
        getSecret(),
        Buffer.from(iv, "base64url")
    );

    decipher.setAuthTag(Buffer.from(tag, "base64url"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, "base64url")),
        decipher.final(),
    ]);

    const payload = JSON.parse(decrypted.toString("utf8"));

    if (
        typeof payload.email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)
    ) {
        throw new Error("Invalid unsubscribe recipient");
    }

    return payload.email;
}
