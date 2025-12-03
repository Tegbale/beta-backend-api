import { Router, Request, Response } from "express";

const router = Router();

router.post("/posts", (req: Request, res: Response) => {
  res.send("Post created");
});
router.get("/posts", (req: Request, res: Response) => {
  res.send("posts route");
});

router.get("/post/:id", (req: Request, res: Response) => {
  res.send(`post with ID ${req.params.id}`);
});

export default router;
