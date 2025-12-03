import { Router, Request, Response } from "express";

const router = Router();

router.post("/classes", (req: Request, res: Response) => {
  res.send("Class created");
});

router.get("/classes", (req: Request, res: Response) => {
  res.send("Classes route");
});

router.get("/classes/:id", (req: Request, res: Response) => {
  res.send(`Class with ID ${req.params.id}`);
});


export default router;