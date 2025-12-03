import { Router, Request, Response } from "express";

const router = Router();

router.post("/events", (req: Request, res: Response) => {
  res.send("School created");
});
router.get("/events", (req: Request, res: Response) => {
  res.send("events route");
});

router.get("/events/:id", (req: Request, res: Response) => {
  res.send(`Event with ID ${req.params.id}`);
});

export default router;
