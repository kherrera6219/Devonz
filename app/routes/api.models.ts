import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { LLMManager } from '~/lib/modules/llm/manager';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { ProviderInfo } from '~/types/model';
import { getApiKeysFromCookie, getProviderSettingsFromCookie } from '~/lib/api/cookies';

interface ModelsResponse {
  modelList: ModelInfo[];
  providers: ProviderInfo[];
  defaultProvider: ProviderInfo;
}
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.models');
let cachedProviders: ProviderInfo[] | null = null;
let cachedDefaultProvider: ProviderInfo | null = null;

function getProviderInfo(llmManager: LLMManager) {
  if (!cachedProviders) {
    cachedProviders = llmManager.getAllProviders().map((provider) => ({
      name: provider.name,
      staticModels: provider.staticModels,
      getApiKeyLink: provider.getApiKeyLink,
      labelForGetApiKey: provider.labelForGetApiKey,
      icon: provider.icon,
    }));
  }

  if (!cachedDefaultProvider) {
    const defaultProvider = llmManager.getDefaultProvider();
    cachedDefaultProvider = {
      name: defaultProvider.name,
      staticModels: defaultProvider.staticModels,
      getApiKeyLink: defaultProvider.getApiKeyLink,
      labelForGetApiKey: defaultProvider.labelForGetApiKey,
      icon: defaultProvider.icon,
    };
  }

  return { providers: cachedProviders, defaultProvider: cachedDefaultProvider };
}

export const loader = async ({ request, params, context }: LoaderFunctionArgs) => {
  const llmManager = LLMManager.getInstance((context as any).cloudflare?.env);

  // Get client side maintained API keys and provider settings from cookies
  const cookieHeader = request.headers.get('Cookie');
  const apiKeys = getApiKeysFromCookie(cookieHeader);
  const providerSettings = getProviderSettingsFromCookie(cookieHeader);

  const { providers, defaultProvider } = getProviderInfo(llmManager);

  let modelList: ModelInfo[] = [];

  try {
    if (params.provider) {
      // Only update models for the specific provider
      const provider = llmManager.getProvider(params.provider);

      if (provider) {
        modelList = await llmManager.getModelListFromProvider(provider, {
          apiKeys: apiKeys as Record<string, string>,
          providerSettings,
          serverEnv: (context as any).cloudflare?.env,
        });
      }
    } else {
      // Update all models
      modelList = await llmManager.updateModelList({
        apiKeys: apiKeys as Record<string, string>,
        providerSettings,
        serverEnv: (context as any).cloudflare?.env,
      });
    }
  } catch (error) {
    logger.error('Failed to update model list:', error);

    // Return current/static list on error instead of crashing
    modelList = llmManager.getStaticModelList();
  }

  return json<ModelsResponse>({
    modelList,
    providers,
    defaultProvider,
  });
};
