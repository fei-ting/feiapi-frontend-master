import { expect, test } from './fixtures/apiMock';
import { ADMIN_USER, NEW_INTERFACE } from './fixtures/testData';

test('管理员新增接口并完成发布、下线和删除', async ({ page, apiMock }) => {
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/interfaces');
  await expect(page.getByRole('heading', { name: '接口列表' })).toBeVisible();

  await page.getByRole('button', { name: '新增接口' }).click();
  const configDialog = page.getByRole('dialog', { name: '新增接口' });
  await configDialog.getByLabel('接口名称').fill(NEW_INTERFACE.name);
  await configDialog.getByLabel('SDK 方法名').fill(NEW_INTERFACE.sdkMethodName);
  await configDialog.getByLabel('请求方法').selectOption(NEW_INTERFACE.method);
  await configDialog.getByLabel('配额类型').selectOption(NEW_INTERFACE.quotaType);
  await configDialog.getByLabel('接口描述').fill(NEW_INTERFACE.description);
  await configDialog.getByLabel('网关路径').fill(NEW_INTERFACE.path);
  await configDialog.getByLabel('真实后端地址').fill(NEW_INTERFACE.targetHost);
  await configDialog.getByLabel('展示地址').fill(NEW_INTERFACE.url);
  await configDialog.getByLabel('运行时请求参数模板').fill(NEW_INTERFACE.requestParams);
  await configDialog.getByRole('button', { name: '创建并维护文档' }).click();

  await expect(page).toHaveURL(/#\/admin\/interfaces\/103\/document$/);
  await expect(page.getByText(NEW_INTERFACE.name, { exact: true })).toBeVisible();
  const addRequests = apiMock.requestsFor('POST', '/api/interfaceInfo/add');
  expect(addRequests).toHaveLength(1);
  expect(addRequests[0]?.body).toMatchObject(NEW_INTERFACE);

  await page.getByRole('button', { name: '返回列表' }).click();
  await expect(page).toHaveURL(/#\/admin\/interfaces$/);

  let inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '发布', exact: true }).click();
  await expect(inventoryRow).toContainText('已上线');
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/online')[0]?.body).toEqual({ id: 101 });

  inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '下线', exact: true }).click();
  await expect(inventoryRow).toContainText('已下线');
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/offline')[0]?.body).toEqual({ id: 101 });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('库存查询');
    await dialog.accept();
  });
  await inventoryRow.getByRole('button', { name: '删除', exact: true }).click();

  await expect(page.getByRole('row').filter({ hasText: '库存查询' })).toHaveCount(0);
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/delete')[0]?.body).toEqual({ id: 101 });
});
