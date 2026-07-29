import { expect, test } from './fixtures/apiMock';
import { ADMIN_USER } from './fixtures/testData';

/** 导航关键计算样式。 */
interface NavigationStyleSnapshot {
  /** 导航布局模式。 */
  display: string;
  /** 导航排列方向。 */
  flexDirection: string;
  /** 导航背景色。 */
  backgroundColor: string;
  /** 导航边框宽度。 */
  borderWidth: string;
  /** 导航圆角。 */
  borderRadius: string;
  /** 导航宽度。 */
  width: number;
}

test('后台与个人中心复用同一种桌面侧栏', async ({ page, apiMock }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await apiMock.authenticateAs(ADMIN_USER);

  await page.goto('/#/admin/dashboard');
  const adminNavigation = page.getByRole('navigation', { name: '管理后台导航' });
  await expect(adminNavigation).toBeVisible();
  await expect(adminNavigation).toHaveClass(/fei-section-navigation/);
  await expect(adminNavigation.locator('a')).toHaveCount(3);
  await expect(adminNavigation.getByRole('link', { name: '工作台' })).toHaveAttribute('aria-current', 'page');

  const adminStyle = await adminNavigation.evaluate<NavigationStyleSnapshot>((element) => {
    const style = window.getComputedStyle(element);
    return {
      display: style.display,
      flexDirection: style.flexDirection,
      backgroundColor: style.backgroundColor,
      borderWidth: style.borderWidth,
      borderRadius: style.borderRadius,
      width: element.getBoundingClientRect().width,
    };
  });
  expect(adminStyle).toMatchObject({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgb(255, 255, 255)',
    borderWidth: '1px',
  });
  expect(adminStyle.width).toBe(240);
  expect(adminStyle.borderRadius).not.toBe('0px');
  await page.screenshot({ path: testInfo.outputPath('admin-desktop-navigation.png') });

  await page.goto('/#/profile/info');
  const profileNavigation = page.getByRole('navigation', { name: '个人中心导航' });
  await expect(profileNavigation).toBeVisible();
  await expect(profileNavigation).toHaveClass(/fei-section-navigation/);
  await expect(profileNavigation.locator('a')).toHaveCount(3);
  await expect(profileNavigation.getByRole('link', { name: '个人信息' })).toHaveAttribute('aria-current', 'page');

  const profileStyle = await profileNavigation.evaluate<NavigationStyleSnapshot>((element) => {
    const style = window.getComputedStyle(element);
    return {
      display: style.display,
      flexDirection: style.flexDirection,
      backgroundColor: style.backgroundColor,
      borderWidth: style.borderWidth,
      borderRadius: style.borderRadius,
      width: element.getBoundingClientRect().width,
    };
  });
  expect(profileStyle).toEqual(adminStyle);
  await page.screenshot({ path: testInfo.outputPath('profile-desktop-navigation.png') });
});

test('公共导航在移动端切换为横向菜单且不超出视口', async ({ page, apiMock }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await apiMock.authenticateAs(ADMIN_USER);
  await page.goto('/#/admin/dashboard');

  const navigation = page.getByRole('navigation', { name: '管理后台导航' });
  await expect(navigation).toBeVisible();
  const mobileStyle = await navigation.evaluate((element) => {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const links = Array.from(element.querySelectorAll('a'));
    return {
      display: style.display,
      width: rect.width,
      right: rect.right,
      linkHeights: links.map((link) => link.getBoundingClientRect().height),
    };
  });

  expect(mobileStyle.display).toBe('grid');
  expect(mobileStyle.width).toBeLessThanOrEqual(390);
  expect(mobileStyle.right).toBeLessThanOrEqual(390);
  expect(mobileStyle.linkHeights.every((height) => height >= 44)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('admin-mobile-navigation.png'), fullPage: true });
});
