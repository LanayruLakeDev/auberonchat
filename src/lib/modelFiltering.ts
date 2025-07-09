import { getPopularModels } from './openrouter';
import { CHUTES_SYSTEM_MODELS } from './chutes';
import { LocalStorage } from './localStorage';

export interface ModelFilteringContext {
  hasApiKey: boolean;
  isGuest: boolean;
  mode: 'openrouter' | 'chutes';
}

/**
 * Check if user has an API key configured
 */
export function getUserApiKeyStatus(isGuest: boolean, profile?: any): boolean {
  if (isGuest) {
    // For guests, check localStorage
    const guestApiKey = LocalStorage.getApiKey();
    return !!(guestApiKey && guestApiKey.trim());
  } else {
    // For authenticated users, check profile
    return !!(profile?.openrouter_api_key && profile.openrouter_api_key.trim());
  }
}

/**
 * Get the current user's model filtering context
 */
export function getModelFilteringContext(isGuest: boolean, profile?: any): ModelFilteringContext {
  const hasApiKey = getUserApiKeyStatus(isGuest, profile);
  
  return {
    hasApiKey,
    isGuest,
    mode: hasApiKey ? 'openrouter' : 'chutes'
  };
}

/**
 * Categorize models by availability
 */
export function categorizeModels() {
  const allOpenRouterModels = getPopularModels();
  const chutesModels = CHUTES_SYSTEM_MODELS;
  
  // Models available in both systems
  const sharedModels = allOpenRouterModels.filter(model => 
    chutesModels.includes(model)
  );
  
  // Models only available on OpenRouter
  const openRouterOnlyModels = allOpenRouterModels.filter(model => 
    !chutesModels.includes(model)
  );
  
  // Models only available on Chutes (shouldn't be any, but good to check)
  const chutesOnlyModels = chutesModels.filter(model => 
    !allOpenRouterModels.includes(model)
  );
  
  return {
    shared: sharedModels,
    openRouterOnly: openRouterOnlyModels,
    chutesOnly: chutesOnlyModels,
    allOpenRouter: allOpenRouterModels,
    allChutes: chutesModels
  };
}

/**
 * Get filtered models based on user's API key status
 */
export function getFilteredModels(context: ModelFilteringContext): string[] {
  const { shared, allOpenRouter, allChutes } = categorizeModels();
  
  if (context.hasApiKey) {
    // User has API key - show all OpenRouter models
    return allOpenRouter;
  } else {
    // User has no API key - show only Chutes-supported models
    return allChutes;
  }
}

/**
 * Check if a specific model is available to the user
 */
export function isModelAvailable(model: string, context: ModelFilteringContext): boolean {
  const availableModels = getFilteredModels(context);
  return availableModels.includes(model);
}

/**
 * Get model availability info for UI display
 */
export function getModelAvailabilityInfo(model: string) {
  const { shared, openRouterOnly, chutesOnly } = categorizeModels();
  
  if (shared.includes(model)) {
    return {
      type: 'shared' as const,
      label: 'Available in both modes',
      icon: '🔄'
    };
  } else if (openRouterOnly.includes(model)) {
    return {
      type: 'openrouter-only' as const,
      label: 'Requires API key',
      icon: '🔑'
    };
  } else if (chutesOnly.includes(model)) {
    return {
      type: 'chutes-only' as const,
      label: 'System provider only',
      icon: '🆓'
    };
  } else {
    return {
      type: 'unknown' as const,
      label: 'Unknown availability',
      icon: '❓'
    };
  }
}

/**
 * Get user mode description for UI
 */
export function getUserModeDescription(context: ModelFilteringContext) {
  if (context.hasApiKey) {
    return {
      mode: 'OpenRouter' as const,
      description: 'Using your personal API key',
      icon: '🔑',
      color: 'blue'
    };
  } else {
    return {
      mode: 'Chutes AI' as const,
      description: 'Using system provider',
      icon: '🆓',
      color: 'green'
    };
  }
}
