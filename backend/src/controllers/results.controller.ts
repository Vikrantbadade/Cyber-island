import { Request, Response } from 'express';
import * as results from '../services/results.service';

export async function finalize(_req: Request, res: Response) {
  res.json(await results.finalizeOfficialResults());
}

export async function csv(_req: Request, res: Response) {
  const body = await results.generateOfficialCsv();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="cyberisland-official-results.csv"');
  res.send(body);
}
