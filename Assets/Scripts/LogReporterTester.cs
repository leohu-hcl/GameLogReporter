using System.Collections;
using UnityEngine;
using GameLogReporter;

namespace GameLogReporter
{
    /// <summary>
    /// 日志上报测试器 - 用于测试各种日志上报功能
    /// </summary>
    public class LogReporterTester : MonoBehaviour
    {
        [Header("Test Configuration")]
        [SerializeField] private bool autoTestOnStart = false;
        [SerializeField] private float autoTestInterval = 3f;

        private LogReporter _reporter;
        private bool _isTesting = false;

        private void Start()
        {
            // 获取LogReporter实例
            _reporter = LogReporter.Instance;
            
            // 等待会话ID准备就绪后才开始自动测试
            if (autoTestOnStart)
            {
                StartCoroutine(WaitForSessionAndStartTest());
            }
        }
        
        private IEnumerator WaitForSessionAndStartTest()
        {
            // 等待会话ID从服务器获取
            yield return StartCoroutine(WaitForSessionId());
            StartCoroutine(AutoTestCoroutine());
        }
        
        private IEnumerator WaitForSessionId()
        {
            // 等待直到会话ID被设置
            // 由于会话ID是异步获取的，我们等待一段时间以确保它已设置
            float waitTime = 2f; // 等待2秒以确保会话ID已获取
            yield return new WaitForSeconds(waitTime);
        }

        /// <summary>
        /// 自动测试协程
        /// </summary>
        private IEnumerator AutoTestCoroutine()
        {
            _isTesting = true;
            yield return new WaitForSeconds(2f); // 等待初始化完成

            while (_isTesting)
            {
                TestAllLogTypes();
                yield return new WaitForSeconds(autoTestInterval);
            }
        }

        /// <summary>
        /// 测试所有日志类型
        /// </summary>
        [ContextMenu("Test All Log Types")]
        public void TestAllLogTypes()
        {
            Debug.Log("=== 开始测试日志上报 ===");

            TestErrorLog();
            TestWarningLog();
            TestInfoLog();
            TestPerformanceLog();
            TestUserActionLog();
            TestCustomLog();

            Debug.Log("=== 测试完成，请检查服务器日志 ===");
        }

        /// <summary>
        /// 测试错误日志
        /// </summary>
        [ContextMenu("Test Error Log")]
        public void TestErrorLog()
        {
            string errorMessage = "Test error: Something went wrong in test";
            Debug.LogError(errorMessage);
        }

        /// <summary>
        /// 测试警告日志
        /// </summary>
        [ContextMenu("Test Warning Log")]
        public void TestWarningLog()
        {
            string warningMessage = "Test warning: This is a test warning message";
            Debug.LogWarning(warningMessage);
        }

        /// <summary>
        /// 测试信息日志
        /// </summary>
        [ContextMenu("Test Info Log")]
        public void TestInfoLog()
        {
            string infoMessage = "Test info: User performed an action";
            Debug.Log(infoMessage);
        }

        /// <summary>
        /// 测试性能日志
        /// </summary>
        [ContextMenu("Test Performance Log")]
        public void TestPerformanceLog()
        {
            float fps = 1f / Time.deltaTime;
            float memoryMB = System.GC.GetTotalMemory(false) / (1024f * 1024f);
            float loadTimeMs = Time.time * 1000f;

            _reporter.ReportPerformance(fps, memoryMB, loadTimeMs);
        }

        /// <summary>
        /// 测试用户行为日志
        /// </summary>
        [ContextMenu("Test User Action Log")]
        public void TestUserActionLog()
        {
            string action = "button_click";
            var metadata = new System.Collections.Generic.Dictionary<string, object>
            {
                { "button", "start_game" },
                { "level", 1 },
                { "screen", "main_menu" }
            };

            _reporter.ReportUserAction(action, metadata);
        }

        /// <summary>
        /// 测试自定义日志
        /// </summary>
        [ContextMenu("Test Custom Log")]
        public void TestCustomLog()
        {
            string customMessage = "Test custom log message";
            var metadata = new System.Collections.Generic.Dictionary<string, object>
            {
                { "customField1", "value1" },
                { "customField2", 42 },
                { "customField3", true }
            };

            _reporter.ReportCustom(customMessage, LogLevel.Info, metadata);
        }

        /// <summary>
        /// 测试Unity自动收集的日志
        /// </summary>
        [ContextMenu("Test Unity Auto Log")]
        public void TestUnityAutoLog()
        {
            // 这些日志会被LogCollector自动捕获并上报
            Debug.Log("This is a Unity Log message - should be auto collected");
            Debug.LogWarning("This is a Unity Warning message - should be auto collected");
            Debug.LogError("This is a Unity Error message - should be auto collected");

            Debug.Log("[Test] 已触发Unity日志测试（应该被自动收集）");
        }

        /// <summary>
        /// 停止自动测试
        /// </summary>
        [ContextMenu("Stop Auto Test")]
        public void StopAutoTest()
        {
            _isTesting = false;
        }

        /// <summary>
        /// 开始自动测试
        /// </summary>
        [ContextMenu("Start Auto Test")]
        public void StartAutoTest()
        {
            if (!_isTesting)
            {
                StartCoroutine(AutoTestCoroutine());
            }
        }

        /// <summary>
        /// 立即刷新所有待上报的日志
        /// </summary>
        [ContextMenu("Flush All Logs")]
        public void FlushAllLogs()
        {
            _reporter.FlushLogs(true);
        }

        private void OnGUI()
        {
            // 在游戏运行时显示测试按钮（仅用于测试）
            if (Application.isPlaying && _reporter != null)
            {
                GUILayout.BeginArea(new Rect(10, 10, 300, 400));
                GUILayout.Box("Log Reporter Test Panel");

                if (GUILayout.Button("测试错误日志"))
                {
                    TestErrorLog();
                }

                if (GUILayout.Button("测试警告日志"))
                {
                    TestWarningLog();
                }

                if (GUILayout.Button("测试信息日志"))
                {
                    TestInfoLog();
                }

                if (GUILayout.Button("测试性能日志"))
                {
                    TestPerformanceLog();
                }

                if (GUILayout.Button("测试用户行为日志"))
                {
                    TestUserActionLog();
                }

                if (GUILayout.Button("测试自定义日志"))
                {
                    TestCustomLog();
                }

                if (GUILayout.Button("测试Unity自动收集"))
                {
                    TestUnityAutoLog();
                }

                GUILayout.Space(10);

                if (GUILayout.Button("测试所有类型"))
                {
                    TestAllLogTypes();
                }

                if (GUILayout.Button("立即刷新日志"))
                {
                    FlushAllLogs();
                }

                GUILayout.Space(10);

                if (_isTesting)
                {
                    if (GUILayout.Button("停止自动测试"))
                    {
                        StopAutoTest();
                    }
                }
                else
                {
                    if (GUILayout.Button("开始自动测试"))
                    {
                        StartAutoTest();
                    }
                }

                GUILayout.EndArea();
            }
        }
    }
}
