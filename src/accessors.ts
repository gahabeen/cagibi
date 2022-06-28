import { InstanceId, InstanceSource, ParentInstanceId } from './symbols';
import { ObjectLike } from './types';
import { traverse } from './utils';

export const getId = (target: any): string => target?.[InstanceId];
export const getParentId = (target: any): string => target?.[ParentInstanceId];
export const getSource = (target: any): string => target?.[InstanceSource];

export const getReferences = (target: any): Map<string, ObjectLike> => {
  const deps = new Map();

  const walker = (_: any, value: any) => {
    const instanceId = getId(value);
    if (instanceId) deps.set(instanceId, value);
  }

  traverse({ target }, walker);

  return deps;
}

export const getParentReferences = (target: any): string[] => {
  const deps = new Set<string>();

  const walker = (_: any, value: any) => {
    const parentInstanceId = getParentId(value);
    if (parentInstanceId) deps.add(parentInstanceId);
  }

  traverse(target, walker);
  return [...deps.values()];
}