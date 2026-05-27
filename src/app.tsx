import Footer from '@/components/Footer';
import RightContent from '@/components/RightContent';
import { getLoginUserUsingGET } from '@/services/feiapi-backend/userController';
import { LinkOutlined } from '@ant-design/icons';
import { SettingDrawer } from '@ant-design/pro-components';
import { history, Link } from '@umijs/max';
import type { RunTimeLayoutConfig } from '@@/plugin-layout/types';
import { message } from 'antd';
import { requestConfig } from './requestConfig';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';

type LayoutRuntimeProps = Parameters<RunTimeLayoutConfig>[0];

/**
 * 获取全局初始状态。
 */
export async function getInitialState(): Promise<InitialState> {
  const state: InitialState = {
    loginUser: undefined,
  };

  try {
    const res = await getLoginUserUsingGET();
    if (res.data) {
      state.loginUser = res.data;
      if (window.location.pathname === '/user/login/') {
        message.success('登录成功');
        history.push('/');
      }
    }
  } catch (error) {
    history.push(loginPath);
  }

  return state;
}

/**
 * ProLayout 运行时配置。
 */
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}: LayoutRuntimeProps) => {
  return {
    layout: 'top',
    rightContentRender: () => <RightContent />,
    waterMarkProps: {
      content: initialState?.loginUser?.userName,
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const pathname = window.location.pathname;
      if (!initialState?.loginUser && pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    layoutBgImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    childrenRender: (children, props) => {
      return (
        <>
          {children}
          {!props.location?.pathname?.includes('/login') && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * 全局请求配置。
 */
export const request = requestConfig;
