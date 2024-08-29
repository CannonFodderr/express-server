import { Router } from "express";

class NotFoundController {
    constructor(app: Router) {
        app.use((_req, res) => {
            res.status(404).json({
              code: 404,
              status: "Error",
              message: "Route not found.",
              data: null,
            });
           });
    }

}



export default function createNotFoundController(app: Router) {
    return new NotFoundController(app);
}
