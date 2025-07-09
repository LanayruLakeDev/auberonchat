// Model comparison analysis
import { getPopularModels } from './openrouter';
import { CHUTES_SYSTEM_MODELS } from './chutes';

console.log('🔍 MODEL ANALYSIS REPORT');
console.log('========================\n');

const openRouterModels = getPopularModels();
const chutesModels = CHUTES_SYSTEM_MODELS;

// Find shared models (appear in both)
const sharedModels = chutesModels.filter(model => openRouterModels.includes(model));

// Find Chutes-only models (only in Chutes, not in OpenRouter)
const chutesOnlyModels = chutesModels.filter(model => !openRouterModels.includes(model));

// Find OpenRouter-only models (only in OpenRouter, not in Chutes)  
const openRouterOnlyModels = openRouterModels.filter(model => !chutesModels.includes(model));

console.log('📊 SUMMARY:');
console.log(`Total Chutes models: ${chutesModels.length}`);
console.log(`Total OpenRouter models: ${openRouterModels.length}`);
console.log(`Shared models (both): ${sharedModels.length}`);
console.log(`Chutes-only models: ${chutesOnlyModels.length}`);
console.log(`OpenRouter-only models: ${openRouterOnlyModels.length}\n`);

console.log('🔄 SHARED MODELS (Available in both Chutes and OpenRouter):');
if (sharedModels.length === 0) {
  console.log('   ❌ None - No models appear in both lists');
} else {
  sharedModels.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model}`);
  });
}

console.log('\n🆓 CHUTES-ONLY MODELS:');
if (chutesOnlyModels.length === 0) {
  console.log('   ❌ None - All Chutes models are also in OpenRouter');
} else {
  chutesOnlyModels.forEach((model, index) => {
    console.log(`   ${index + 1}. ${model}`);
  });
}

console.log('\n🔑 OPENROUTER-ONLY MODELS (First 20):');
openRouterOnlyModels.slice(0, 20).forEach((model, index) => {
  console.log(`   ${index + 1}. ${model}`);
});

if (openRouterOnlyModels.length > 20) {
  console.log(`   ... and ${openRouterOnlyModels.length - 20} more OpenRouter-only models`);
}

export { sharedModels, chutesOnlyModels, openRouterOnlyModels };
