import base from './playwright.config';
import { defineConfig } from '@playwright/test';
export default defineConfig({ ...base, webServer: undefined });
