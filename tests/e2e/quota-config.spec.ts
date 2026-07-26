import { expect, test } from './fixtures/apiMock';
import { ADMIN_USER } from './fixtures/testData';

test('管理员确认后更新有限配额并看到刷新结果', async ({ page, apiMock }) => {
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/quotas');

  await expect(page.getByRole('heading', { name: '配额策略配置' })).toBeVisible();
  const quotaInput = page.getByRole('spinbutton', { name: '基础额度初始额度' });
  await expect(quotaInput).toHaveValue('100');
  await quotaInput.fill('250');

  const quotaCard = page.getByRole('article').filter({ hasText: '基础额度' });
  await quotaCard.getByRole('button', { name: '保存', exact: true }).click();

  expect(apiMock.requestsFor('POST', '/api/interfaceQuotaConfig/update')).toHaveLength(0);
  const dialog = page.getByRole('dialog', { name: '确认修改配额策略' });
  await expect(dialog).toContainText('基础额度');
  await expect(dialog).toContainText('250');
  expect(apiMock.requestsFor('POST', '/api/interfaceQuotaConfig/update')).toHaveLength(0);

  await dialog.getByRole('button', { name: '确认保存' }).click();

  await expect.poll(() => apiMock.requestsFor('POST', '/api/interfaceQuotaConfig/update')).toHaveLength(1);
  expect(apiMock.requestsFor('POST', '/api/interfaceQuotaConfig/update')[0]?.body).toEqual({
    quotaType: 'BASIC_QUOTA',
    initialQuota: 250,
  });
  await expect(page.getByText('配额策略已更新')).toBeVisible();
  await expect(quotaInput).toHaveValue('250');
  await expect(dialog).toBeHidden();

  const unlimitedCard = page.getByRole('article').filter({ hasText: '免费无限' });
  await expect(unlimitedCard.getByText('无限次')).toBeVisible();
  await expect(unlimitedCard.getByRole('spinbutton')).toHaveCount(0);
});
