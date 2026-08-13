import { expect, test } from './fixtures/apiMock';
import { ADMIN_USER, NEW_INTERFACE } from './fixtures/testData';

test('管理员新增接口并完成发布、下线和删除', async ({ page, apiMock }) => {
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/interfaces');
  await expect(page.getByRole('heading', { name: '接口列表' })).toBeVisible();

  await page.getByRole('button', { name: '新增接口' }).click();
  const configDialog = page.getByRole('dialog', { name: '新增接口' });
  await configDialog.getByLabel('接口名称').fill(NEW_INTERFACE.name);
  const sdkMethodSelect = configDialog.getByLabel('SDK 方法名');
  await expect(sdkMethodSelect).toBeEnabled();
  await sdkMethodSelect.selectOption(NEW_INTERFACE.sdkMethodName);
  expect(apiMock.requestsFor('GET', '/api/interfaceInfo/sdk-method/list')).toHaveLength(1);
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
  await expect(page.getByText('草稿', { exact: true })).toBeVisible();
  const addRequests = apiMock.requestsFor('POST', '/api/interfaceInfo/add');
  expect(addRequests).toHaveLength(1);
  expect(addRequests[0]?.body).toMatchObject(NEW_INTERFACE);

  await page.getByLabel('成功响应示例', { exact: true }).fill('{"ok":true}');
  await page.getByRole('button', { name: '完成维护' }).first().click();
  await expect(page.getByText('文档维护已完成', { exact: true })).toBeVisible();
  expect(apiMock.requestsFor('POST', '/api/interfaceDoc/save')[0]?.body).toMatchObject({
    interfaceInfoId: 103,
    docStatus: 'READY',
  });

  await page.getByRole('button', { name: '返回列表' }).click();
  await expect(page).toHaveURL(/#\/admin\/interfaces$/);

  const weatherRow = page.getByRole('row').filter({ hasText: NEW_INTERFACE.name });
  await weatherRow.getByRole('button', { name: '发布', exact: true }).click();
  await expect(weatherRow).toContainText('已上线');

  await weatherRow.getByRole('button', { name: '下线', exact: true }).click();
  await expect(weatherRow).toContainText('已下线');
  await weatherRow.getByRole('button', { name: '编辑', exact: true }).click();
  const editDialog = page.getByRole('dialog', { name: '编辑接口' });
  await editDialog.getByLabel('接口描述').fill('更新后的天气预警公开说明');
  await editDialog.getByRole('button', { name: '保存配置', exact: true }).click();
  await expect(editDialog).toBeHidden();
  await expect(weatherRow).toContainText('文档待完善');
  const weatherPublishButton = weatherRow.getByRole('button', { name: '发布', exact: true });
  await expect(weatherPublishButton).toBeDisabled();
  await expect(weatherPublishButton).toHaveAttribute('title', '请先完成文档维护');
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/update')[0]?.body).toMatchObject({
    id: 103,
    description: '更新后的天气预警公开说明',
  });

  let inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '发布', exact: true }).click();
  await expect(inventoryRow).toContainText('已上线');
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/online').map((request) => request.body))
    .toContainEqual({ id: 101 });

  inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '下线', exact: true }).click();
  await expect(inventoryRow).toContainText('已下线');
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/offline').map((request) => request.body))
    .toContainEqual({ id: 101 });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('库存查询');
    await dialog.accept();
  });
  await inventoryRow.getByRole('button', { name: '删除', exact: true }).click();

  await expect(page.getByRole('row').filter({ hasText: '库存查询' })).toHaveCount(0);
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/delete')[0]?.body).toEqual({ id: 101 });
});

test('文档存在未保存修改时离开页面需要二次确认', async ({ page, apiMock }) => {
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/interfaces/101/document');
  const remarkInput = page.getByLabel('公开备注');
  await expect(remarkInput).toBeVisible();
  await remarkInput.fill('更新后的公开备注');

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('当前文档存在未保存修改，确定离开吗？');
    await dialog.dismiss();
  });
  await page.getByRole('button', { name: '返回列表' }).click();
  await expect(page).toHaveURL(/#\/admin\/interfaces\/101\/document$/);

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toBe('当前文档存在未保存修改，确定离开吗？');
    await dialog.accept();
  });
  await page.getByRole('button', { name: '返回列表' }).click();
  await expect(page).toHaveURL(/#\/admin\/interfaces$/);
});

test('发布前检查通过时只展示结果且不改变接口状态', async ({ page, apiMock }) => {
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/interfaces');

  const inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '检查', exact: true }).click();

  const checkDialog = page.getByRole('dialog', { name: '发布条件已通过' });
  await expect(checkDialog).toBeVisible();
  await expect(inventoryRow).toContainText('已下线');
  expect(apiMock.requestsFor('GET', '/api/interfaceInfo/publish/check').map((request) => request.query))
    .toContainEqual({ id: '101' });
  expect(apiMock.requestsFor('POST', '/api/interfaceInfo/online')).toHaveLength(0);
});

test('正式发布静态检查失败时展示分类问题并保持下线', async ({ page, apiMock }) => {
  apiMock.setPublishCheckIssues(101, [{
    category: 'DOCUMENT',
    ruleCode: 'DOCUMENT_READY_REQUIRED',
    field: 'doc.docStatus',
    message: '接口文档必须完成维护',
  }]);
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/interfaces');

  const inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '发布', exact: true }).click();

  const checkDialog = page.getByRole('dialog', { name: '发布检查未通过' });
  await expect(checkDialog).toBeVisible();
  await expect(checkDialog).toContainText('结构化文档');
  await expect(checkDialog).toContainText('接口文档必须完成维护');
  await expect(inventoryRow).toContainText('已下线');
});

test('发布探测失败时保持下线且不展示静态检查通过弹窗', async ({ page, apiMock }) => {
  apiMock.setPublishProbeFailure(101, {
    stage: 'CONNECTION_TIMEOUT',
    reason: '连接网关或下游服务超时',
  });
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/interfaces');

  const inventoryRow = page.getByRole('row').filter({ hasText: '库存查询' });
  await inventoryRow.getByRole('button', { name: '发布', exact: true }).click();

  await expect(inventoryRow).toContainText('已下线');
  await expect(page.getByRole('dialog', { name: '发布条件已通过' })).toHaveCount(0);
  await expect(page.getByText('发布探测失败[CONNECTION_TIMEOUT]：连接网关或下游服务超时')).toBeVisible();
  expect(apiMock.requestsFor('GET', '/api/interfaceInfo/publish/check')).toHaveLength(0);
});
