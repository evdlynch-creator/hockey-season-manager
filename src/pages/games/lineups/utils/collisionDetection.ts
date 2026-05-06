import { 
  closestCorners, 
  rectIntersection, 
  pointerWithin,
  CollisionDetection
} from '@dnd-kit/core'
import { UNITS } from '../constants'

export const customCollisionDetectionStrategy: CollisionDetection = (args) => {
  // First, check if the pointer is within any specific droppable
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // Then try rectIntersection for precise hits
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) {
    return rectCollisions;
  }

  // If no rect collisions, try closest corners
  const closestCornersCollisions = closestCorners(args);
  
  // If we have collisions from closest corners
  if (closestCornersCollisions.length > 0) {
    // If we're dragging a player over a container/unit directly, prioritize that
    const containerCollision = closestCornersCollisions.find(collision => 
      UNITS.includes(collision.id as string) || collision.id === 'roster'
    );
    
    if (containerCollision) {
      return [containerCollision];
    }
  }

  return closestCornersCollisions;
};
