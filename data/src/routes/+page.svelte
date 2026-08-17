<script>
	import HKInfo from '$lib/components/HKInfo.svelte';
	import { loadingStates } from '$lib/stores/loading.svelte.js';

	let { data } = $props();
</script>

{#if loadingStates.pageLoading}
	<div class="flex justify-center items-center min-h-screen" aria-live="polite" aria-label="正在加载页面">
		<div class="text-center">
			<span class="loading loading-spinner loading-lg" aria-label="正在加载页面内容"></span>
			<p class="mt-4 text-lg">正在加载 HomeKey 信息...</p>
		</div>
	</div>
{:else}
	<HKInfo hkInfo={data.hkInfo} error={data.error} />
{/if}
