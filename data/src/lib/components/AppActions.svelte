<script lang="ts">
  import { saveConfig, previewBuzzer } from "$lib/services/api.js";
  import type { ActionsConfig } from "$lib/types/api";
  import { diff } from "$lib/utils/objDiff";

  let {
    actions,
    error,
  }: { actions: ActionsConfig | null; error?: string | null } = $props();

  let actionsConfig = $state<ActionsConfig>(
    actions ?? {
      neopixelSuccessColor: [
        [0, 0],
        [1, 255],
        [2, 0],
      ],
      neopixelFailureColor: [
        [0, 255],
        [1, 0],
        [2, 0],
      ],
      neopixelTagEventColor: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      neopixelTagEventTime: 1000,
      nfcSuccessPin: 255,
      nfcSuccessTime: 1000,
      nfcSuccessHL: false,
      nfcFailPin: 255,
      nfcFailTime: 1000,
      nfcFailHL: false,
      tagEventPin: 255,
      tagEventTimeout: 1000,
      tagEventHL: false,
      gpioActionPin: 255,
      gpioActionLockState: false,
      gpioActionUnlockState: false,
      gpioActionMomentaryEnabled: 0,
      hkGpioControlledState: false,
      gpioActionMomentaryTimeout: 5000,
      hkDumbSwitchMode: false,
      hkAltActionInitPin: 255,
      hkAltActionInitLedPin: 255,
      hkAltActionInitTimeout: 5000,
      hkAltActionPin: 255,
      hkAltActionTimeout: 5000,
      hkAltActionGpioState: 0,
      buzzerPin: 255,
      buzzerSuccessFreq: 2000,
      buzzerFailFreq: 400,
      buzzerSuccessBeeps: 1,
      buzzerFailBeeps: 2,
      nfcNeopixelPin: 8,
      neoPixelType: 0,
      neopixelSuccessTime: 1000,
      neopixelFailTime: 1000,
    },
  );

  const saveActionsConfig = async (e: any): Promise<void> => {
    try {
      e.preventDefault();
      if (!actionsConfig || !actions) return;
      const result = await saveConfig("actions", diff(actions, actionsConfig));
      if (result.success) {
        actionsConfig = result.data;
        actions = result.data;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      error = message;
      alert(`保存配置出错：${message}`);
    }
  };

  const resetForm = (): void => {
    actionsConfig = actions!;
  };
</script>

<div class="w-full py-6">
  <h1 class="md:text-3xl text-2xl font-bold mb-8">硬件动作</h1>
  {#if !actions && error}
    <div class="text-center text-error">
      <p>错误: {error}</p>
    </div>
  {:else if actions}
    <form onsubmit={saveActionsConfig} class="flex flex-col items-center">
      <div class="flex flex-col max-w-4xl">
        <div class="card bg-base-300 shadow-xl">
          <div class="card-body p-2">
            <div role="tablist" class="tabs tabs-lift">
              <label class="tab">
                <input type="radio" name="action_tabs" checked />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="h-5 w-5 mr-2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z"
                  />
                </svg>
                NFC 触发
              </label>
              <div
                role="tabpanel"
                class="tab-content bg-base-100 border-base-300 p-2"
              >
                <div class="space-y-2">
                  <div class="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" name="pixel-nfc-collapse" checked />
                    <div class="collapse-title font-medium flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 mr-2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                      </svg>
                      像素灯
                    </div>
                    <div class="collapse-content">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">GPIO 引脚</span>
                          </label>
                          <input
                            type="number"
                            bind:value={actionsConfig.nfcNeopixelPin}
                            placeholder="8"
                            class="input input-bordered w-full"
                          />
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">像素灯类型</span>
                          </label>
                          <select
                            bind:value={actionsConfig.neoPixelType}
                            class="select select-bordered w-full"
                          >
                            <option value={0}>RGB</option>
                            <option value={1}>RBG</option>
                            <option value={2}>BRG</option>
                            <option value={3}>BGR</option>
                            <option value={4}>GBR</option>
                            <option value={5}>GRB</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text"
                              >认证成功超时（毫秒）</span
                            >
                          </label>
                          <input
                            type="number"
                            bind:value={actionsConfig.neopixelSuccessTime}
                            placeholder="1000"
                            class="input input-bordered w-full"
                          />
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text"
                              >认证失败超时（毫秒）</span
                            >
                          </label>
                          <input
                            type="number"
                            bind:value={actionsConfig.neopixelFailTime}
                            placeholder="1000"
                            class="input input-bordered w-full"
                          />
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text"
                              >标签事件超时（毫秒）</span
                            >
                          </label>
                          <input
                            type="number"
                            bind:value={actionsConfig.neopixelTagEventTime}
                            placeholder="1000"
                            class="input input-bordered w-full"
                          />
                        </div>
                      </div>
                      <div class="divider">颜色</div>
                      <div class="flex max-md:flex-col max-md:gap-8 mb-4">
                        <div class="flex-1">
                          <h3 class="text-base md:text-md font-bold mb-4">
                            认证成功颜色
                          </h3>
                          <div class="flex gap-4">
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">R</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelSuccessColor[0][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">G</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelSuccessColor[1][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">B</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelSuccessColor[2][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          class="divider md:divider-horizontal max-md:hidden"
                        ></div>
                        <div class="flex-1">
                          <h3 class="text-base md:text-md font-bold mb-4">
                            认证失败颜色
                          </h3>
                          <div class="flex gap-4">
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">R</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelFailureColor[0][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">G</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelFailureColor[1][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">B</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelFailureColor[2][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                          </div>
                        </div>
                        <div
                          class="divider md:divider-horizontal max-md:hidden"
                        ></div>
                        <div class="flex-1">
                          <h3 class="text-base md:text-md font-bold mb-4">
                            标签事件颜色
                          </h3>
                          <div class="flex gap-4">
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">R</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelTagEventColor[0][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">G</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelTagEventColor[1][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                            <div class="form-control">
                              <!-- svelte-ignore a11y_label_has_associated_control -->
                              <label class="label">
                                <span class="label-text">B</span>
                              </label>
                              <input
                                type="number"
                                bind:value={
                                  actionsConfig.neopixelTagEventColor[2][1]
                                }
                                placeholder="255"
                                class="input input-bordered w-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" name="simple-gpio-nfc--collapse" />
                    <div class="collapse-title font-medium flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 mr-2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                      简单 GPIO
                    </div>
                    <div class="collapse-content flex flex-col gap-2">
                      <div class="collapse collapse-plus bg-base-100">
                        <h3
                          class="collapse-title text-base md:text-lg font-bold"
                        >
                          HomeKey 认证
                        </h3>
                        <input type="checkbox" name="hk-auth-collapse" />
                        <div class="collapse-content">
                          <div class="flex flex-wrap justify-around gap-2 mb-4">
                            <fieldset
                              class="fieldset border-base-300 rounded-box w-xs border p-4"
                            >
                              <legend class="fieldset-legend"
                                >认证成功</legend
                              >
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">GPIO 引脚</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.nfcSuccessPin}
                                  placeholder="2"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">超时（毫秒）</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.nfcSuccessTime}
                                  placeholder="1000"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">GPIO 状态</span>
                                </label>
                                <select
                                  bind:value={actionsConfig.nfcSuccessHL}
                                  class="select select-bordered w-full"
                                >
                                  <option value={false}>LOW</option>
                                  <option value={true}>HIGH</option>
                                </select>
                              </div>
                            </fieldset>
                            <fieldset
                              class="fieldset border-base-300 rounded-box w-xs border p-4"
                            >
                              <legend class="fieldset-legend"
                                >认证失败</legend
                              >
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">GPIO 引脚</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.nfcFailPin}
                                  placeholder="2"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">超时（毫秒）</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.nfcFailTime}
                                  placeholder="1000"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">GPIO 状态</span>
                                </label>
                                <select
                                  bind:value={actionsConfig.nfcFailHL}
                                  class="select select-bordered w-full"
                                >
                                  <option value={false}>LOW</option>
                                  <option value={true}>HIGH</option>
                                </select>
                              </div>
                            </fieldset>
                          </div>
                          <div class="collapse collapse-plus bg-base-200">
                            <h3
                              class="collapse-title text-base md:text-lg font-bold"
                            >
                              认证成功后的第二动作
                            </h3>
                            <input type="checkbox" name="2nd-action-collapse" />
                            <div class="collapse-content flex flex-col gap-4">
                              <div class="form-control">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">触发引脚</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.hkAltActionInitPin}
                                  placeholder="255"
                                  min="0"
                                  max="255"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text"
                                    >触发超时（毫秒）</span
                                  >
                                </label>
                                <input
                                  type="number"
                                  bind:value={
                                    actionsConfig.hkAltActionInitTimeout
                                  }
                                  placeholder="5000"
                                  min="0"
                                  max="10000"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text"
                                    >反馈 LED 引脚</span
                                  >
                                </label>
                                <input
                                  type="number"
                                  bind:value={
                                    actionsConfig.hkAltActionInitLedPin
                                  }
                                  placeholder="255"
                                  min="0"
                                  max="255"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">GPIO 引脚</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.hkAltActionPin}
                                  placeholder="2"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">超时（毫秒）</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.hkAltActionTimeout}
                                  placeholder="1000"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">GPIO 状态</span>
                                </label>
                                <select
                                  bind:value={
                                    actionsConfig.hkAltActionGpioState
                                  }
                                  class="select select-bordered w-full"
                                >
                                  <option value={0}>LOW</option>
                                  <option value={1}>HIGH</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="collapse collapse-plus bg-base-100">
                        <h3
                          class="collapse-title text-base md:text-lg font-bold"
                        >
                          NFC 标签事件
                        </h3>
                        <input type="checkbox" name="tag-event-collapse" />
                        <div class="collapse-content">
                          <div class="form-control mb-4">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label class="label">
                              <span class="label-text">GPIO 引脚</span>
                            </label>
                            <input
                              type="number"
                              bind:value={actionsConfig.tagEventPin}
                              placeholder="2"
                              class="input input-bordered w-full"
                            />
                          </div>
                          <div class="form-control mb-4">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label class="label">
                              <span class="label-text">超时（毫秒）</span>
                            </label>
                            <input
                              type="number"
                              bind:value={actionsConfig.tagEventTimeout}
                              placeholder="1000"
                              class="input input-bordered w-full"
                            />
                          </div>
                          <div class="form-control mb-4">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label class="label">
                              <span class="label-text">GPIO 状态</span>
                            </label>
                            <select
                              bind:value={actionsConfig.tagEventHL}
                              class="select select-bordered w-full"
                            >
                              <option value={false}>LOW</option>
                              <option value={true}>HIGH</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div class="collapse collapse-plus bg-base-100">
                        <h3
                          class="collapse-title text-base md:text-lg font-bold"
                        >
                          蜂鸣器
                        </h3>
                        <input type="checkbox" name="buzzer-collapse" />
                        <div class="collapse-content">
                          <div class="flex flex-wrap justify-around gap-2 mb-4">
                            <fieldset
                              class="fieldset border-base-300 rounded-box w-xs border p-4"
                            >
                              <legend class="fieldset-legend">认证成功</legend>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">频率（Hz）</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.buzzerSuccessFreq}
                                  placeholder="2000"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">蜂鸣次数</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.buzzerSuccessBeeps}
                                  placeholder="1"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <button
                                type="button"
                                class="btn btn-sm btn-outline"
                                onclick={() =>
                                  previewBuzzer(
                                    actionsConfig.buzzerPin,
                                    actionsConfig.buzzerSuccessFreq,
                                    actionsConfig.buzzerSuccessBeeps,
                                  )}
                              >
                                预览
                              </button>
                            </fieldset>
                            <fieldset
                              class="fieldset border-base-300 rounded-box w-xs border p-4"
                            >
                              <legend class="fieldset-legend">认证失败</legend>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">频率（Hz）</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.buzzerFailFreq}
                                  placeholder="400"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <div class="form-control mb-4">
                                <!-- svelte-ignore a11y_label_has_associated_control -->
                                <label class="label">
                                  <span class="label-text">蜂鸣次数</span>
                                </label>
                                <input
                                  type="number"
                                  bind:value={actionsConfig.buzzerFailBeeps}
                                  placeholder="2"
                                  class="input input-bordered w-full"
                                />
                              </div>
                              <button
                                type="button"
                                class="btn btn-sm btn-outline"
                                onclick={() =>
                                  previewBuzzer(
                                    actionsConfig.buzzerPin,
                                    actionsConfig.buzzerFailFreq,
                                    actionsConfig.buzzerFailBeeps,
                                  )}
                              >
                                预览
                              </button>
                            </fieldset>
                          </div>
                          <div class="form-control mb-4">
                            <!-- svelte-ignore a11y_label_has_associated_control -->
                            <label class="label">
                              <span class="label-text">GPIO 引脚（255 = 禁用）</span>
                            </label>
                            <input
                              type="number"
                              bind:value={actionsConfig.buzzerPin}
                              placeholder="255"
                              min="0"
                              max="255"
                              class="input input-bordered w-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <label class="tab">
                <input type="radio" name="action_tabs" />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                状态触发
              </label>
              <div
                role="tabpanel"
                class="tab-content bg-base-100 border-base-300 rounded-box p-2"
              >
                <div class="space-y-2">
                  <div class="collapse collapse-arrow bg-base-200">
                    <input
                      type="checkbox"
                      name="gpio-state-trigger-collapse"
                      checked
                    />
                    <div class="collapse-title font-medium flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="1.5"
                        stroke="currentColor"
                        class="w-5 mr-2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H6A2.25 2.25 0 0 0 3.75 6v2.25A2.25 2.25 0 0 0 6 10.5Zm0 9.75h2.25A2.25 2.25 0 0 0 10.5 18v-2.25a2.25 2.25 0 0 0-2.25-2.25H6a2.25 2.25 0 0 0-2.25 2.25V18A2.25 2.25 0 0 0 6 20.25Zm9.75-9.75H18a2.25 2.25 0 0 0 2.25-2.25V6A2.25 2.25 0 0 0 18 3.75h-2.25A2.25 2.25 0 0 0 13.5 6v2.25a2.25 2.25 0 0 0 2.25 2.25Z"
                        />
                      </svg>
                      简单 GPIO
                    </div>
                    <div class="collapse-content">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">GPIO 引脚</span>
                          </label>
                          <input
                            type="number"
                            bind:value={actionsConfig.gpioActionPin}
                            placeholder="2"
                            class="input input-bordered w-full"
                          />
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">GPIO 状态 - 已上锁</span>
                          </label>
                          <select
                            bind:value={actionsConfig.gpioActionLockState}
                            class="select select-bordered w-full"
                          >
                            <option value={false}>LOW</option>
                            <option value={true}>HIGH</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">GPIO 状态 - 已解锁</span
                            >
                          </label>
                          <select
                            bind:value={actionsConfig.gpioActionUnlockState}
                            class="select select-bordered w-full"
                          >
                            <option value={false}>LOW</option>
                            <option value={true}>HIGH</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">允许 HomeKey 控制</span
                            >
                          </label>
                          <select
                            bind:value={actionsConfig.hkGpioControlledState}
                            class="select select-bordered w-full"
                          >
                            <option value={false}>禁用</option>
                            <option value={true}>启用</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">点动模式</span>
                          </label>
                          <select
                            bind:value={
                              actionsConfig.gpioActionMomentaryEnabled
                            }
                            class="select select-bordered w-full"
                          >
                            <option value={0}>禁用</option>
                            <option value={1}>仅 Home App</option>
                            <option value={2}>仅 HomeKey</option>
                            <option value={3}>Home App + HomeKey</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text"
                              >点动超时（毫秒）</span
                            >
                          </label>
                          <input
                            type="number"
                            bind:value={
                              actionsConfig.gpioActionMomentaryTimeout
                            }
                            placeholder="5000"
                            class="input input-bordered w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="collapse collapse-arrow bg-base-200">
                    <input type="checkbox" name="state-collapse" />
                    <div class="collapse-title font-medium">虚拟开关</div>
                    <div class="collapse-content">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">状态</span>
                          </label>
                          <select
                            bind:value={actionsConfig.hkDumbSwitchMode}
                            class="select select-bordered w-full"
                          >
                            <option value={false}>禁用</option>
                            <option value={true}>启用</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text">点动模式</span>
                          </label>
                          <select
                            bind:value={
                              actionsConfig.gpioActionMomentaryEnabled
                            }
                            class="select select-bordered w-full"
                          >
                            <option value={0}>禁用</option>
                            <option value={1}>仅 Home App</option>
                            <option value={2}>仅 HomeKey</option>
                            <option value={3}>Home App + HomeKey</option>
                          </select>
                        </div>
                        <div class="form-control">
                          <!-- svelte-ignore a11y_label_has_associated_control -->
                          <label class="label">
                            <span class="label-text"
                              >点动超时（毫秒）</span
                            >
                          </label>
                          <input
                            type="number"
                            bind:value={
                              actionsConfig.gpioActionMomentaryTimeout
                            }
                            placeholder="5000"
                            class="input input-bordered w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="card-actions self-end mt-6 px-2">
          <button type="submit" class="btn btn-primary">保存并应用</button>
          <button type="button" class="btn btn-ghost" onclick={resetForm}
            >重置</button
          >
        </div>
      </div>
    </form>
  {/if}
</div>
