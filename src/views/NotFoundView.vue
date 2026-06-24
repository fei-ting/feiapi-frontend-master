<template>
  <div class="fei-app-shell">
    <PageContainer>
      <div class="fei-empty fei-card" style="margin-top: 80px">
        <div class="fei-detail__title" style="font-size: 48px">404</div>
        <p class="fei-section-desc">您访问的页面可能已经移除或输入有误。</p>
        <div style="margin-top: 18px">
          <a class="fei-btn fei-btn--primary" href="#/home">返回首页</a>
        </div>
      </div>
    </PageContainer>
  </div>
</template>

<script setup lang="ts">
import PageContainer from '@/components/PageContainer.vue';
</script>
