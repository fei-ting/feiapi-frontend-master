import type { InterfaceDocParamSaveRequest } from '@/types/interfaceDoc';

/** 文档响应字段允许的最大嵌套深度。 */
export const MAX_DOC_NESTING_DEPTH = 8;

/** 响应字段父级选项。 */
export interface ResponseFieldParentOption {
  /** 父字段会话键。 */
  paramKey: string;
  /** 父字段完整路径。 */
  label: string;
}

/** 响应字段树校验结果。 */
export interface ResponseFieldTreeValidationResult {
  /** 树结构是否合法。 */
  valid: boolean;
  /** 首个校验错误。 */
  message: string;
}

/** 判断字段类型是否允许拥有子字段。 */
export const isResponseFieldContainer = (type: string): boolean => (
  type === 'object' || type === 'array'
);

/** 获取字段展示名称，未命名字段回退到会话键。 */
const fieldLabel = (field: InterfaceDocParamSaveRequest): string => field.name.trim() || field.paramKey;

/** 建立字段会话键索引。 */
const buildFieldMap = (
  fields: InterfaceDocParamSaveRequest[],
): Map<string, InterfaceDocParamSaveRequest> => new Map(fields.map((field) => [field.paramKey, field]));

/** 建立父字段到直接子字段列表的稳定索引。 */
const buildChildrenMap = (
  fields: InterfaceDocParamSaveRequest[],
): Map<string, InterfaceDocParamSaveRequest[]> => {
  const childrenMap = new Map<string, InterfaceDocParamSaveRequest[]>();
  fields.forEach((field) => {
    if (!field.parentParamKey) return;
    const children = childrenMap.get(field.parentParamKey) ?? [];
    children.push(field);
    childrenMap.set(field.parentParamKey, children);
  });
  return childrenMap;
};

/** 计算字段深度，异常父链返回空值。 */
const resolveFieldDepth = (
  field: InterfaceDocParamSaveRequest,
  fieldMap: Map<string, InterfaceDocParamSaveRequest>,
): number | undefined => {
  let depth = 1;
  let current = field;
  const visited = new Set<string>([current.paramKey]);
  while (current.parentParamKey) {
    const parent = fieldMap.get(current.parentParamKey);
    if (!parent || visited.has(parent.paramKey)) return undefined;
    visited.add(parent.paramKey);
    depth += 1;
    current = parent;
  }
  return depth;
};

/** 计算以指定字段为根的子树高度。 */
const resolveSubtreeHeight = (
  paramKey: string,
  childrenMap: Map<string, InterfaceDocParamSaveRequest[]>,
  visiting: Set<string> = new Set(),
): number | undefined => {
  if (visiting.has(paramKey)) return undefined;
  visiting.add(paramKey);
  const childHeights = (childrenMap.get(paramKey) ?? [])
    .map((child) => resolveSubtreeHeight(child.paramKey, childrenMap, new Set(visiting)));
  if (childHeights.some((height) => height === undefined)) return undefined;
  return 1 + Math.max(0, ...(childHeights as number[]));
};

/** 获取字段从根节点开始的完整路径。 */
export const getResponseFieldPath = (
  fields: InterfaceDocParamSaveRequest[],
  paramKey: string,
): string => {
  const fieldMap = buildFieldMap(fields);
  const field = fieldMap.get(paramKey);
  if (!field) return paramKey;
  const segments: string[] = [];
  const visited = new Set<string>();
  let current: InterfaceDocParamSaveRequest | undefined = field;
  while (current && !visited.has(current.paramKey)) {
    visited.add(current.paramKey);
    segments.unshift(fieldLabel(current));
    current = current.parentParamKey ? fieldMap.get(current.parentParamKey) : undefined;
  }
  return segments.join('.');
};

/** 按字段列表顺序递归获取指定字段的全部后代。 */
export const getResponseFieldDescendants = (
  fields: InterfaceDocParamSaveRequest[],
  paramKey: string,
): InterfaceDocParamSaveRequest[] => {
  const childrenMap = buildChildrenMap(fields);
  const descendants: InterfaceDocParamSaveRequest[] = [];
  const visited = new Set<string>([paramKey]);
  const visit = (parentKey: string): void => {
    (childrenMap.get(parentKey) ?? []).forEach((child) => {
      if (visited.has(child.paramKey)) return;
      visited.add(child.paramKey);
      descendants.push(child);
      visit(child.paramKey);
    });
  };
  visit(paramKey);
  return descendants;
};

/** 获取字段的合法父级选项。 */
export const getResponseFieldParentOptions = (
  fields: InterfaceDocParamSaveRequest[],
  currentKey: string,
): ResponseFieldParentOption[] => {
  const fieldMap = buildFieldMap(fields);
  const childrenMap = buildChildrenMap(fields);
  const descendantKeys = new Set(getResponseFieldDescendants(fields, currentKey).map((field) => field.paramKey));
  const subtreeHeight = resolveSubtreeHeight(currentKey, childrenMap);
  if (subtreeHeight === undefined) return [];
  return fields
    .filter((field) => field.paramKey !== currentKey)
    .filter((field) => !descendantKeys.has(field.paramKey))
    .filter((field) => isResponseFieldContainer(field.type))
    .filter((field) => {
      const parentDepth = resolveFieldDepth(field, fieldMap);
      return parentDepth !== undefined && parentDepth + subtreeHeight <= MAX_DOC_NESTING_DEPTH;
    })
    .map((field) => ({ paramKey: field.paramKey, label: getResponseFieldPath(fields, field.paramKey) }));
};

/** 校验响应字段树结构。 */
export const validateResponseFieldTree = (
  fields: InterfaceDocParamSaveRequest[],
): ResponseFieldTreeValidationResult => {
  const fieldMap = buildFieldMap(fields);
  if (fieldMap.size !== fields.length) return { valid: false, message: '响应字段键不能重复' };

  const missingParentGroups = new Map<string, string[]>();
  fields.forEach((field) => {
    if (!field.parentParamKey || fieldMap.has(field.parentParamKey)) return;
    const children = missingParentGroups.get(field.parentParamKey) ?? [];
    children.push(fieldLabel(field));
    missingParentGroups.set(field.parentParamKey, children);
  });
  if (missingParentGroups.size) {
    const details = Array.from(missingParentGroups.entries())
      .map(([parentKey, children]) => `${parentKey} -> [${children.join(', ')}]`)
      .join('；');
    return { valid: false, message: `响应字段父级不存在：${details}` };
  }

  const childrenMap = buildChildrenMap(fields);
  const scalarParent = fields.find((field) => (
    (childrenMap.get(field.paramKey)?.length ?? 0) > 0 && !isResponseFieldContainer(field.type)
  ));
  if (scalarParent) {
    return {
      valid: false,
      message: `响应字段 ${fieldLabel(scalarParent)} 的类型 ${scalarParent.type} 不能拥有子字段`,
    };
  }

  const siblingNames = new Set<string>();
  for (const field of fields) {
    const normalizedName = field.name.trim();
    if (!normalizedName) continue;
    const siblingKey = `${field.parentParamKey ?? ''}:${normalizedName}`;
    if (siblingNames.has(siblingKey)) return { valid: false, message: '同级响应字段名称不能重复' };
    siblingNames.add(siblingKey);
  }

  for (const field of fields) {
    const depth = resolveFieldDepth(field, fieldMap);
    if (depth === undefined) return { valid: false, message: '响应字段父子关系不能循环引用' };
    if (depth > MAX_DOC_NESTING_DEPTH) {
      return { valid: false, message: `响应字段嵌套深度不能超过 ${MAX_DOC_NESTING_DEPTH}` };
    }
  }
  return { valid: true, message: '' };
};

/** 生成删除当前字段及全部后代后的字段快照。 */
export const deleteResponseFieldSubtree = (
  fields: InterfaceDocParamSaveRequest[],
  paramKey: string,
): InterfaceDocParamSaveRequest[] => {
  const removedKeys = new Set([
    paramKey,
    ...getResponseFieldDescendants(fields, paramKey).map((field) => field.paramKey),
  ]);
  return fields.filter((field) => !removedKeys.has(field.paramKey)).map((field) => ({ ...field }));
};

/** 生成删除当前字段并提升直接子字段后的字段快照。 */
export const promoteResponseFieldChildren = (
  fields: InterfaceDocParamSaveRequest[],
  paramKey: string,
): InterfaceDocParamSaveRequest[] => {
  const target = fields.find((field) => field.paramKey === paramKey);
  if (!target) return fields.map((field) => ({ ...field }));
  return fields
    .filter((field) => field.paramKey !== paramKey)
    .map((field) => {
      if (field.parentParamKey !== paramKey) return { ...field };
      if (target.parentParamKey) return { ...field, parentParamKey: target.parentParamKey };
      const { parentParamKey: _parentParamKey, ...rootField } = field;
      return rootField;
    });
};
