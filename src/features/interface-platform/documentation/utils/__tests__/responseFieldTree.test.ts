import { describe, expect, it } from 'vitest';
import type { InterfaceDocParamSaveRequest } from '@/features/interface-platform/documentation/types/interfaceDoc';
import {
  deleteResponseFieldSubtree,
  getResponseFieldDescendants,
  getResponseFieldParentOptions,
  getResponseFieldPath,
  promoteResponseFieldChildren,
  validateResponseFieldTree,
} from '@/features/interface-platform/documentation/utils/responseFieldTree';

/** 构建响应字段测试节点。 */
const field = (
  paramKey: string,
  name: string,
  type: string,
  parentParamKey?: string,
): InterfaceDocParamSaveRequest => ({
  paramKey,
  ...(parentParamKey ? { parentParamKey } : {}),
  paramScene: 'RESPONSE',
  name,
  type,
  required: false,
  nullable: true,
  sortOrder: 1,
});

/** 构建常用响应字段树。 */
const buildFields = (): InterfaceDocParamSaveRequest[] => [
  field('data', 'data', 'object'),
  field('users', 'users', 'array', 'data'),
  field('name', 'name', 'string', 'users'),
  field('meta', 'meta', 'object', 'data'),
  field('page', 'page', 'number', 'meta'),
];

describe('responseFieldTree', () => {
  it('生成完整路径并在字段未命名时回退会话键', () => {
    const fields = buildFields();
    fields[2] = field('response-3', '', 'string', 'users');

    expect(getResponseFieldPath(fields, 'response-3')).toBe('data.users.response-3');
    expect(getResponseFieldPath(fields, 'missing')).toBe('missing');
  });

  it('按稳定的深度优先顺序获取全部后代', () => {
    expect(getResponseFieldDescendants(buildFields(), 'data').map((item) => item.paramKey))
      .toEqual(['users', 'name', 'meta', 'page']);
  });

  it('父级选项排除自身、后代、标量和导致超深的节点', () => {
    const depthFields = Array.from({ length: 8 }, (_, index) => field(
      `depth-${index + 1}`,
      `depth${index + 1}`,
      'object',
      index === 0 ? undefined : `depth-${index}`,
    ));
    const fields = [field('moving', 'moving', 'object'), field('scalar', 'scalar', 'string'), ...depthFields];
    const optionKeys = getResponseFieldParentOptions(fields, 'moving').map((option) => option.paramKey);

    expect(optionKeys).toContain('depth-7');
    expect(optionKeys).not.toContain('moving');
    expect(optionKeys).not.toContain('scalar');
    expect(optionKeys).not.toContain('depth-8');
  });

  it('父级选项排除当前字段的全部后代', () => {
    expect(getResponseFieldParentOptions(buildFields(), 'data').map((option) => option.paramKey)).toEqual([]);
  });

  it('校验合法对象和数组容器树', () => {
    expect(validateResponseFieldTree(buildFields())).toEqual({ valid: true, message: '' });
  });

  it('校验缺失父级并按父键分组列出字段', () => {
    const fields = [
      field('name', 'name', 'string', 'missing-a'),
      field('age', 'age', 'number', 'missing-a'),
      field('detail', 'detail', 'object', 'missing-b'),
    ];

    expect(validateResponseFieldTree(fields).message)
      .toBe('响应字段父级不存在：missing-a -> [name, age]；missing-b -> [detail]');
  });

  it('一次性返回全部标量父级', () => {
    expect(validateResponseFieldTree([
      field('data', 'data', 'string'),
      field('name', 'name', 'string', 'data'),
      field('count', 'count', 'number'),
      field('unit', 'unit', 'string', 'count'),
    ]).message).toBe('以下响应字段不是容器类型，不能拥有子字段：data(string)、count(number)');
  });

  it('拒绝循环引用和同级重名', () => {

    expect(validateResponseFieldTree([
      field('a', 'a', 'object', 'b'),
      field('b', 'b', 'object', 'a'),
    ]).message).toBe('响应字段父子关系不能循环引用');

    expect(validateResponseFieldTree([
      field('data', 'data', 'object'),
      field('first', 'name', 'string', 'data'),
      field('second', 'name', 'string', 'data'),
    ]).message).toBe('同级响应字段名称不能重复');
  });

  it('不同父级作用域不会因组合文本相同而误判为同级重名', () => {
    expect(validateResponseFieldTree([
      field('parent:a', 'first', 'object'),
      field('parent', 'second', 'object'),
      field('first-child', 'value', 'string', 'parent:a'),
      field('second-child', 'a:value', 'string', 'parent'),
    ])).toEqual({ valid: true, message: '' });
  });

  it('允许八层并拒绝九层响应字段树', () => {
    const eightFields = Array.from({ length: 8 }, (_, index) => field(
      `depth-${index + 1}`,
      `depth${index + 1}`,
      'object',
      index === 0 ? undefined : `depth-${index}`,
    ));
    expect(validateResponseFieldTree(eightFields).valid).toBe(true);

    const nineFields = [...eightFields, field('depth-9', 'depth9', 'string', 'depth-8')];
    expect(validateResponseFieldTree(nineFields).message).toBe('响应字段嵌套深度不能超过 8');
  });

  it('删除整个子树时移除当前字段和全部后代', () => {
    expect(deleteResponseFieldSubtree(buildFields(), 'users').map((item) => item.paramKey))
      .toEqual(['data', 'meta', 'page']);
  });

  it('提升根字段的直接子字段并保留更深层级关系', () => {
    const promoted = promoteResponseFieldChildren(buildFields(), 'data');

    expect(promoted.map((item) => item.paramKey)).toEqual(['users', 'name', 'meta', 'page']);
    expect(promoted.find((item) => item.paramKey === 'users')).not.toHaveProperty('parentParamKey');
    expect(promoted.find((item) => item.paramKey === 'meta')).not.toHaveProperty('parentParamKey');
    expect(promoted.find((item) => item.paramKey === 'name')?.parentParamKey).toBe('users');
    expect(promoted.find((item) => item.paramKey === 'page')?.parentParamKey).toBe('meta');
  });

  it('提升嵌套字段的直接子字段到原父级', () => {
    const promoted = promoteResponseFieldChildren(buildFields(), 'users');

    expect(promoted.find((item) => item.paramKey === 'name')?.parentParamKey).toBe('data');
    expect(validateResponseFieldTree(promoted).valid).toBe(true);
  });

  it('提升导致同级重名时由完整校验拒绝', () => {
    const fields = [
      field('data', 'data', 'object'),
      field('user', 'user', 'object', 'data'),
      field('nested-name', 'name', 'string', 'user'),
      field('root-name', 'name', 'string', 'data'),
    ];

    expect(validateResponseFieldTree(promoteResponseFieldChildren(fields, 'user')).message)
      .toBe('同级响应字段名称不能重复');
  });
});
