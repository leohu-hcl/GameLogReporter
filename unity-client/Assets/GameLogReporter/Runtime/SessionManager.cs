using System;
using System.Collections;
using UnityEngine;
using System.Text;

namespace GameLogReporter
{
    /// <summary>
    /// 会话管理器 - 负责与服务器交互获取会话ID
    /// </summary>
    public class SessionManager
    {
        private string _apiUrl;
        private SdkLogger _sdkLogger;
        private HttpClient _httpClient;

        public SessionManager(string apiUrl, SdkLogger sdkLogger = null)
        {
            _apiUrl = apiUrl;
            _sdkLogger = sdkLogger;
            _httpClient = new HttpClient(10, sdkLogger);
        }

        /// <summary>
        /// 异步创建会话并获取服务器分配的Session ID
        /// </summary>
        public IEnumerator CreateSession(DeviceInfo deviceInfo, Action<string> onSuccess, Action<string> onError)
        {
            string url = $"{_apiUrl}";

            // 创建请求体，包含设备信息
            var requestBody = new CreateSessionRequest
            {
                deviceId = GenerateDeviceId(), // 生成设备唯一标识
                deviceInfo = deviceInfo,
            };

            yield return _httpClient.Post<CreateSessionRequest, SessionResponse>(
                url,
                requestBody,
                (response) =>
                {
                    if (response != null && response.success && response.data != null)
                    {
                        _sdkLogger?.Debug($"Session created successfully: {response.data.sessionId}", "SessionManager");
                        onSuccess?.Invoke(response.data.sessionId);
                    }
                    else
                    {
                        string errorMsg = "Invalid session response from server";
                        _sdkLogger?.Error(errorMsg, "SessionManager");
                        onError?.Invoke(errorMsg);
                    }
                },
                (error) =>
                {
                    _sdkLogger?.Error($"Failed to create session: {error.message}", "SessionManager");
                    onError?.Invoke(error.message);
                }
            );
        }

        /// <summary>
        /// 会话响应数据结构
        /// </summary>
        [Serializable]
        private class SessionResponse
        {
            public bool success;
            public SessionData data;
        }

        [Serializable]
        private class SessionData
        {
            public string sessionId;
            public string timestamp;
        }

        /// <summary>
        /// 结束会话
        /// </summary>
        public IEnumerator EndSession(string sessionId, Action onSuccess = null, Action<string> onError = null)
        {
            if (string.IsNullOrEmpty(sessionId))
            {
                string errorMsg = "Session ID is required";
                _sdkLogger?.Error(errorMsg, "SessionManager");
                onError?.Invoke(errorMsg);
                yield break;
            }

            string url = $"{_apiUrl}/{sessionId}/end";

            yield return _httpClient.Post<object, SessionResponse>(
                url,
                new object(),
                (response) =>
                {
                    if (response != null && response.success)
                    {
                        _sdkLogger?.Debug($"Session ended successfully: {sessionId}", "SessionManager");
                        onSuccess?.Invoke();
                    }
                    else
                    {
                        string errorMsg = "Invalid response when ending session";
                        _sdkLogger?.Warning(errorMsg, "SessionManager");
                        onError?.Invoke(errorMsg);
                    }
                },
                (error) =>
                {
                    _sdkLogger?.Warning($"Failed to end session: {error.message}", "SessionManager");
                    onError?.Invoke(error.message);
                }
            );
        }
        
        /// <summary>
        /// 发送一次心跳，刷新服务端 lastSeen（保持设备活跃状态在线）。
        /// 失败静默忽略——丢一两次心跳由服务端活跃阈值容忍。
        /// </summary>
        public IEnumerator Heartbeat()
        {
            string url = $"{_apiUrl}/heartbeat";
            var body = new HeartbeatRequest { deviceId = GenerateDeviceId() };

            yield return _httpClient.Post<HeartbeatRequest>(
                url,
                body,
                (_) => { },
                (error) => _sdkLogger?.Debug($"Heartbeat failed: {error.message}", "SessionManager")
            );
        }

        [Serializable]
        private class HeartbeatRequest
        {
            public string deviceId;
        }

        /// <summary>
        /// 生成设备唯一标识
        /// </summary>
        private string GenerateDeviceId()
        {
            // 使用设备信息生成唯一标识
            string uniqueString = SystemInfo.deviceUniqueIdentifier + 
                                SystemInfo.deviceName + 
                                SystemInfo.deviceModel + 
                                SystemInfo.operatingSystem;
            
            using (System.Security.Cryptography.SHA256 sha256Hash = System.Security.Cryptography.SHA256.Create())
            {
                // 将输入字符串转换为字节数组并计算哈希
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(uniqueString));
                
                // 将字节数组转换为十六进制字符串
                StringBuilder builder = new StringBuilder();
                for (int i = 0; i < bytes.Length; i++)
                {
                    builder.Append(bytes[i].ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}