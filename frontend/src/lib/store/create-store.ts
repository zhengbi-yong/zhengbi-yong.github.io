'use client'

import { useCallback, useDebugValue, useSyncExternalStore } from 'react'
import { createStore } from 'zustand/vanilla'
import type {
  ExtractState,
  Mutate,
  StateCreator,
  StoreApi,
  StoreMutatorIdentifier,
} from 'zustand/vanilla'

type ReadonlyStoreApi<T> = Pick<StoreApi<T>, 'getState' | 'getInitialState' | 'subscribe'>

type UseBoundStore<S extends ReadonlyStoreApi<unknown>> = {
  (): ExtractState<S>
  <U>(selector: (state: ExtractState<S>) => U): U
} & S

type Create = {
  <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ): UseBoundStore<Mutate<StoreApi<T>, Mos>>
  <T>(): <Mos extends [StoreMutatorIdentifier, unknown][] = []>(
    initializer: StateCreator<T, [], Mos>
  ) => UseBoundStore<Mutate<StoreApi<T>, Mos>>
}

const identity = <T>(value: T) => value

function useBoundStore<S extends ReadonlyStoreApi<unknown>>(api: S): ExtractState<S>
function useBoundStore<S extends ReadonlyStoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U
): U
function useBoundStore<S extends ReadonlyStoreApi<unknown>, U>(
  api: S,
  selector: (state: ExtractState<S>) => U = identity as (state: ExtractState<S>) => U
) {
  const slice = useSyncExternalStore(
    api.subscribe,
    useCallback(() => selector(api.getState() as ExtractState<S>), [api, selector]),
    useCallback(() => selector(api.getInitialState() as ExtractState<S>), [api, selector])
  )

  useDebugValue(slice)
  return slice
}

const createImpl = <T, Mos extends [StoreMutatorIdentifier, unknown][] = []>(
  initializer: StateCreator<T, [], Mos>
) => {
  const api = createStore<T, Mos>(initializer)
  const useStore = ((selector?: (state: T) => unknown) =>
    useBoundStore(
      api as unknown as ReadonlyStoreApi<T>,
      (selector ?? identity) as (state: T) => unknown
    )) as UseBoundStore<Mutate<StoreApi<T>, Mos>>

  Object.assign(useStore, api)
  return useStore
}

export const create = ((initializer?: unknown) =>
  initializer
    ? createImpl(initializer as never)
    : createImpl) as Create
