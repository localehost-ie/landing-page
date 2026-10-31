
import type { APIRoute } from "astro";
import { readUnsubscribeToken } from "../../lib/unsubscribe";

export const prerender = false;

const htmlResponse = (content: string, status = 200) =>
    new Response(
        `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>LocaleHost | Unsubscribe</title>
        <style>
          body {
            margin: 0;
            padding: 40px 20px;
            background: #F6F7FA;
            color: #14152A;
            font-family: Arial, sans-serif;
          }
          main {
            max-width: 480px;
            margin: 60px auto;
            padding: 36px;
            background: white;
            border: 1px solid #E1E3EC;
            border-radius: 16px;
            text-align: center;
          }
          button {
            background: #14152A;
            color: white;
            border: 0;
            border-radius: 999px;
            padding: 13px 24px;
            cursor: pointer;
            font-size: 15px;
          }
        </style>
      </head>
      <body><main>${content}</main></body>
    </html>`,
        {
            status,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
                "Cache-Control": "no-store",
            },
        }
    );

export const GET: APIRoute = async ({ url }) => {
    const token = url.searchParams.get("token");

    if (!token) {
        return htmlResponse("<h1>Invalid link</h1>", 400);
    }

    try {
        readUnsubscribeToken(token);

        const action = `/api/unsubscribe?token=${encodeURIComponent(token)}`;

        return htmlResponse(`
      <h1>Unsubscribe from LocaleHost?</h1>
      <p>Would you like to stop receiving LocaleHost launch announcements and updates?</p>
      <form method="POST" action="${action}">
        <button type="submit">Confirm unsubscribe</button>
      </form>
      <p style="margin-top:24px;font-size:13px;color:#9395AA">
        Changed your mind? You can close this page.
      </p>
    `);
    } catch {
        return htmlResponse("<h1>This unsubscribe link is invalid.</h1>", 400);
    }
};

export const POST: APIRoute = async ({ url }) => {
    const token = url.searchParams.get("token");

    if (!token) {
        return htmlResponse("<h1>Invalid unsubscribe link.</h1>", 400);
    }

    try {
        const email = readUnsubscribeToken(token);

        const response = await fetch(
            `https://api.resend.com/contacts/${encodeURIComponent(email)}`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${import.meta.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    unsubscribed: true,
                }),
            }
        );

        if (!response.ok) {
            console.error("Resend unsubscribe error:", await response.text());
            throw new Error("Unable to update subscription");
        }

        return htmlResponse(`
      <h1>You've been unsubscribed.</h1>
      <p>You won't receive further LocaleHost marketing updates.</p>
      <p style="color:#0E8C82;font-weight:bold">The LocaleHost team</p>
    `);
    } catch (error) {
        console.error("Unsubscribe error:", error);

        return htmlResponse(`
      <h1>Something went wrong.</h1>
      <p>Please try again later or contact hello@localehost.ie.</p>
    `, 500);
    }
};
