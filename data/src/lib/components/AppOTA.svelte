<script lang="ts">
	import { onDestroy, onMount } from "svelte";
	import ws, { type WebSocketEvent } from "$lib/services/ws.js";
	import type { ApiResponse, Either, OTAStatus } from "$lib/types/api";
	import { type WebSocketState } from "$lib/stores/websocket.svelte";
    import { systemInfo } from "$lib/stores/system.svelte";
    import { getChipModelString } from "$lib/utils/chipModel";

	let firmwareFile = $state<File | null>(null);
	let littlefsFile = $state<File | null>(null);
	let uploading = $state(false);
	let currentUploadType = $state("");
	let sequentialUpload = $state(false);
	let otaStatus = $state({
		in_progress: false,
		bytes_written: 0,
		total_bytes: 0,
		progress_percent: 0,
		error: "",
		current_version: "",
		compile_date: "",
		compile_time: "",
		running_partition: "",
		next_update_partition: "",
		upload_type: "",
	});
  let chipModel = $derived(systemInfo.chip_model || 0);

	let otaLogs = $state<
		{ type: string; message: string; timestamp: string }[]
	>([]);
	let firmwareInput = $state<HTMLInputElement | null>(null);
	let littlefsInput = $state<HTMLInputElement | null>(null);

	let lastLoggedPercent = $state(0);

	let progressPercent = $derived(otaStatus.progress_percent || 0);

	let currentBytes = $derived(otaStatus.bytes_written || 0);

	let totalBytes = $derived(otaStatus.total_bytes || getCurrentFileSize());

	function getCurrentFileSize() {
		if (currentUploadType === "firmware" && firmwareFile) {
			return firmwareFile.size;
		} else if (currentUploadType === "littlefs" && littlefsFile) {
			return littlefsFile.size;
		}
		return 0;
	}

	let isDisabled = $derived(otaStatus.in_progress || uploading);

	let canUploadFirmware = $derived(firmwareFile && !isDisabled);

	let canUploadLittleFS = $derived(littlefsFile && !isDisabled);

	let canUploadBoth = $derived(firmwareFile && littlefsFile && !isDisabled);

	let currentUploadStep = $derived(
		otaStatus.upload_type === "firmware"
			? "固件"
			: otaStatus.upload_type === "littlefs"
				? "LittleFS"
				: "上传",
	);
	let uploadStepText = $derived(
		sequentialUpload
			? otaStatus.upload_type === "firmware"
				? "步骤 1/2：正在上传固件..."
				: otaStatus.upload_type === "littlefs"
					? "步骤 2/2：正在上传 LittleFS..."
					: ""
			: "",
	);
	function formatBytes(bytes: number) {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	}

	function addLog(type: string, message: string) {
		const timestamp = new Date().toLocaleString();
		otaLogs.unshift({ type, message, timestamp });

		if (otaLogs.length > 20) {
			otaLogs = otaLogs.slice(0, 20);
		}
	}
	function handleWebSocketMessage(
		evt: WebSocketEvent<Either<OTAStatus, WebSocketState>>,
	) {
		if (evt.type === "message" && evt.data.type === "ota_status") {
			const previousStatus = { ...otaStatus };
			otaStatus = { ...otaStatus, ...evt.data };

			if (evt.data.error && evt.data.error !== previousStatus.error) {
				addLog("error", `OTA 错误：${evt.data.error}`);
			} else if (
				evt.data.in_progress &&
				evt.data.progress_percent !== undefined
			) {
				const percent = Math.round(evt.data.progress_percent);
				if (
					percent > 0 &&
					percent !== lastLoggedPercent &&
					percent % 10 === 0
				) {
					addLog("info", `上传进度：${percent}%`);
					lastLoggedPercent = percent;
				}
			} else if (!evt.data.in_progress && previousStatus.in_progress) {
				lastLoggedPercent = 0;
			}
		} else if(evt.type == "message" && evt.data.type == "ota_info") {
			otaStatus = { ...otaStatus, ...evt.data };
		} else if (evt.type == "status" && evt.data.state == "open") {
			requestOTAInfo();
		}
	}

	function onFirmwareSelected(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		if (file.name.endsWith(".bin")) {
			firmwareFile = file;
			addLog(
				"info",
				`已选择固件：${file.name}（${formatBytes(file.size)}）`,
			);
		} else {
			addLog("error", "请选择 .bin 格式的固件文件");
			clearFirmwareInput();
		}
	}

	function onLittlefsSelected(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (!file) return;

		if (file.name.endsWith(".bin")) {
			littlefsFile = file;
			addLog(
				"info",
				`已选择 LittleFS：${file.name}（${formatBytes(file.size)}）`,
			);
		} else {
			addLog("error", "请选择 .bin 格式的 LittleFS 文件");
			clearLittlefsInput();
		}
	}

	function clearFirmwareInput() {
		if (firmwareInput) {
			firmwareInput.value = "";
		}
	}

	function clearLittlefsInput() {
		if (littlefsInput) {
			littlefsInput.value = "";
		}
	}

	function clearFirmwareFile() {
		firmwareFile = null;
		clearFirmwareInput();
		addLog("info", "已清除固件文件");
	}

	function clearLittlefsFile() {
		littlefsFile = null;
		clearLittlefsInput();
		addLog("info", "已清除 LittleFS 文件");
	}

	// OTA operations
	async function uploadFirmware(skipReboot = false) {
		if (!firmwareFile) {
			addLog("error", "请先选择固件文件");
			return false;
		}

		if (isDisabled) {
			addLog("error", "已有上传正在进行");
			return false;
		}

		uploading = true;
		currentUploadType = "firmware";
		lastLoggedPercent = 0;
		addLog("info", `开始上传固件：${firmwareFile.name}`);

		try {
			const url = `/ota/upload?skipReboot=${skipReboot}`;
			const response = await fetch(url, {
				method: "POST",
				body: firmwareFile,
				headers: {
					"Content-Type": "application/octet-stream",
				},
			});

			const result: ApiResponse<undefined> = await response.json();
			if (result.success) {
				addLog(
					"success",
					result.message || "固件上传成功",
				);
				if (!skipReboot) {
					clearFirmwareFile();
				}
				return true;
			} else {
				addLog("error", result.error || "固件上传失败");
				return false;
			}
		} catch (error) {
			console.error("Firmware upload failed:", error);
			addLog(
				"error",
				`固件上传失败：${error instanceof Error ? error.message : String(error)}`,
			);
			return false;
		} finally {
			if (!skipReboot) {
				uploading = false;
				currentUploadType = "";
			}
		}
	}

	async function uploadLittleFS(ignoreDisabled = false, skipReboot = true) {
		if (!littlefsFile) {
			addLog("error", "请先选择 LittleFS 文件");
			return false;
		}

		if (isDisabled && !ignoreDisabled) {
			addLog("error", "已有上传正在进行");
			return false;
		}

		uploading = true;
		currentUploadType = "littlefs";
		lastLoggedPercent = 0;
		addLog("info", `开始上传 LittleFS：${littlefsFile.name}`);

		try {
			const response = await fetch(
				`/ota/littlefs?skipReboot=${skipReboot}`,
				{
					method: "POST",
					body: littlefsFile,
					headers: {
						"Content-Type": "application/octet-stream",
					},
				},
			);

			const result: ApiResponse<undefined> = await response.json();
			if (result.success) {
				addLog(
					"success",
					result.message || "LittleFS 上传成功",
				);
				clearLittlefsFile();
				return true;
			} else {
				addLog("error", result.error || "LittleFS 上传失败");
				return false;
			}
		} catch (error) {
			console.error("LittleFS upload failed:", error);
			addLog(
				"error",
				`LittleFS 上传失败：${error instanceof Error ? error.message : String(error)}`,
			);
			return false;
		} finally {
			uploading = false;
			currentUploadType = "";
		}
	}

	async function uploadBoth() {
		if (!firmwareFile || !littlefsFile) {
			addLog("error", "请同时选择固件和 LittleFS 文件");
			return;
		}

		if (isDisabled) {
			addLog("error", "已有上传正在进行");
			return;
		}

		sequentialUpload = true;
		addLog(
			"info",
			"开始顺序上传：先固件后 LittleFS",
		);

		try {
			const firmwareSuccess = await uploadFirmware(true);
			if (!firmwareSuccess) {
				throw new Error("固件上传失败");
			}

			await new Promise((resolve) => setTimeout(resolve, 1000));

			const littlefsSuccess = await uploadLittleFS(true, false);
			if (!littlefsSuccess) {
				throw new Error("LittleFS 上传失败");
			}

			addLog(
				"success",
				"两个文件均已上传成功！设备即将重启。",
			);

			clearFirmwareFile();
			clearLittlefsFile();
		} catch (error) {
			console.error("Sequential upload failed:", error);
			addLog(
				"error",
				`顺序上传失败：${error instanceof Error ? error.message : String(error)}`,
			);
		} finally {
			uploading = false;
			currentUploadType = "";
			sequentialUpload = false;
		}
	}

	function requestOTAInfo() {
		if (ws && ws.connected) {
			ws.send({ type: "ota_info" });
		}
	}

	let wsUnsubscribe = $state<(() => void) | null>(null);

	onMount(() => {
		if (ws && typeof ws.on === "function") {
			wsUnsubscribe = ws.on(handleWebSocketMessage);
		} else {
			addLog("error", "WebSocket 服务不可用");
		}

		requestOTAInfo();
	});

	onDestroy(() => {
		if (wsUnsubscribe && typeof wsUnsubscribe === "function") {
			wsUnsubscribe();
		}
	});
</script>

<div class="flex flex-col py-6 gap-6 items-center">
	<!-- OTA Update Card -->
	<div class="card bg-base-200 shadow-xl max-w-4xl">
		<h2 class="card-title p-4 pb-0">
			<div class="badge badge-warning badge-md">OTA</div>
			固件与文件系统更新
		</h2>
		<div class="card-body p-4">
			<!-- Current Firmware Info -->
			<div
				class="stats stats-vertical md:stats-horizontal shadow bg-base-100 w-full mb-6"
			>
				<div class="stat">
					<div class="stat-title">当前版本</div>
					<div class="stat-value text-lg">
						{otaStatus.current_version || "未知"}
					</div>
					<div class="stat-desc">
						{otaStatus.compile_date}
						{otaStatus.compile_time}
					</div>
				</div>
        <div class="stat">
            <div class="stat-title">芯片型号</div>
            <div class="stat-value text-lg">
                {getChipModelString(chipModel)}
            </div>
        </div>
				<div class="stat">
					<div class="stat-title">运行分区</div>
					<div class="stat-value text-lg">
						{otaStatus.running_partition || "未知"}
					</div>
				</div>
				<div class="stat">
					<div class="stat-title">更新分区</div>
					<div class="stat-value text-lg">
						{otaStatus.next_update_partition || "未知"}
					</div>
				</div>
			</div>

			<!-- OTA Status Alert -->
			{#if otaStatus.in_progress}
				<div class="alert alert-info mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="stroke-current shrink-0 w-6 h-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div>
						<h3 class="font-bold">OTA 更新进行中</h3>
						<div class="text-xs">
							{formatBytes(otaStatus.bytes_written)} / {formatBytes(
								otaStatus.total_bytes,
							)}
						</div>
					</div>
				</div>
			{/if}

			{#if otaStatus.error}
				<div class="alert alert-error mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<div>
						<h3 class="font-bold">OTA 错误</h3>
						<div class="text-xs">{otaStatus.error}</div>
					</div>
				</div>
			{/if}

			<!-- File Upload Section -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<!-- Firmware Upload -->
				<div class="form-control w-full">
					<label class="label" for="firmware-input">
						<span class="label-text font-semibold"
							>固件文件 (.bin)</span
						>
					</label>
					<input
						id="firmware-input"
						bind:this={firmwareInput}
						type="file"
						accept=".bin"
						onchange={onFirmwareSelected}
						disabled={isDisabled}
						class="file-input file-input-bordered w-full"
					/>
					<label class="label" for="firmware-input">
						<span class="label-text-alt"
							>选择编译好的固件二进制文件</span
						>
					</label>
				</div>

				<!-- LittleFS Upload -->
				<div class="form-control w-full">
					<label class="label" for="littlefs-input">
						<span class="label-text font-semibold"
							>LittleFS 文件 (.bin)</span
						>
					</label>
					<input
						id="littlefs-input"
						bind:this={littlefsInput}
						type="file"
						accept=".bin"
						onchange={onLittlefsSelected}
						disabled={isDisabled}
						class="file-input file-input-bordered w-full"
					/>
					<label class="label" for="littlefs-input">
						<span class="label-text-alt"
							>选择文件系统二进制文件（可选）</span
						>
					</label>
				</div>
			</div>

			<!-- Selected Files Info -->
			{#if firmwareFile || littlefsFile}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<!-- Firmware File Info -->
					{#if firmwareFile}
						<div class="bg-base-100 rounded-lg p-4">
							<div class="flex items-center justify-between">
								<div>
									<div class="font-semibold text-primary">
										📱 {firmwareFile.name}
									</div>
									<div class="text-sm opacity-70">
										{formatBytes(firmwareFile.size)}
									</div>
								</div>
								<button
									onclick={clearFirmwareFile}
									disabled={isDisabled}
									class="btn btn-ghost btn-sm"
									aria-label="清除固件文件"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						</div>
					{/if}

					<!-- LittleFS File Info -->
					{#if littlefsFile}
						<div class="bg-base-100 rounded-lg p-4">
							<div class="flex items-center justify-between">
								<div>
									<div class="font-semibold text-secondary">
										🗂️ {littlefsFile.name}
									</div>
									<div class="text-sm opacity-70">
										{formatBytes(littlefsFile.size)}
									</div>
								</div>
								<button
									onclick={clearLittlefsFile}
									disabled={isDisabled}
									class="btn btn-ghost btn-sm"
									aria-label="清除 LittleFS 文件"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Progress Bar -->
			{#if isDisabled}
				<div class="mb-4">
					<div class="flex justify-between text-sm mb-2">
						<span>{currentUploadStep} 进度</span>
						<span>{Math.round(progressPercent)}%</span>
					</div>
					<progress
						class="progress"
						class:progress-primary={otaStatus.upload_type ===
							"firmware"}
						class:progress-secondary={otaStatus.upload_type ===
							"littlefs"}
						value={progressPercent}
						max="100"
					></progress>
					<div class="text-xs text-center mt-1 opacity-70">
						{formatBytes(currentBytes)} / {formatBytes(totalBytes)}
					</div>
					{#if sequentialUpload}
						<div class="text-xs text-center mt-1 opacity-70">
							{uploadStepText}
						</div>
					{/if}
				</div>
			{/if}

			<!-- Upload Buttons -->
			<div class="card-actions justify-end gap-2">
				<button
					onclick={() => uploadFirmware()}
					disabled={!canUploadFirmware}
					class="btn btn-primary"
				>
					{#if uploading && currentUploadType === "firmware"}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					{uploading && currentUploadType === "firmware"
						? "上传中..."
						: "上传固件"}
				</button>

				<button
					onclick={() => uploadLittleFS()}
					disabled={!canUploadLittleFS}
					class="btn btn-secondary"
				>
					{#if uploading && currentUploadType === "littlefs"}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					{uploading && currentUploadType === "littlefs"
						? "上传中..."
						: "上传 LittleFS"}
				</button>

				<button
					onclick={uploadBoth}
					disabled={!canUploadBoth}
					class="btn btn-accent"
				>
					{#if uploading && sequentialUpload}
						<span class="loading loading-spinner loading-sm"></span>
					{/if}
					{uploading && sequentialUpload
						? uploadStepText
						: "同时上传"}
				</button>
			</div>

			<!-- Warning Notice -->
			<div class="alert alert-warning mt-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
					/>
				</svg>
				<div>
					<h3 class="font-bold">重要提示</h3>
					<div class="text-xs">
						• 请仅上传为本设备编译的固件文件<br
						/>
						• LittleFS 文件包含网页界面和配置数据<br
						/>
						• “同时上传”会先上传固件，再上传
						LittleFS，期间不会重启<br />
						• 固件更新完成后设备将自动重启<br
						/>
						• 更新过程中请勿断电<br
						/>
						• 更新期间请确保电源稳定
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- OTA Logs Card -->
	<div class="card bg-base-200 shadow-xl w-full max-w-4xl">
		<h2 class="card-title p-4 pb-0">
			<div class="badge badge-info badge-md">信息</div>
			更新日志
		</h2>
		<div class="card-body p-4">
			{#if otaLogs.length === 0}
				<div class="text-center py-8 opacity-70">
					暂无更新记录
				</div>
			{:else}
				<div class="space-y-2">
					{#each otaLogs as log}
						<div class="bg-base-100 rounded-lg p-3 text-sm">
							<div class="flex justify-between items-start">
								<div>
									<div
										class="font-semibold"
										class:text-success={log.type ===
											"success"}
										class:text-error={log.type === "error"}
										class:text-info={log.type === "info"}
									>
										{log.message}
									</div>
									<div class="text-xs opacity-70">
										{log.timestamp}
									</div>
								</div>
								<div
									class="badge badge-sm"
									class:badge-success={log.type === "success"}
									class:badge-error={log.type === "error"}
									class:badge-info={log.type === "info"}
								>
									{log.type === "success"
										? "成功"
										: log.type === "error"
											? "错误"
											: "信息"}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</div>
