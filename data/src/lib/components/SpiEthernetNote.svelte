<script lang="ts">
  let { spiNumBuses = 1, selectedBus = 1 } = $props<{
    spiNumBuses: number;
    selectedBus: number;
  }>();
</script>

<div class="form-control">
  <!-- svelte-ignore a11y_label_has_associated_control -->
  <label class="label">
    <span class="label-text block whitespace-normal break-words max-w-sm">
      注意：您的芯片型号{spiNumBuses === 1
        ? "只支持一个"
        : "支持两个"}通用 SPI {spiNumBuses === 1
        ? "总线"
        : "总线"}
      {spiNumBuses > 1 ? "，以太网已分配到" : "。"}
      {spiNumBuses > 1
        ? selectedBus === 1
          ? "第一条总线。"
          : "第二条总线。"
        : ""}
      <br />
      请确保 PN532 的引脚{selectedBus === 1
        ? "与以太网引脚一致（CS/SS 除外）"
        : "与以太网引脚不冲突"}，
      因为它们将{selectedBus === 1
        ? "共用同一总线。"
        : "在各自独立的总线上初始化。"}
    </span>
  </label>
</div>
