import { Router, Request, Response } from "express";

const router = Router();

router.post("/schools", (req: Request, res: Response) => {
  res.send("School created");
});
router.get("/schools", (req: Request, res: Response) => {
  res.send("Schools route");
});

router.get("/schools/:id", (req: Request, res: Response) => {
  res.send(`School with ID ${req.params.id}`);
});

export default router;
