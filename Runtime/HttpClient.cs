using System;
using System.Collections;
using System.Text;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

namespace GameLogReporter
{
    /// <summary>
    /// HTTP客户端
    /// </summary>
    public class HttpClient
    {
        private int _timeout = 10;
        private SdkLogger _logger;

        public HttpClient(int timeout = 10, SdkLogger logger = null)
        {
            _timeout = timeout;
            _logger = logger;
        }

        /// <summary>
        /// 发送POST请求（泛型版本，自动序列化和反序列化）
        /// </summary>
        public IEnumerator Post<TRequest, TResponse>(
            string url, 
            TRequest requestData, 
            Action<TResponse> onSuccess, 
            Action<HttpError> onError)
        {
            string json = JsonConvert.SerializeObject(requestData, JsonSettings.Default);

            yield return PostInternal(
                url,
                json,
                (responseText) =>
                {
                    try
                    {
                        var response = JsonConvert.DeserializeObject<TResponse>(responseText, JsonSettings.Default);
                        onSuccess?.Invoke(response);
                    }
                    catch (Exception ex)
                    {
                        _logger?.Error($"Failed to deserialize response: {ex.Message}", "HttpClient");
                        onError?.Invoke(new HttpError
                        {
                            errorType = HttpErrorType.DataProcessingError,
                            message = $"Failed to deserialize response: {ex.Message}",
                            statusCode = 0
                        });
                    }
                },
                onError
            );
        }

        /// <summary>
        /// 发送POST请求（字符串版本，返回原始响应）
        /// </summary>
        public IEnumerator Post(
            string url, 
            string json, 
            Action<string> onSuccess, 
            Action<HttpError> onError)
        {
            yield return PostInternal(url, json, onSuccess, onError);
        }

        /// <summary>
        /// 发送POST请求（对象版本，返回原始响应）
        /// </summary>
        public IEnumerator Post<TRequest>(
            string url, 
            TRequest requestData, 
            Action<string> onSuccess, 
            Action<HttpError> onError)
        {
            string json = JsonConvert.SerializeObject(requestData, JsonSettings.Default);
            yield return PostInternal(url, json, onSuccess, onError);
        }

        /// <summary>
        /// 内部POST请求实现
        /// </summary>
        private IEnumerator PostInternal(
            string url, 
            string json, 
            Action<string> onSuccess, 
            Action<HttpError> onError)
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(json);

            using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");
                request.timeout = _timeout;

                yield return request.SendWebRequest();

                if (request.result != UnityWebRequest.Result.Success)
                {
                    var error = ParseError(request);
                    _logger?.Error($"HTTP request failed, URL: {url}, Error: {error.message}", "HttpClient");
                    onError?.Invoke(error);
                }
                else
                {
                    string responseText = request.downloadHandler.text;
                    _logger?.Debug($"HTTP request succeeded: {url}", "HttpClient");
                    onSuccess?.Invoke(responseText);
                }
            }
        }

        /// <summary>
        /// 解析HTTP错误
        /// </summary>
        private HttpError ParseError(UnityWebRequest request)
        {
            HttpError error = new HttpError
            {
                message = request.error,
                statusCode = (int)request.responseCode
            };

            switch (request.result)
            {
                case UnityWebRequest.Result.ConnectionError:
                    error.errorType = HttpErrorType.ConnectionError;
                    error.message = $"Connection error: {request.error}";
                    break;
                    
                case UnityWebRequest.Result.ProtocolError:
                    error.errorType = HttpErrorType.ProtocolError;
                    error.message = $"Protocol error (Status {request.responseCode}): {request.downloadHandler.text}";
                    break;
                    
                case UnityWebRequest.Result.DataProcessingError:
                    error.errorType = HttpErrorType.DataProcessingError;
                    error.message = $"Data processing error: {request.error}";
                    break;
                    
                default:
                    error.errorType = HttpErrorType.Unknown;
                    error.message = $"Unknown error: {request.error}";
                    break;
            }

            return error;
        }

        /// <summary>
        /// 设置超时时间
        /// </summary>
        public void SetTimeout(int timeout)
        {
            _timeout = timeout;
        }
    }

    /// <summary>
    /// HTTP错误类型
    /// </summary>
    public enum HttpErrorType
    {
        ConnectionError,
        ProtocolError,
        DataProcessingError,
        Unknown
    }

    /// <summary>
    /// HTTP错误信息
    /// </summary>
    public class HttpError
    {
        public HttpErrorType errorType;
        public string message;
        public int statusCode;
    }
}
