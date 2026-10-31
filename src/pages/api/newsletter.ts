
import type { APIRoute } from "astro";
import { Resend } from "resend";
import { createUnsubscribeToken } from "../../lib/unsubscribe";

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();

        const email =
            typeof body.email === "string"
                ? body.email.trim().toLowerCase()
                : "";

        const audience = body.audience;

        if (
            !email ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            return Response.json(
                { error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        if (!["guest", "host"].includes(audience)) {
            return Response.json(
                { error: "Invalid audience." },
                { status: 400 }
            );
        }

        if (body.consent !== true) {
            return Response.json(
                { error: "Please agree to receive launch updates." },
                { status: 400 }
            );
        }

        const segmentId =
            audience === "guest"
                ? import.meta.env.RESEND_GUEST_SEGMENT_ID
                : import.meta.env.RESEND_HOST_SEGMENT_ID;

        if (!segmentId || !import.meta.env.RESEND_API_KEY) {
            throw new Error("Newsletter configuration is missing.");
        }

        const { data, error } = await resend.contacts.create({
            email,
            unsubscribed: false,
            segments: [{ id: segmentId }],
        });

        if (error) {
            console.error("Resend error:", error);

            return Response.json(
                { error: "Unable to add you to the list. Please try again." },
                { status: 500 }
            );
        }

        const isGuest = audience === "guest";

        const subject = isGuest
            ? "Welcome to LocaleHost — you're on the list!"
            : "Thanks for your interest in hosting with LocaleHost!";

        const token = createUnsubscribeToken(email);

        const unsubscribeUrl = new URL(
            "/api/unsubscribe",
            import.meta.env.SITE_URL
        );

        unsubscribeUrl.searchParams.set("token", token);

        const unsubscribeLink = unsubscribeUrl.toString();

        const footer = `
            <div style="margin-top:32px;padding-top:20px;border-top:1px solid #E1E3EC;text-align:center;">
                <p style="font-size:12px;color:#9395AA;">
                    You're receiving this email because you signed up for LocaleHost updates.
                </p>
                <a
                    href="${unsubscribeLink}"
                    style="font-size:12px;color:#0E8C82;text-decoration:underline;"
                >
                    Unsubscribe from LocaleHost updates
                </a>
            </div>
        `;

        const html = isGuest
            ? `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #14152A; line-height: 1.7;">
                <h1 style="color: #372F92;">Welcome to LocaleHost!</h1>
                <p>Thanks for joining our early access list.</p>
                <p>We're building a fairer way to find and share rooms in Ireland, with verified hosts, verified guests, and booking fees that are held until check-in.</p>
                <p>We'll email you when bookings open.</p>
                <p>In the meantime, thanks for being part of the journey.</p>
                <p style="color: #0E8C82; font-weight: bold;">The LocaleHost team</p>
                ${footer}
            </div>
            `
            : `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: auto; color: #14152A; line-height: 1.7;">
                <h1 style="color: #372F92;">Thanks for your interest!</h1>
                <p>Thanks for joining the LocaleHost host early access list.</p>
                <p>We're building a room-sharing platform for Ireland focused on verified people, transparent fees, and fairer bookings.</p>
                <p>We'll be in touch when we're ready to welcome hosts onto the platform.</p>
                <p style="color: #0E8C82; font-weight: bold;">The LocaleHost team</p>
                ${footer}
            </div>
        `;

        const { data: emailData, error: emailError } =
            await resend.emails.send({
                from: "LocaleHost <onboarding@resend.dev>",
                to: email,
                subject,
                html,
                headers: {
                    "List-Unsubscribe": `<${unsubscribeLink}>`,
                    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                },
            });

        if (emailError) {
            console.error("Confirmation email failed:", emailError);
        }

        return Response.json({
            success: true,
            confirmationEmailSent: !emailError,
            message: "You're on the list!",
            id: data?.id,
            emailId: emailData?.id,
        });

    } catch (error) {
        console.error("Newsletter signup error:", error);

        return Response.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }
};
