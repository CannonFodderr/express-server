import { AsyncLocalStorage, AsyncResource } from 'node:async_hooks'

type StoreType = Map<string, string>;

export const context = new AsyncLocalStorage<StoreType>();
