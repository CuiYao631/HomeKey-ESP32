import type { CertificatesStatus, CertificateType, MqttConfig, MiscConfig, ApiResponse, ActionsConfig, ApiError, ApiSuccess } from '../types/api';
import { notifications } from '../stores/notifications.svelte.js';

export async function rebootDevice() {
  try {
    const response = await fetch(`/reboot_device`, {
      method: 'POST'
    });

    if (!response.ok) {
      // the reboot endpoint always sends success=true and message
      // we don't have an API error message to show
      notifications.addError(`请求失败`);
    }
    const result : ApiSuccess = await response.json();
    notifications.addSuccess(result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`发送请求失败: ${message}`);
  }
}

export async function resetPairings() {
  try {
    const response = await fetch(`/reset_hk_pair`, {
      method: 'GET'
    });

    if (!response.ok) {
      notifications.addError(`请求失败`);
    }
    const result : ApiSuccess = await response.json();
    notifications.addSuccess(result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`发送请求失败: ${message}`);
  }
}

export async function resetWifi() {
  try {
    const response = await fetch("/reset_wifi_cred", {
      method: 'GET'
    });

    if (!response.ok) {
      notifications.addError(`请求失败`);
    }
    const result : ApiSuccess = await response.json();
    notifications.addSuccess(result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`发送请求失败: ${message}`);
  }
}

export async function startConfigAP() {
  try {
    const response = await fetch("/start_config_ap", {
      method: 'GET'
    });

    if (!response.ok) {
      notifications.addError(`请求失败`);
    }
    const result : ApiSuccess = await response.json();
    notifications.addSuccess(result.message);
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`发送请求失败: ${message}`);
  }
}

export async function saveConfig<T = MqttConfig | MiscConfig | ActionsConfig>(type: string, data: Partial<T>): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`/config/save?type=${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData : ApiError = await response.json();
      notifications.addError(`保存 ${type} 配置失败: ${errorData.error}`);
      return errorData;
    }

    const result : ApiSuccess = await response.json();
    notifications.addSuccess(result.message);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`保存 ${type} 配置失败: ${message}`);
    return { success: false, error: message };
  }
}

// Certificate management endpoints
export async function uploadCertificate(type: string, content: string | ArrayBuffer): Promise<ApiResponse<undefined>> {
  try {
    const response = await fetch(`/certificates/upload?type=${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-pem-file',
      },
      body: content,
    });

    if (!response.ok) {
      const errorData : ApiError = await response.json();
      notifications.addError(`上传证书失败: ${errorData.error}`);
      return errorData;
    }

    const result: ApiSuccess = await response.json();
    if (result.success) {
      notifications.addSuccess(result.message);
    } else {
      notifications.addError(result.message);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`上传证书失败: ${message}`);
    return { success: false, error: message };
  }
}

export async function getCertificateStatus(): Promise<ApiResponse<CertificatesStatus>> {
  try {
    const response = await fetch(`/certificates/status`);
    console.log(response);
    if (!response.ok) {
      const errorData : ApiError = await response.json();
      notifications.addError(`获取证书状态失败: ${errorData.error}`);
      return errorData;
    }
    const result: ApiResponse<CertificatesStatus> = await response.json();
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`获取证书状态失败: ${message}`);
    return { success: false, error: message };
  }
}

export async function previewBuzzer(pin: number, freq: number, beeps: number): Promise<ApiResponse<undefined>> {
  try {
    const response = await fetch('/actions/preview_buzzer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pin, freq, beeps }),
    });

    if (!response.ok) {
      const errorData: ApiError = await response.json();
      notifications.addError(`蜂鸣器预览失败: ${errorData.error}`);
      return errorData;
    }

    const result: ApiSuccess = await response.json();
    notifications.addSuccess(result.message);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`蜂鸣器预览失败: ${message}`);
    return { success: false, error: message };
  }
}

export async function deleteCertificate(type: CertificateType): Promise<ApiResponse<undefined>> {
  try {
    const response = await fetch(`/certificates/${type}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData : ApiError = await response.json();
      notifications.addError(`删除 ${type} 证书失败: ${errorData.error}`);
      return errorData;
    }

    const result: ApiResponse<undefined> = await response.json();
    if (result.success) {
      notifications.addSuccess(`${type} 证书已成功删除`);
    } else {
      notifications.addError(`删除 ${type} 证书失败: ${result.error || '未知错误'}`);
    }
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    notifications.addError(`删除 ${type} 证书失败: ${message}`);
    return { success: false, error: message };
  }
}
