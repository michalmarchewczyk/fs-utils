import type express from 'express';
import { ServerResponse } from 'node:http';

const getEnhancerMiddleware =
  (app: express.Application) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.locals.path = req.path;
    res.locals.query = req.query;

    if (req.method === 'GET' || req.headers['x-enhanced-form']) {
      next();
      return;
    }

    req.headers['x-enhanced-form'] = 'true';

    const req2 = { ...req } as express.Request;
    const res2 = new ServerResponse(req);
    app(req2, res2);

    req.method = 'GET';
    next();
  };

export default getEnhancerMiddleware;
