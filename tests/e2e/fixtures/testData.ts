/** E2E 使用的公开用户数据。 */
export interface TestUser {
  /** 用户 ID。 */
  id: number;
  /** 用户名。 */
  userName: string;
  /** 登录账号。 */
  userAccount: string;
  /** 用户角色。 */
  userRole: 'user' | 'admin';
}

/** E2E 使用的公开接口数据。 */
export interface TestInterface {
  /** 接口 ID。 */
  id: number;
  /** 接口名称。 */
  name: string;
  /** SDK 方法名。 */
  sdkMethodName: string;
  /** 接口描述。 */
  description: string;
  /** 展示地址。 */
  url: string;
  /** 网关路径。 */
  path: string;
  /** 真实服务地址。 */
  targetHost: string;
  /** 请求参数模板。 */
  requestParams: string;
  /** 请求方法。 */
  method: string;
  /** 配额类型。 */
  quotaType: string;
  /** 初始额度。 */
  initialQuota: number;
  /** 接口状态。 */
  status: number;
  /** 累计调用次数。 */
  totalNum: number;
  /** 文档维护状态。 */
  docStatus: 'DRAFT' | 'READY';
  /** 更新时间。 */
  updateTime: string;
}

/** E2E 使用的配额配置数据。 */
export interface TestQuotaConfig {
  /** 配额配置 ID。 */
  id: number;
  /** 配额类型。 */
  quotaType: string;
  /** 配额说明。 */
  quotaTypeText: string;
  /** 初始额度。 */
  initialQuota: number;
  /** 是否为有限额度。 */
  limited: boolean;
  /** 更新时间。 */
  updateTime: string;
}

/** 虚构管理员账号。 */
export const ADMIN_USER: TestUser = {
  id: 9001,
  userName: '测试管理员',
  userAccount: 'e2eadmin',
  userRole: 'admin',
};

/** 虚构普通用户账号。 */
export const NORMAL_USER: TestUser = {
  id: 9002,
  userName: '测试用户',
  userAccount: 'e2e_user',
  userRole: 'user',
};

/** 虚构管理员密码。 */
export const ADMIN_PASSWORD = 'E2ePassword123';

/** 创建各测试独享的接口数据。 */
export const createInterfaces = (): TestInterface[] => [
  {
    id: 101,
    name: '库存查询',
    sdkMethodName: 'queryInventory',
    description: '查询商品库存',
    url: '/gateway/inventory',
    path: '/api/inventory',
    targetHost: 'http://inventory-service:8080',
    requestParams: '{"sku":"string"}',
    method: 'POST',
    quotaType: 'BASIC_QUOTA',
    initialQuota: 100,
    status: 0,
    totalNum: 18,
    docStatus: 'READY',
    updateTime: '2026-07-25T08:00:00',
  },
  {
    id: 102,
    name: '物流追踪',
    sdkMethodName: 'trackShipment',
    description: '查询物流轨迹',
    url: '/gateway/shipment',
    path: '/api/shipment',
    targetHost: 'http://shipment-service:8080',
    requestParams: '{"trackingNo":"string"}',
    method: 'GET',
    quotaType: 'ADVANCED_TRIAL',
    initialQuota: 20,
    status: 1,
    totalNum: 31,
    docStatus: 'READY',
    updateTime: '2026-07-25T08:30:00',
  },
];

/** 创建各测试独享的配额数据。 */
export const createQuotaConfigs = (): TestQuotaConfig[] => [
  {
    id: 1,
    quotaType: 'BASIC_QUOTA',
    quotaTypeText: '基础额度',
    initialQuota: 100,
    limited: true,
    updateTime: '2026-07-25T08:00:00',
  },
  {
    id: 2,
    quotaType: 'FREE_UNLIMITED',
    quotaTypeText: '免费无限',
    initialQuota: 0,
    limited: false,
    updateTime: '2026-07-25T08:00:00',
  },
  {
    id: 3,
    quotaType: 'ADVANCED_TRIAL',
    quotaTypeText: '高级体验',
    initialQuota: 20,
    limited: true,
    updateTime: '2026-07-25T08:00:00',
  },
];

/** 新增接口表单使用的公开业务数据。 */
export const NEW_INTERFACE = {
  name: '天气预警',
  sdkMethodName: 'getWeatherAlert',
  description: '查询指定城市的天气预警',
  path: '/api/weather/alert',
  targetHost: 'http://weather-service:8080',
  url: '/gateway/weather/alert',
  requestParams: '{"city":"string"}',
  method: 'POST',
  quotaType: 'BASIC_QUOTA',
};
