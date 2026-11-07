import { CanvasItem, AnchorSide, ConnectorAnchor } from '@/types/canvas';

/**
 * Returns the world (x, y) coordinates for a given anchor side on a CanvasItem,
 * taking into account rotation if present.
 */
export function getAnchorPosition(item: CanvasItem, side: AnchorSide): { x: number; y: number } {
  const cx = item.x + item.width / 2;
  const cy = item.y + item.height / 2;
  let px = cx;
  let py = cy;

  switch (side) {
    case 'top':
      px = cx;
      py = item.y;
      break;
    case 'right':
      px = item.x + item.width;
      py = cy;
      break;
    case 'bottom':
      px = cx;
      py = item.y + item.height;
      break;
    case 'left':
      px = item.x;
      py = cy;
      break;
  }

  const rot = (item.rotation || 0) * (Math.PI / 180);
  if (rot !== 0) {
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: Math.round(cx + dx * cos - dy * sin),
      y: Math.round(cy + dx * sin + dy * cos),
    };
  }

  return { x: Math.round(px), y: Math.round(py) };
}

/**
 * Returns the outward normal direction vector for an anchor side.
 */
export function getAnchorNormal(side: AnchorSide): { x: number; y: number } {
  switch (side) {
    case 'top':
      return { x: 0, y: -1 };
    case 'right':
      return { x: 1, y: 0 };
    case 'bottom':
      return { x: 0, y: 1 };
    case 'left':
      return { x: -1, y: 0 };
  }
}

/**
 * Simplifies a sequence of orthogonal points by eliminating consecutive duplicates
 * and collapsing collinear segments.
 */
export function simplifyOrthogonalPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 2) return points;

  // 1. Remove consecutive identical points
  const noDups: { x: number; y: number }[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = noDups[noDups.length - 1];
    const curr = points[i];
    if (Math.abs(curr.x - prev.x) > 0.5 || Math.abs(curr.y - prev.y) > 0.5) {
      noDups.push(curr);
    }
  }

  if (noDups.length <= 2) return noDups;

  // 2. Collapse collinear points
  const simplified: { x: number; y: number }[] = [noDups[0]];
  for (let i = 1; i < noDups.length - 1; i++) {
    const prev = simplified[simplified.length - 1];
    const curr = noDups[i];
    const next = noDups[i + 1];

    const isCollinearX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
    const isCollinearY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;

    if (!isCollinearX && !isCollinearY) {
      simplified.push(curr);
    }
  }
  simplified.push(noDups[noDups.length - 1]);

  return simplified;
}

/**
 * Calculates orthogonal (horizontal & vertical) waypoints between two points,
 * exiting and entering according to anchor normal vectors.
 */
export function getOrthogonalPoints(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  fromSide?: AnchorSide,
  toSide?: AnchorSide
): { x: number; y: number }[] {
  const stub = 24;
  const normFrom = fromSide ? getAnchorNormal(fromSide) : null;
  const normTo = toSide ? getAnchorNormal(toSide) : null;

  // If sides are not specified, fallback to a standard S-step
  if (!normFrom && !normTo) {
    const midX = Math.round((fromPos.x + toPos.x) / 2);
    return simplifyOrthogonalPoints([
      fromPos,
      { x: midX, y: fromPos.y },
      { x: midX, y: toPos.y },
      toPos,
    ]);
  }

  // If only fromSide is provided (e.g. dragging draft line to cursor)
  if (normFrom && !normTo) {
    const isFromH = normFrom.x !== 0;
    if (isFromH) {
      const midX = Math.round((fromPos.x + toPos.x) / 2);
      const exitX = fromPos.x + normFrom.x * stub;
      const turnX = normFrom.x > 0 ? Math.max(midX, exitX) : Math.min(midX, exitX);
      return simplifyOrthogonalPoints([
        fromPos,
        { x: turnX, y: fromPos.y },
        { x: turnX, y: toPos.y },
        toPos,
      ]);
    } else {
      const midY = Math.round((fromPos.y + toPos.y) / 2);
      const exitY = fromPos.y + normFrom.y * stub;
      const turnY = normFrom.y > 0 ? Math.max(midY, exitY) : Math.min(midY, exitY);
      return simplifyOrthogonalPoints([
        fromPos,
        { x: fromPos.x, y: turnY },
        { x: toPos.x, y: turnY },
        toPos,
      ]);
    }
  }

  // Both fromSide and toSide are specified
  const isFromH = normFrom!.x !== 0;
  const isToH = normTo!.x !== 0;

  const pExit = {
    x: fromPos.x + normFrom!.x * stub,
    y: fromPos.y + normFrom!.y * stub,
  };
  const pEntry = {
    x: toPos.x + normTo!.x * stub,
    y: toPos.y + normTo!.y * stub,
  };

  const rawPoints: { x: number; y: number }[] = [fromPos];

  if (isFromH && isToH) {
    // Both horizontal (left/right)
    const canDirectS =
      (normFrom!.x > 0 && normTo!.x < 0 && pExit.x <= pEntry.x) ||
      (normFrom!.x < 0 && normTo!.x > 0 && pExit.x >= pEntry.x);

    if (canDirectS) {
      const midX = Math.round((fromPos.x + toPos.x) / 2);
      rawPoints.push({ x: midX, y: fromPos.y });
      rawPoints.push({ x: midX, y: toPos.y });
    } else {
      const midY =
        toPos.y < fromPos.y
          ? Math.min(fromPos.y, toPos.y) - 40
          : Math.max(fromPos.y, toPos.y) + 40;
      rawPoints.push({ x: pExit.x, y: fromPos.y });
      rawPoints.push({ x: pExit.x, y: midY });
      rawPoints.push({ x: pEntry.x, y: midY });
      rawPoints.push({ x: pEntry.x, y: toPos.y });
    }
  } else if (!isFromH && !isToH) {
    // Both vertical (top/bottom)
    const canDirectS =
      (normFrom!.y > 0 && normTo!.y < 0 && pExit.y <= pEntry.y) ||
      (normFrom!.y < 0 && normTo!.y > 0 && pExit.y >= pEntry.y);

    if (canDirectS) {
      const midY = Math.round((fromPos.y + toPos.y) / 2);
      rawPoints.push({ x: fromPos.x, y: midY });
      rawPoints.push({ x: toPos.x, y: midY });
    } else {
      const midX =
        toPos.x < fromPos.x
          ? Math.min(fromPos.x, toPos.x) - 40
          : Math.max(fromPos.x, toPos.x) + 40;
      rawPoints.push({ x: fromPos.x, y: pExit.y });
      rawPoints.push({ x: midX, y: pExit.y });
      rawPoints.push({ x: midX, y: pEntry.y });
      rawPoints.push({ x: toPos.x, y: pEntry.y });
    }
  } else if (isFromH && !isToH) {
    // Horizontal start, Vertical end
    const canSingleCorner =
      (normFrom!.x > 0 ? toPos.x >= pExit.x : toPos.x <= pExit.x) &&
      (normTo!.y > 0 ? fromPos.y <= pEntry.y : fromPos.y >= pEntry.y);

    if (canSingleCorner) {
      rawPoints.push({ x: toPos.x, y: fromPos.y });
    } else {
      rawPoints.push({ x: pExit.x, y: fromPos.y });
      rawPoints.push({ x: pExit.x, y: pEntry.y });
      rawPoints.push({ x: toPos.x, y: pEntry.y });
    }
  } else {
    // Vertical start, Horizontal end
    const canSingleCorner =
      (normFrom!.y > 0 ? toPos.y >= pExit.y : toPos.y <= pExit.y) &&
      (normTo!.x > 0 ? fromPos.x <= pEntry.x : fromPos.x >= pEntry.x);

    if (canSingleCorner) {
      rawPoints.push({ x: fromPos.x, y: toPos.y });
    } else {
      rawPoints.push({ x: fromPos.x, y: pExit.y });
      rawPoints.push({ x: pEntry.x, y: pExit.y });
      rawPoints.push({ x: pEntry.x, y: toPos.y });
    }
  }

  rawPoints.push(toPos);
  return simplifyOrthogonalPoints(rawPoints);
}

/**
 * Converts a sequence of orthogonal points into an SVG path string
 * with rounded corner radius at turns (e.g. radius = 14px).
 */
export function orthogonalPointsToSvgPath(
  points: { x: number; y: number }[],
  radius = 14
): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length - 1; i++) {
    const pPrev = points[i - 1];
    const pCurr = points[i];
    const pNext = points[i + 1];

    const d1x = pCurr.x - pPrev.x;
    const d1y = pCurr.y - pPrev.y;
    const len1 = Math.hypot(d1x, d1y);

    const d2x = pNext.x - pCurr.x;
    const d2y = pNext.y - pCurr.y;
    const len2 = Math.hypot(d2x, d2y);

    if (len1 === 0 || len2 === 0) continue;

    // Corner radius cannot exceed half of either adjacent segment
    const r = Math.min(radius, len1 / 2, len2 / 2);

    if (r < 0.5) {
      d += ` L ${pCurr.x} ${pCurr.y}`;
      continue;
    }

    const u1x = d1x / len1;
    const u1y = d1y / len1;
    const u2x = d2x / len2;
    const u2y = d2y / len2;

    const startX = Number((pCurr.x - u1x * r).toFixed(1));
    const startY = Number((pCurr.y - u1y * r).toFixed(1));
    const endX = Number((pCurr.x + u2x * r).toFixed(1));
    const endY = Number((pCurr.y + u2y * r).toFixed(1));

    d += ` L ${startX} ${startY} Q ${pCurr.x} ${pCurr.y} ${endX} ${endY}`;
  }

  const last = points[points.length - 1];
  d += ` L ${last.x} ${last.y}`;
  return d;
}

/**
 * Calculates all intermediate points/joints along a connector.
 * If custom waypoints are set, returns them; otherwise extracts the bend points.
 */
export function computeConnectorJoints(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  fromSide?: AnchorSide,
  toSide?: AnchorSide,
  style: 'orthogonal' | 'curved' | 'straight' = 'orthogonal',
  waypoints?: { x: number; y: number }[]
): { x: number; y: number }[] {
  if (waypoints && waypoints.length > 0) {
    return waypoints;
  }
  if (style === 'orthogonal') {
    const pts = getOrthogonalPoints(fromPos, toPos, fromSide, toSide);
    if (pts.length > 2) {
      return pts.slice(1, -1);
    }
  }
  return [];
}

/**
 * Generates an SVG path string for a connector between two points,
 * supporting custom interactive waypoints/joints and cornerStyle ('rounded' | 'sharp').
 * Defaults to 'orthogonal': straight lines with rounded radius at turns/bends.
 */
export function getConnectorPath(
  fromPos: { x: number; y: number },
  toPos: { x: number; y: number },
  fromSide?: AnchorSide,
  toSide?: AnchorSide,
  style: 'orthogonal' | 'curved' | 'straight' = 'orthogonal',
  radius = 14,
  waypoints?: { x: number; y: number }[],
  cornerStyle: 'rounded' | 'sharp' = 'rounded'
): string {
  const effectiveRadius = cornerStyle === 'sharp' ? 0 : radius;

  // Custom waypoints present: route through each joint
  if (waypoints && waypoints.length > 0) {
    if (style === 'straight') {
      let d = `M ${fromPos.x} ${fromPos.y}`;
      for (const wp of waypoints) {
        d += ` L ${wp.x} ${wp.y}`;
      }
      d += ` L ${toPos.x} ${toPos.y}`;
      return d;
    }

    if (style === 'curved') {
      const allPts = [fromPos, ...waypoints, toPos];
      let d = `M ${allPts[0].x} ${allPts[0].y}`;
      for (let i = 0; i < allPts.length - 1; i++) {
        const p0 = i > 0 ? allPts[i - 1] : allPts[i];
        const p1 = allPts[i];
        const p2 = allPts[i + 1];
        const p3 = i < allPts.length - 2 ? allPts[i + 2] : p2;

        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;

        d += ` C ${Number(cp1x.toFixed(1))} ${Number(cp1y.toFixed(1))}, ${Number(cp2x.toFixed(1))} ${Number(cp2y.toFixed(1))}, ${p2.x} ${p2.y}`;
      }
      return d;
    }

    // Default: 'orthogonal' routing through waypoints
    const fullPoints: { x: number; y: number }[] = [];
    const seg1 = getOrthogonalPoints(fromPos, waypoints[0], fromSide, undefined);
    fullPoints.push(...seg1);

    for (let i = 0; i < waypoints.length - 1; i++) {
      const seg = getOrthogonalPoints(waypoints[i], waypoints[i + 1], undefined, undefined);
      fullPoints.push(...seg.slice(1));
    }

    const lastWp = waypoints[waypoints.length - 1];
    const segLast = getOrthogonalPoints(lastWp, toPos, undefined, toSide);
    fullPoints.push(...segLast.slice(1));

    const simplified = simplifyOrthogonalPoints(fullPoints);
    return orthogonalPointsToSvgPath(simplified, effectiveRadius);
  }

  // No custom waypoints: standard path
  const dx = toPos.x - fromPos.x;
  const dy = toPos.y - fromPos.y;
  const dist = Math.hypot(dx, dy);

  if (style === 'straight' || dist < 10) {
    return `M ${fromPos.x} ${fromPos.y} L ${toPos.x} ${toPos.y}`;
  }

  if (style === 'curved') {
    // Smooth cubic bezier calculation
    const curvature = Math.max(Math.min(dist * 0.45, 120), 40);

    let cp1 = { x: fromPos.x, y: fromPos.y };
    if (fromSide) {
      const norm = getAnchorNormal(fromSide);
      cp1 = {
        x: fromPos.x + norm.x * curvature,
        y: fromPos.y + norm.y * curvature,
      };
    } else {
      const angle = Math.atan2(dy, dx);
      cp1 = {
        x: fromPos.x + Math.cos(angle) * (dist * 0.25),
        y: fromPos.y + Math.sin(angle) * (dist * 0.25),
      };
    }

    let cp2 = { x: toPos.x, y: toPos.y };
    if (toSide) {
      const norm = getAnchorNormal(toSide);
      cp2 = {
        x: toPos.x + norm.x * curvature,
        y: toPos.y + norm.y * curvature,
      };
    } else {
      const angle = Math.atan2(-dy, -dx);
      cp2 = {
        x: toPos.x + Math.cos(angle) * (dist * 0.25),
        y: toPos.y + Math.sin(angle) * (dist * 0.25),
      };
    }

    return `M ${fromPos.x} ${fromPos.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${toPos.x} ${toPos.y}`;
  }

  // Default: 'orthogonal' (straight lines with radius at turns/bends)
  const points = getOrthogonalPoints(fromPos, toPos, fromSide, toSide);
  return orthogonalPointsToSvgPath(points, effectiveRadius);
}

/**
 * Searches across all canvas items to find the closest magnetic anchor point
 * within `maxDist` pixels in world coordinates.
 */
export function findNearestAnchor(
  items: CanvasItem[],
  worldX: number,
  worldY: number,
  excludeItemId?: string,
  maxDist = 32
): { item: CanvasItem; side: AnchorSide; position: { x: number; y: number }; dist: number } | null {
  const SIDES: AnchorSide[] = ['top', 'right', 'bottom', 'left'];
  let closest: { item: CanvasItem; side: AnchorSide; position: { x: number; y: number }; dist: number } | null = null;
  let minDist = maxDist;

  for (const item of items) {
    if (excludeItemId && item.id === excludeItemId) continue;

    // Fast bounding box check (with padding)
    const pad = maxDist + 20;
    if (
      worldX < item.x - pad ||
      worldX > item.x + item.width + pad ||
      worldY < item.y - pad ||
      worldY > item.y + item.height + pad
    ) {
      continue;
    }

    for (const side of SIDES) {
      const pos = getAnchorPosition(item, side);
      const d = Math.hypot(worldX - pos.x, worldY - pos.y);
      if (d < minDist) {
        minDist = d;
        closest = {
          item,
          side,
          position: pos,
          dist: d,
        };
      }
    }
  }

  return closest;
}

/**
 * Resolves a connector endpoint (either an anchor reference or a free point)
 * to its concrete world coordinates.
 */
export function resolveEndpoint(
  endpoint: ConnectorAnchor | { x: number; y: number },
  items: CanvasItem[]
): { position: { x: number; y: number }; side?: AnchorSide; item?: CanvasItem } | null {
  if ('itemId' in endpoint) {
    const item = items.find((i) => i.id === endpoint.itemId);
    if (!item) return null;
    return {
      position: getAnchorPosition(item, endpoint.side),
      side: endpoint.side,
      item,
    };
  }
  return { position: endpoint };
}

