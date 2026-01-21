import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Patent Guide Assistant',
    description: '특허청 사이트 가이드 AI 챗봇',
    version: '1.0.0',
    permissions: ['activeTab', 'storage', 'scripting'],
    host_permissions: ['https://www.patent.go.kr/*'],
  },
});
