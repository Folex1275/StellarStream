import express from "express";
import request from "supertest";
import splitAnalyzeRouter from "../api/v3/split-analyze.routes.js";
import { responseWrapper } from "../middleware/responseWrapper.js";

describe("POST /api/v3/split/analyze", () => {
  const app = express();
  app.use(express.json());
  app.use(responseWrapper);
  app.use("/api/v3", splitAnalyzeRouter);

  it("returns duplicate merge suggestions", async () => {
    const res = await request(app)
      .post("/api/v3/split/analyze")
      .send({
        recipients: [
          { address: "gabc123" },
          { address: "GABC123" },
          { address: "GDIFF456" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        duplicateGroups: [
          {
            address: "GABC123",
            count: 2,
            rowIndexes: [0, 1],
          },
        ],
      },
    });
    expect(res.body.data.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "merge_duplicate_addresses",
          rowIndexes: [0, 1],
        }),
      ]),
    );
  });

  it("returns 400 for an invalid payload", async () => {
    const res = await request(app).post("/api/v3/split/analyze").send({
      recipients: [],
    });

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      error: "Invalid payload",
    });
    expect(res.body.details).toBeDefined();
  });
});
