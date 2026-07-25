import { expect, test } from './fixtures/apiMock';
import { ADMIN_PASSWORD, ADMIN_USER, NORMAL_USER } from './fixtures/testData';

test('匿名用户访问个人资料时跳转到带原地址的登录页', async ({ page }) => {
  await page.goto('/#/profile/info');

  await expect(page).toHaveURL(/#\/login\?redirect=\/profile\/info$/);
  await expect(page.getByRole('heading', { name: 'FeiAPI' })).toBeVisible();
});

test('普通用户不能进入管理后台', async ({ page, apiMock }) => {
  await apiMock.authenticateAs(NORMAL_USER);
  await page.goto('/#/admin/dashboard');

  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByRole('heading', { name: /让接口能力/ })).toBeVisible();
});

test('管理员通过 CSRF 保护的登录流程进入工作台', async ({ page, apiMock }) => {
  await page.goto('/#/login');
  await page.getByLabel('用户名').fill(ADMIN_USER.userAccount);
  await page.getByLabel('密码').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: '登录', exact: true }).click();

  await expect(page).toHaveURL(/#\/admin\/dashboard$/, { timeout: 5_000 });
  await expect(page.getByRole('heading', { name: /欢迎回来，测试管理员/ })).toBeVisible();

  const loginRequests = apiMock.requestsFor('POST', '/api/user/login');
  expect(loginRequests).toHaveLength(1);
  expect(loginRequests[0]?.body).toEqual({
    userAccount: ADMIN_USER.userAccount,
    userPassword: ADMIN_PASSWORD,
  });
  expect(loginRequests[0]?.headers['x-xsrf-token']).toBe('e2e-csrf-token');
  expect(apiMock.requestsFor('GET', '/api/csrf')).toHaveLength(1);
  expect(apiMock.requestsFor('GET', '/api/user/get/login')).toHaveLength(2);
});
