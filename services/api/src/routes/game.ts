import { dealRequestSchema, paths } from '@unspoken/api-contract';
import { bank } from '@unspoken/content';
import { dealFromBank, gameConfig, newSeed, type DealtDeck, type GameConfig } from '@unspoken/core';
import { Hono } from 'hono';

import { validJson, type AppEnv } from '../http';

// The rules and the word bank: what offline clients bundle, served so they can follow the server.
export const gameRoutes = new Hono<AppEnv>()
  .get(paths.config, (c) => c.json<GameConfig>(gameConfig))
  .post(paths.decks, validJson(dealRequestSchema), (c) => {
    // Without a seed the server picks one and returns it, so the client can deal the same deck again.
    const { seed = newSeed(), ...request } = c.req.valid('json');
    return c.json<DealtDeck>(dealFromBank(bank, { ...request, seed }));
  });
