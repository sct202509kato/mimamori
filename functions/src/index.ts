import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import cors = require("cors");

admin.initializeApp();

// ★ CORS: Vercel本番を許可
const corsHandler = cors({
    origin: ["https://mimamori-web-ten.vercel.app"],
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204,
});

// ★ withCors: preflight(OPTIONS) を必ず返す
function withCors(handler: (req: any, res: any) => Promise<void> | void) {
    return (req: any, res: any) => {
        corsHandler(req, res, () => {
            if (req.method === "OPTIONS") {
                res.status(204).send("");
                return;
            }
            return handler(req, res);
        });
    };
}

/** JSTの日付キー（YYYY-MM-DD） */
function getDateKeyJST(): string {
    const jst = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" })
    );
    const y = jst.getFullYear();
    const m = String(jst.getMonth() + 1).padStart(2, "0");
    const d = String(jst.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Firebase Auth 必須 */
async function requireAuth(req: any): Promise<string> {
    const auth = req.headers.authorization || "";
    const m = auth.match(/^Bearer (.+)$/);
    if (!m) throw new Error("Missing Bearer token");
    const decoded = await admin.auth().verifyIdToken(m[1]);
    return decoded.uid;
}

/** POST /checkin（今日も無事ボタン） */
export const checkin = onRequest(
    withCors(async (req, res) => {
        try {
            if (req.method !== "POST") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const uid = await requireAuth(req);
            const dateKey = getDateKeyJST();

            const db = getFirestore();
            const ref = db.doc(`users/${uid}/checkins/${dateKey}`);
            const snap = await ref.get();

            if (snap.exists) {
                res.json({ ok: true, already: true, dateKey });
                return;
            }

            await ref.set({
                checkedAt: FieldValue.serverTimestamp(),
                tz: "Asia/Tokyo",
            });

            res.json({ ok: true, already: false, dateKey });
        } catch (e: any) {
            res.status(401).json({ ok: false, error: e.message ?? String(e) });
        }
    })
);

/** GET /status（今日押した？確認用） */
export const status = onRequest(
    withCors(async (req, res) => {
        try {
            if (req.method !== "GET") {
                res.status(405).send("Method Not Allowed");
                return;
            }

            const uid = await requireAuth(req);
            const dateKey = getDateKeyJST();

            const db = getFirestore();
            const ref = db.doc(`users/${uid}/checkins/${dateKey}`);
            const snap = await ref.get();

            if (!snap.exists) {
                res.json({ ok: true, dateKey, checked: false });
                return;
            }

            const data = snap.data();
            const checkedAtIso = data?.checkedAt?.toDate?.().toISOString?.() ?? null;

            res.json({
                ok: true,
                dateKey,
                checked: true,
                checkedAt: checkedAtIso,
            });
        } catch (e: any) {
            res.status(401).json({ ok: false, error: e.message ?? String(e) });
        }
    })
);
