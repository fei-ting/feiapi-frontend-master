<template>
  <section class="fei-doc-section">
    <div class="fei-doc-section__heading">
      <div><span>02</span><h2>请求 Header</h2></div>
      <p>协议 Header 由系统派生，管理员无需维护</p>
    </div>
    <div class="fei-system-header" role="group" aria-label="系统请求 Header">
      <div><span>名称</span><strong>Content-Type</strong></div>
      <div><span>类型</span><strong>string</strong></div>
      <div><span>必填</span><strong>是</strong></div>
      <div><span>值</span><strong class="fei-system-header__value">{{ requestContentType }}</strong></div>
    </div>
  </section>
</template>

<script setup lang="ts">
/** 系统请求 Header 组件属性。 */
interface SystemRequestHeaderSummaryProps {
  /** 当前文档请求内容类型。 */
  requestContentType: string;
}

defineProps<SystemRequestHeaderSummaryProps>();
</script>
