import { describe, expectTypeOf, it } from 'vitest';
import type { UserKeyVO, UserVO } from '@/types/user';

describe('用户类型敏感字段边界', () => {
  it('UserVO 不具有 accessKey 属性', () => {
    expectTypeOf<UserVO>().not.toHaveProperty('accessKey');
  });

  it('UserVO 不具有 secretKey 属性', () => {
    expectTypeOf<UserVO>().not.toHaveProperty('secretKey');
  });

  it('UserKeyVO.accessKey 的类型为 string | undefined', () => {
    expectTypeOf<UserKeyVO['accessKey']>().toEqualTypeOf<string | undefined>();
  });

  it('UserKeyVO.secretKey 的类型为 string | undefined', () => {
    expectTypeOf<UserKeyVO['secretKey']>().toEqualTypeOf<string | undefined>();
  });
});
