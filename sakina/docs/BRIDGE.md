# Map bridge

Import `mapBridge` from `src/bridge.ts`, or use `window.sakinaMap` once the application mounts. Original methods remain compatible:

- `getMapContext()` — location, floor, ritual progress, destination, remaining demo distance, region.
- `getCurrentLocation()` — local x/y/z, graph node, user floor, mock accuracy.
- `getCurrentFloor()` — currently viewed floor (may differ from user's floor).
- `getCurrentRitualStage()`, `getRitualProgress()`, `getNextRitualDestination()` — existing Umrah state.
- `navigateTo(poiId)` — builds a route; returns success. Does not start walking automatically.
- `focusOnLocation(poiId)` — selects the POI and moves the camera to its region.
- `findNearest(category)` — finds a reachable service respecting accessibility and closures.
- `pauseJourney()`, `resumeJourney()` — local persistence and movement.
- `confirmArrival(poiId)` — validates proximity on the correct floor; does not complete a ritual automatically.

Added:

```ts
getCurrentRegion(): { viewed: RegionView; user: RegionId }
focusOnRegion(region: RegionView): void
startRegionSimulation(region: RegionId): void
```

`RegionId`: `haram | towers | mina | muzdalifah | arafat`.
`RegionView`: `RegionId | overview`.

`focusOnRegion` preserves user coordinates and ritual progress.
`startRegionSimulation` explicitly moves the virtual user to the region's entrance and starts navigation to its main destination; existing Umrah counters remain intact.

Examples:

```ts
window.sakinaMap.focusOnRegion('mina')
window.sakinaMap.startRegionSimulation('arafat')
window.sakinaMap.navigateTo('namirah')
window.sakinaMap.navigateTo('jamarat-roof')
```

Coordinates and regional distances are schematic, never real geographic navigation. No external model files or mapping API is required. See REGIONS.md for the existing Siraj backend dependency.
