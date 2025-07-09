// Test file to verify model filtering
import { categorizeModels } from './modelFiltering';
import { getPopularModels } from './openrouter';
import { CHUTES_SYSTEM_MODELS } from './chutes';

console.log('=== MODEL FILTERING TEST ===');

const categories = categorizeModels();

console.log('\n📊 Model Statistics:');
console.log(`Total OpenRouter models: ${categories.allOpenRouter.length}`);
console.log(`Total Chutes models: ${categories.allChutes.length}`);
console.log(`Shared models: ${categories.shared.length}`);
console.log(`OpenRouter-only models: ${categories.openRouterOnly.length}`);
console.log(`Chutes-only models: ${categories.chutesOnly.length}`);

console.log('\n🔄 Shared models (available in both):');
categories.shared.forEach(model => console.log(`  - ${model}`));

console.log('\n🔑 OpenRouter-only models:');
categories.openRouterOnly.slice(0, 10).forEach(model => console.log(`  - ${model}`));
if (categories.openRouterOnly.length > 10) {
  console.log(`  ... and ${categories.openRouterOnly.length - 10} more`);
}

console.log('\n🆓 Chutes-only models:');
categories.chutesOnly.forEach(model => console.log(`  - ${model}`));

console.log('\n✅ Model filtering system ready!');
