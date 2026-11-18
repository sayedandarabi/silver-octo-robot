import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createCorsMiddleware } from "./cors";
import { clearLegacySessionCookie } from "./cookies";
import { encryptBackup } from "../../lib/saderatpro-phase3-engine";
import { createBackupRun, finishBackupRun } from "../saderatpro-phase3-db";
import { listJournalEntries, listPurchases, listSales } from "../saderatpro-db";

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(createCorsMiddleware());
  app.use(clearLegacySessionCookie());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.post("/api/scheduled/backup", async (req, res) => {
    const expected = process.env.SADERATPRO_SCHEDULE_TOKEN;
    if (!expected || req.header("x-saderatpro-schedule-token") !== expected) return res.status(401).json({ ok: false, error: "scheduled_token_invalid" });
    const businessId = typeof req.body?.businessId === "string" ? req.body.businessId : "";
    const password = process.env.SADERATPRO_BACKUP_PASSWORD;
    if (!businessId || !password) return res.status(400).json({ ok: false, error: "scheduled_backup_not_configured" });
    const runId = `scheduled-backup-${businessId}-${Date.now()}`;
    await createBackupRun({ id: runId, businessId, destination: "TELEGRAM", status: "STARTED" });
    try {
      const payload = { businessId, generatedAt: new Date().toISOString(), sales: await listSales(businessId), purchases: await listPurchases(businessId), journals: await listJournalEntries(businessId) };
      const encrypted = encryptBackup(payload, password);
      await finishBackupRun(runId, "COMPLETED", encrypted.checksum);
      return res.json({ ok: true, runId, checksum: encrypted.checksum });
    } catch (error) {
      await finishBackupRun(runId, "FAILED", "", error instanceof Error ? error.message : "scheduled_backup_failed");
      return res.status(500).json({ ok: false, runId, error: "scheduled_backup_failed" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log("[api] server listening");
  });
}

startServer().catch(() => {
  console.error("[api] server failed to start");
});
