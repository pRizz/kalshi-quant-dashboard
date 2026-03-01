import { jsonResponse } from "~/server/http/json-response";
import { getPortfolioSnapshot } from "~/server/portfolio/portfolio-service";

export const GET = async () => jsonResponse(getPortfolioSnapshot());
